#!/usr/bin/env python3
"""PreToolUse guard for the Bash tool (P1-01b).

Blocks destructive Git actions and history changes on `main`:
  * push to `main` (any refspec form, `+`, `refs/heads/`, delete, `--all`,
    `--mirror`, `--prune`, implicit destination when it can be `main`);
  * force push (`-f` anywhere, `--force*`, `+refspec`);
  * `git reset --hard`, `git clean` without dry-run, `git branch -D` /
    `--delete --force`, `git worktree remove --force|-f`;
  * commit / merge / rebase / cherry-pick / revert / am while the target
    repository is on `main`. The target repository comes from the `cwd` field
    of the hook payload, then `cd` / `pushd` / `env -C` / `git -C` in the
    command itself, never from CLAUDE_PROJECT_DIR.

The command is tokenized (quotes, escapes, separators, `$(...)`, backticks),
wrappers (`env`, `timeout`, `sudo`, `command`, ...) are removed, and
`bash -c`, `eval`, `$(...)`, git aliases and `rebase --exec` are analyzed
recursively. In addition the substring rules of the previous version of the
hook are applied to the raw command text unless the line consists only of
git and known inert programs (echo, grep, cat, ...) without file output, so
no command blocked by the previous version is allowed when its dangerous text
can reach an interpreter.

Contract: exit 2 = block (reason on stderr), exit 0 = no decision.
Anything that cannot be analyzed reliably is blocked (fail closed).
"""
import fnmatch
import json
import os
import re
import subprocess
import sys

PROTECTED = "main"
MAX_DEPTH = 6
GIT_TIMEOUT = 5


class Block(Exception):
    pass


def block(reason):
    raise Block(reason)


# ---------------------------------------------------------------- tokenizer

class Word:
    __slots__ = ("text", "dyn", "quoted")

    def __init__(self, text, dyn=False, quoted=False):
        self.text = text
        self.dyn = dyn          # contains $var, $(...), `...`: value unknown statically
        self.quoted = quoted

    def __repr__(self):
        return f"Word({self.text!r}{', dyn' if self.dyn else ''})"


class Parsed:
    def __init__(self):
        self.commands = []      # list[list[Word]]
        self.subs = []          # inner text of $(...), `...`, <(...), >(...)
        self.clean = True       # False: heredoc, unbalanced quotes, substitutions
        self.file_output = False


def _extract_paren(s, i):
    """s[i] == '('. Return (inner, index after the matching ')') or (None, len)."""
    depth = 0
    j = i
    n = len(s)
    quote = None
    while j < n:
        c = s[j]
        if quote:
            if c == "\\" and quote == '"' and j + 1 < n:
                j += 2
                continue
            if c == quote:
                quote = None
        elif c in "'\"":
            quote = c
        elif c == "\\" and j + 1 < n:
            j += 2
            continue
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
        j += 1
    return None, n


def _extract_braces(s, i):
    """s[i] == '{' (after '$'). Return index after the matching '}'."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{":
            depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return j + 1
    return len(s)


_DELIM_RE = re.compile(r"""(?:'[^']*'|"[^"]*"|\\.|[^\s;&|<>()])+""")


def _skip_heredocs(s, i, heredocs, p):
    """Skip heredoc bodies that start at s[i]; collect $(...) from unquoted bodies."""
    for delim, quoted, dash in heredocs:
        body = []
        while i < len(s):
            j = s.find("\n", i)
            line = s[i:] if j < 0 else s[i:j]
            i = len(s) if j < 0 else j + 1
            if (line.lstrip("\t") if dash else line) == delim:
                break
            body.append(line)
        if not quoted:
            text = "\n".join(body)
            k = 0
            while k < len(text):
                if text.startswith("$(", k):
                    inner, k2 = _extract_paren(text, k + 1)
                    p.subs.append(inner or "")
                    k = k2
                elif text[k] == "`":
                    k2 = text.find("`", k + 1)
                    k2 = len(text) if k2 < 0 else k2
                    p.subs.append(text[k + 1:k2])
                    k = k2 + 1
                else:
                    k += 1
    heredocs.clear()
    return i


def tokenize(s):
    p = Parsed()
    cur = []
    state = {"word": None, "dyn": False, "quoted": False, "redirect": False}

    def end_word():
        if state["word"] is not None:
            w = Word(state["word"], state["dyn"], state["quoted"])
            if state["redirect"]:
                state["redirect"] = False
                if w.text not in ("/dev/null", "/dev/stdout", "/dev/stderr") and not re.fullmatch(r"&?\d*-?", w.text):
                    p.file_output = True if state.get("out") else p.file_output
            elif not w.quoted and w.text in ("{", "}"):
                end_cmd()
            else:
                cur.append(w)
        state["word"] = None
        state["dyn"] = False
        state["quoted"] = False

    def end_cmd():
        nonlocal cur
        if cur:
            p.commands.append(cur)
        cur = []

    def add(t):
        state["word"] = (state["word"] or "") + t

    heredocs = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in " \t\r":
            end_word()
            i += 1
        elif c == "\\":
            if i + 1 < n:
                if s[i + 1] != "\n":
                    add(s[i + 1])
                i += 2
            else:
                i += 1
        elif c == "'":
            j = s.find("'", i + 1)
            if j < 0:
                p.clean = False
                add(s[i + 1:])
                state["quoted"] = True
                i = n
            else:
                add(s[i + 1:j])
                state["quoted"] = True
                i = j + 1
        elif c == '"':
            state["quoted"] = True
            add("")
            i += 1
            closed = False
            while i < n:
                d = s[i]
                if d == '"':
                    closed = True
                    i += 1
                    break
                if d == "\\" and i + 1 < n and s[i + 1] in '"\\$`\n':
                    if s[i + 1] != "\n":
                        add(s[i + 1])
                    i += 2
                    continue
                if d == "$" and i + 1 < n and s[i + 1] == "(":
                    inner, j = _extract_paren(s, i + 1)
                    if inner is None:
                        p.clean = False
                        add(s[i:])
                        i = n
                        break
                    p.subs.append(inner)
                    p.clean = False
                    state["dyn"] = True
                    add(s[i:j])
                    i = j
                    continue
                if d == "`":
                    j = s.find("`", i + 1)
                    if j < 0:
                        p.clean = False
                        add(s[i:])
                        i = n
                        break
                    p.subs.append(s[i + 1:j])
                    p.clean = False
                    state["dyn"] = True
                    add(s[i:j + 1])
                    i = j + 1
                    continue
                if d == "$" and i + 1 < n and (s[i + 1].isalnum() or s[i + 1] in "_{@*#?$!-"):
                    state["dyn"] = True
                add(d)
                i += 1
            if not closed:
                p.clean = False
        elif c == "$":
            if i + 1 < n and s[i + 1] == "(":
                inner, j = _extract_paren(s, i + 1)
                if inner is None:
                    p.clean = False
                    add(s[i:])
                    i = n
                    continue
                p.subs.append(inner)
                p.clean = False
                state["dyn"] = True
                add(s[i:j])
                i = j
            elif i + 1 < n and s[i + 1] == "{":
                j = _extract_braces(s, i + 1)
                state["dyn"] = True
                add(s[i:j])
                i = j
            elif i + 1 < n and s[i + 1] == "'":
                # ANSI-C quoting $'...': keep the text, value treated as unknown
                j = s.find("'", i + 2)
                j = n if j < 0 else j + 1
                state["dyn"] = True
                add(s[i:j])
                i = j
            else:
                if i + 1 < n and (s[i + 1].isalnum() or s[i + 1] in "_@*#?$!-"):
                    state["dyn"] = True
                add(c)
                i += 1
        elif c == "`":
            j = s.find("`", i + 1)
            if j < 0:
                p.clean = False
                add(s[i:])
                i = n
                continue
            p.subs.append(s[i + 1:j])
            p.clean = False
            state["dyn"] = True
            add(s[i:j + 1])
            i = j + 1
        elif c == "#" and state["word"] is None:
            j = s.find("\n", i)
            i = n if j < 0 else j
        elif c in ";&|\n":
            end_word()
            end_cmd()
            i += 1
            if c == "\n" and heredocs:
                i = _skip_heredocs(s, i, heredocs, p)
        elif c in "()":
            end_word()
            end_cmd()
            i += 1
        elif c in "<>":
            # numeric fd prefix (2>, 1>>) is not an argument
            if state["word"] is not None and re.fullmatch(r"\d+", state["word"]) and not state["quoted"]:
                state["word"] = None
            end_word()
            if i + 1 < n and s[i + 1] == "(":
                inner, j = _extract_paren(s, i + 1)
                p.subs.append(inner or "")
                p.clean = False
                i = j
                continue
            if c == "<" and s.startswith("<<<", i):
                # herestring: the next word is stdin data, not an argument
                p.clean = False
                i += 3
                state["redirect"] = True
                state["out"] = False
                continue
            if c == "<" and s.startswith("<<", i):
                # heredoc: the body is stdin data; an unquoted body still expands $(...)
                p.clean = False
                i += 2
                dash = i < n and s[i] == "-"
                if dash:
                    i += 1
                while i < n and s[i] in " \t":
                    i += 1
                m = _DELIM_RE.match(s, i)
                raw_delim = m.group(0) if m else ""
                i += len(raw_delim)
                quoted = any(q in raw_delim for q in "'\"\\")
                delim = re.sub(r"['\"\\]", "", raw_delim)
                heredocs.append((delim, quoted, dash))
                continue
            out = c == ">"
            i += 1
            while i < n and s[i] in ">|&":
                i += 1
            state["redirect"] = True
            state["out"] = out
            # `>&2` / `2>&1`: target is an fd
            m = re.match(r"\d+-?|-", s[i:])
            if m and s[i - 1] == "&":
                state["redirect"] = False
                i += m.end()
        else:
            add(c)
            i += 1
    end_word()
    if state["redirect"]:
        p.clean = False
    end_cmd()
    return p


# ---------------------------------------------------------- legacy patterns

_COMMIT_RE = re.compile(r"(^|[;&| ])git (commit|merge|rebase|cherry-pick)( |$)", re.M)


def legacy_reason(t):
    """Substring rules of the previous guard-git.sh (base 1aa11d9), verbatim."""
    if "git reset --hard" in t:
        return "git reset --hard"
    if "git clean -f" in t:
        return "git clean"
    if re.search(r"git push.*--force", t, re.S) or "git push -f" in t or re.search(r"git push.* -f ", t, re.S):
        return "force push"
    if re.search(r"git push.* main", t, re.S) or re.search(r"git push.*:main", t, re.S):
        return "push в main"
    if "git branch -D" in t:
        return "принудительное удаление ветки"
    if "git worktree remove --force" in t:
        return "принудительное удаление worktree"
    return None


# ------------------------------------------------------------------ helpers

SHELLS = {"bash", "sh", "zsh", "dash", "ksh", "mksh", "ash", "fish", "busybox"}
# programs whose arguments and stdin are never executed
INERT = {
    "echo", "printf", "grep", "egrep", "fgrep", "rg", "cat", "head", "tail", "wc", "ls", "pwd",
    "true", "false", ":", "test", "[", "sleep", "which", "type", "basename", "dirname",
    "realpath", "readlink", "sort", "uniq", "cut", "tr", "diff", "cmp", "stat", "file", "date",
    "cd", "pushd", "popd", "mkdir", "touch", "jq",
}
KEYWORDS = {"if", "then", "else", "elif", "fi", "do", "done", "while", "until", "!", "{", "}"}

GIT_SUBCOMMANDS = set("""
add am annotate apply archive bisect blame branch bundle cat-file check-attr check-ignore
check-mailmap check-ref-format checkout checkout-index cherry cherry-pick citool clean clone
column commit commit-graph commit-tree config count-objects credential daemon describe diff
diff-files diff-index diff-tree difftool fast-export fast-import fetch fetch-pack filter-branch
fmt-merge-msg for-each-ref for-each-repo format-patch fsck gc get-tar-commit-id grep gui
hash-object help hook http-backend index-pack init init-db instaweb interpret-trailers log
ls-files ls-remote ls-tree mailinfo mailsplit maintenance merge merge-base merge-file
merge-index merge-tree mergetool mktag mktree multi-pack-index mv name-rev notes pack-objects
pack-redundant pack-refs patch-id prune prune-packed pull push range-diff read-tree rebase
receive-pack reflog refs remote repack replace replay request-pull rerere reset restore
rev-list rev-parse revert rm send-email send-pack shortlog show show-branch show-index show-ref
sparse-checkout stage stash status stripspace submodule switch symbolic-ref tag unpack-file
unpack-objects update-index update-ref update-server-info upload-archive upload-pack var
verify-commit verify-pack verify-tag version whatchanged worktree write-tree lfs
""".split())
HISTORY_OPS = {"commit", "merge", "rebase", "cherry-pick", "revert", "am"}
# option values that are messages/patterns, not commands (for the inert waiver)
INERT_VALUE_SUBS = {"commit", "tag", "log", "show", "shortlog", "whatchanged", "reflog", "stash",
                    "notes", "merge", "grep", "rev-list", "status", "diff", "blame"}
INERT_VALUE_OPTS = {"-m", "--message", "--grep", "--author", "--committer", "-S", "-G",
                    "--format", "--pretty", "--since", "--until", "-e", "--trailer"}


def _base(prog):
    return prog.rsplit("/", 1)[-1]


def _long_matches(word, name, minlen=2):
    """`--name` or an unambiguous-looking abbreviation of it (git parse-options)."""
    if not word.startswith("--"):
        return False
    w = word[2:].split("=", 1)[0]
    return w == name or (len(w) >= minlen and name.startswith(w))


def _short_cluster(word):
    """Letters of a short-option cluster like `-fd`, or '' for anything else."""
    if word.startswith("-") and not word.startswith("--") and len(word) > 1:
        return word[1:]
    return ""


class Ctx:
    def __init__(self, cwd, depth=0):
        self.cwd = cwd            # None = unknown
        self.depth = depth
        self.pending = {}         # realpath(dir) -> set of branch names (None = unknown)
        self.extra_env = {}


def _join(base, path):
    if base is None:
        return None
    if path.startswith("~"):
        path = os.path.expanduser(path)
    return os.path.normpath(os.path.join(base, path))


def _git(dirpath, globals_, args, env_extra):
    env = dict(os.environ)
    env.update(env_extra)
    env["GIT_OPTIONAL_LOCKS"] = "0"
    env["GIT_TERMINAL_PROMPT"] = "0"
    try:
        r = subprocess.run(["git", *globals_, *args], cwd=dirpath, env=env, capture_output=True,
                           text=True, timeout=GIT_TIMEOUT)
    except (OSError, subprocess.SubprocessError):
        return None, ""
    return r.returncode, r.stdout.strip()


UNKNOWN = object()


def current_branch(dirpath, globals_, env_extra):
    """Branch name, None for detached HEAD, UNKNOWN if it cannot be established."""
    if STATE["git_env_dirty"] or dirpath is None or not os.path.isdir(dirpath):
        return UNKNOWN
    rc, out = _git(dirpath, globals_, ["symbolic-ref", "--short", "-q", "HEAD"], env_extra)
    if rc == 0 and out:
        return out
    if rc == 1:
        return None
    return UNKNOWN


def git_config(dirpath, globals_, key, env_extra, regexp=False):
    if STATE["git_env_dirty"] or dirpath is None or not os.path.isdir(dirpath):
        return UNKNOWN
    args = ["config", "--get-regexp", key] if regexp else ["config", "--get", key]
    rc, out = _git(dirpath, globals_, args, env_extra)
    if rc == 0:
        return out
    if rc == 1:
        return ""
    return UNKNOWN


def _is_protected(ref):
    ref = ref.strip()
    for prefix in ("refs/heads/", "heads/"):
        if ref.startswith(prefix):
            ref = ref[len(prefix):]
    return ref == PROTECTED or ("*" in ref or "?" in ref or "[" in ref) and fnmatch.fnmatchcase(PROTECTED, ref)


# ---------------------------------------------------------------- analysis

def analyze_line(text, ctx):
    """Analyze one shell command line. Raises Block."""
    if ctx.depth > MAX_DEPTH:
        block("слишком глубокая вложенность команд — проверить нельзя (fail closed)")
    parsed = tokenize(text)
    sub_ctx = Ctx(ctx.cwd, ctx.depth + 1)
    for sub in parsed.subs:
        analyze_line(sub, sub_ctx)

    waiver = parsed.clean and not parsed.file_output
    simple = []
    for words in parsed.commands:
        if _sets_git_env(words):
            STATE["git_env_dirty"] = True
        cmd = unwrap(words, ctx)
        if cmd is None:
            continue
        simple.append(cmd)
        prog = cmd["prog"]
        if prog is None or (prog not in INERT and prog != "git"):
            waiver = False

    if not waiver:
        reason = legacy_reason(text)
        if reason:
            block(reason)
        if _COMMIT_RE.search(text):
            # previous version: history change blocked when the repository is on main;
            # the repository is now taken from cwd (payload) instead of CLAUDE_PROJECT_DIR
            br = UNKNOWN if STATE["git_env_dirty"] else current_branch(ctx.cwd, [], {})
            if br is UNKNOWN or br == PROTECTED:
                block("изменение истории на main или в репозитории с неизвестной веткой")

    for cmd in simple:
        run_simple(cmd, ctx)


STATE = {"git_env_dirty": False}
_GIT_ENV_RE = re.compile(r"GIT_[A-Z_]*(=|$)")


def _sets_git_env(words):
    """`export GIT_DIR=...`, `GIT_WORK_TREE=x` on its own, `declare -x GIT_...`, `set -a`:
    the repository a later git command uses can no longer be derived from cwd."""
    texts = [x.text for x in words]
    if not texts:
        return False
    if texts[0] in ("export", "declare", "typeset", "readonly", "local", "unset"):
        return any(_GIT_ENV_RE.match(t) for t in texts[1:])
    if texts[0] == "set" and any(t.startswith("-") and "a" in t for t in texts[1:]):
        return True
    if texts[0] in ("source", "."):
        return True
    return all("=" in t and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", t, re.S) for t in texts) and any(
        _GIT_ENV_RE.match(t) for t in texts)


def unwrap(words, ctx):
    """Strip env assignments, keywords and wrappers. Returns dict or None for empty."""
    env = {}
    w = list(words)
    tail_unknown = False
    chdir = []
    while w:
        t = w[0].text
        if not w[0].quoted and t in KEYWORDS:
            w.pop(0)
            continue
        if not w[0].quoted and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", t, re.S):
            k, v = t.split("=", 1)
            env[k] = None if w[0].dyn else v
            w.pop(0)
            continue
        break
    while w:
        prog = _base(w[0].text)
        if w[0].dyn:
            return {"prog": None, "words": w, "env": env, "tail_unknown": tail_unknown, "chdir": chdir}
        if prog in ("command", "builtin", "noglob", "nohup", "time", "exec"):
            if prog == "command" and len(w) > 1 and w[1].text in ("-v", "-V"):
                return {"prog": "type", "words": w, "env": env, "tail_unknown": False, "chdir": chdir}
            w.pop(0)
            while w and w[0].text.startswith("-"):
                opt = w.pop(0).text
                if prog == "exec" and opt == "-a" and w:
                    w.pop(0)
            continue
        if prog in ("nice", "ionice", "chrt", "stdbuf", "timeout", "setsid", "unbuffer", "caffeinate"):
            w.pop(0)
            while w and w[0].text.startswith("-"):
                opt = w.pop(0).text
                if opt in ("-n", "-s", "-k", "-c", "-p", "-o", "-e", "-i") and w and not w[0].text.startswith("-"):
                    w.pop(0)
            if prog == "timeout" and w:
                w.pop(0)  # duration
            if prog == "chrt" and w and re.fullmatch(r"\d+", w[0].text):
                w.pop(0)
            continue
        if prog in ("sudo", "doas"):
            w.pop(0)
            while w and w[0].text.startswith("-"):
                opt = w.pop(0).text
                if opt in ("-u", "-g", "-p", "-C", "-D", "-h", "-r", "-t", "-U", "-T") and w:
                    v = w.pop(0)
                    if opt == "-D":
                        chdir.append(v)
            while w and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", w[0].text, re.S):
                k, v = w.pop(0).text.split("=", 1)
                env[k] = v
            continue
        if prog == "env":
            w.pop(0)
            while w:
                t = w[0].text
                if t == "--":
                    w.pop(0)
                    break
                if t in ("-C", "--chdir"):
                    w.pop(0)
                    if w:
                        chdir.append(w.pop(0))
                    continue
                if t.startswith("--chdir="):
                    chdir.append(Word(t.split("=", 1)[1], w[0].dyn))
                    w.pop(0)
                    continue
                if t in ("-S", "--split-string") or t.startswith("--split-string=") or (t.startswith("-S") and len(t) > 2):
                    # env -S "string": the string is split into a command
                    w.pop(0)
                    rest = t[2:] if t.startswith("-S") and len(t) > 2 else (t.split("=", 1)[1] if "=" in t else (w.pop(0).text if w else ""))
                    rest = " ".join([rest] + [x.text for x in w])
                    return {"prog": "sh", "words": [Word("sh"), Word("-c"), Word(rest)], "env": env,
                            "tail_unknown": False, "chdir": chdir}
                if t in ("-u", "--unset") and len(w) > 1:
                    w.pop(0)
                    w.pop(0)
                    continue
                if t.startswith("-"):
                    w.pop(0)
                    continue
                if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", t, re.S):
                    k, v = w.pop(0).text.split("=", 1)
                    env[k] = v
                    continue
                break
            if not w:
                return {"prog": "env", "words": [], "env": env, "tail_unknown": False, "chdir": chdir}
            continue
        if prog == "xargs":
            w.pop(0)
            while w and w[0].text.startswith("-"):
                opt = w.pop(0).text
                if opt in ("-I", "-i", "-n", "-P", "-d", "-a", "-E", "-L", "-s", "--max-args",
                           "--max-procs", "--delimiter", "--arg-file", "--replace") and w:
                    w.pop(0)
            tail_unknown = True
            if not w:
                return {"prog": "echo", "words": [], "env": env, "tail_unknown": True, "chdir": chdir}
            return {"prog": "xargs", "inner": w, "words": w, "env": env, "tail_unknown": True, "chdir": chdir}
        break
    if not w:
        return None
    return {"prog": _base(w[0].text), "words": w, "env": env, "tail_unknown": tail_unknown, "chdir": chdir}


def run_simple(cmd, ctx):
    prog = cmd["prog"]
    words = cmd["words"]
    saved_cwd = ctx.cwd
    for v in cmd.get("chdir", []):
        ctx.cwd = None if v.dyn else _join(ctx.cwd, v.text)
    try:
        if prog == "xargs":
            inner = unwrap(cmd["inner"], ctx)
            if inner:
                inner["tail_unknown"] = True
                run_simple(inner, ctx)
            return
        if prog in ("cd", "pushd"):
            args = [x for x in words[1:] if not x.text.startswith("-") or x.text == "-"]
            if not args:
                new = os.path.expanduser("~") if prog == "cd" else None
            elif args[0].dyn or args[0].text == "-":
                new = None
            else:
                new = _join(ctx.cwd, args[0].text)
            saved_cwd = new
            return
        if prog == "popd":
            saved_cwd = None
            return
        if prog in SHELLS:
            script = None
            i = 1
            while i < len(words):
                t = words[i].text
                if t.startswith("-") and not t.startswith("--") and "c" in t[1:]:
                    script = words[i + 1] if i + 1 < len(words) else Word("")
                    break
                if t in ("-o", "+o") and i + 1 < len(words):
                    i += 2
                    continue
                if not t.startswith("-") and not t.startswith("+"):
                    break
                i += 1
            if script is not None:
                analyze_line(script.text, Ctx(ctx.cwd, ctx.depth + 1))
            return
        if prog == "eval":
            analyze_line(" ".join(x.text for x in words[1:]), Ctx(ctx.cwd, ctx.depth + 1))
            return
        if prog == "find":
            for i, x in enumerate(words):
                if x.text in ("-exec", "-execdir", "-ok", "-okdir"):
                    j = i + 1
                    part = []
                    while j < len(words) and words[j].text not in (";", "+", "\\;"):
                        part.append(words[j])
                        j += 1
                    inner = unwrap(part, ctx)
                    if inner:
                        inner["tail_unknown"] = True
                        run_simple(inner, ctx)
            return
        if prog == "watch":
            rest = [x for x in words[1:] if not x.text.startswith("-")]
            analyze_line(" ".join(x.text for x in rest), Ctx(ctx.cwd, ctx.depth + 1))
            return
        if prog == "git":
            check_git(words[1:], ctx, cmd["env"], cmd["tail_unknown"])
            return
    finally:
        ctx.cwd = saved_cwd


def check_git(args, ctx, env, tail_unknown):
    env_extra = {k: v for k, v in env.items() if v is not None}
    if any(v is None and k.startswith("GIT_") for k, v in env.items()):
        dyn_env = True
    else:
        dyn_env = False
    dirpath = ctx.cwd
    globals_ = []
    config_kv = []
    i = 0
    while i < len(args):
        a = args[i]
        t = a.text
        if t == "-C" or (t.startswith("-C") and len(t) > 2):
            if t == "-C":
                v = args[i + 1] if i + 1 < len(args) else Word("", dyn=True)
                i += 2
            else:
                v = Word(t[2:], a.dyn)
                i += 1
            dirpath = None if v.dyn else _join(dirpath, v.text)
            continue
        if t == "-c" or (t.startswith("-c") and len(t) > 2):
            if t == "-c":
                v = args[i + 1] if i + 1 < len(args) else Word("", dyn=True)
                i += 2
            else:
                v = Word(t[2:], a.dyn)
                i += 1
            if v.dyn:
                block("git -c со значением, вычисляемым при выполнении — проверить нельзя")
            config_kv.append(v.text)
            globals_ += ["-c", v.text]
            key, _, val = v.text.partition("=")
            if val.startswith("!") or re.search(r"\s", val):
                analyze_line(val.lstrip("!"), Ctx(dirpath, ctx.depth + 1))
            continue
        if t.startswith("--git-dir") or t.startswith("--work-tree"):
            if "=" in t:
                name, val = t.split("=", 1)
                dyn = a.dyn
                i += 1
            else:
                name = t
                nv = args[i + 1] if i + 1 < len(args) else Word("", dyn=True)
                val, dyn = nv.text, nv.dyn
                i += 2
            if dyn:
                dirpath = None
            elif dirpath is not None:
                globals_.append(f"{name}={_join(dirpath, val)}")
            continue
        if t in ("--namespace", "--exec-path", "--config-env", "--super-prefix", "--attr-source") and "=" not in t:
            i += 2
            continue
        if t.startswith("-"):
            i += 1
            continue
        break
    if dyn_env:
        dirpath = None
    if i >= len(args):
        return
    subw = args[i]
    rest = args[i + 1:]
    if subw.dyn:
        block("подкоманда git вычисляется при выполнении — проверить нельзя")
    sub = subw.text

    if sub == "git" and ctx.depth <= MAX_DEPTH:
        # `git git push ...` is not a git command; check the intent anyway
        check_git(rest, Ctx(dirpath, ctx.depth + 1), env, tail_unknown)
        return
    if sub not in GIT_SUBCOMMANDS:
        alias = None
        for kv in config_kv:
            k, _, v = kv.partition("=")
            if k.lower() == f"alias.{sub}".lower():
                alias = v
        if alias is None:
            got = git_config(dirpath, globals_, f"alias.{sub}", env_extra)
            if got is UNKNOWN:
                block(f"не удалось проверить, не является ли `git {sub}` alias (fail closed)")
            alias = got or None
        if alias is None:
            return  # external git-<sub> command, not an alias
        if ctx.depth > MAX_DEPTH:
            block("слишком глубокая вложенность alias — проверить нельзя (fail closed)")
        rest_text = " ".join(_quote(x.text) for x in rest)
        if alias.startswith("!"):
            analyze_line(alias[1:] + " " + rest_text, Ctx(dirpath, ctx.depth + 1))
            return
        expanded = tokenize(alias).commands
        new_args = [Word(x) for x in globals_for_alias(globals_)] + (expanded[0] if expanded else []) + rest
        sub_ctx = Ctx(dirpath, ctx.depth + 1)
        check_git(new_args, sub_ctx, env, tail_unknown)
        return

    # embedded commands in arguments (rebase --exec, bisect run, submodule foreach, ...)
    skip_next = False
    for k, x in enumerate(rest):
        if skip_next:
            skip_next = False
            continue
        if sub in INERT_VALUE_SUBS:
            name = x.text.split("=", 1)[0]
            if name in INERT_VALUE_OPTS:
                skip_next = "=" not in x.text
                continue
            sc = _short_cluster(x.text)
            if sc and len(sc) > 1 and sc[-1] in "mSGe" and sc[:-1].isalpha():
                skip_next = True  # e.g. -am "message"
                continue
            if any(x.text.startswith(o) and len(x.text) > len(o) for o in ("-m", "-S", "-G", "-e")):
                continue
            if sub == "grep" and not x.text.startswith("-"):
                continue
        if re.search(r"\s", x.text):
            reason = legacy_reason(x.text)
            if reason:
                block(reason)
            analyze_line(x.text, Ctx(dirpath, ctx.depth + 1))
    if sub == "bisect" and rest and rest[0].text == "run":
        analyze_line(" ".join(_quote(x.text) for x in rest[1:]), Ctx(dirpath, ctx.depth + 1))
    if sub == "submodule" and any(x.text == "foreach" for x in rest):
        idx = [x.text for x in rest].index("foreach")
        analyze_line(" ".join(x.text for x in rest[idx + 1:] if not x.text.startswith("--")), Ctx(dirpath, ctx.depth + 1))

    if sub == "push":
        check_push(rest, dirpath, globals_, env_extra, tail_unknown)
    elif sub == "reset":
        for x in rest:
            if x.dyn or _long_matches(x.text, "hard", minlen=2):
                block("git reset --hard")
        if tail_unknown:
            block("git reset с аргументами из stdin — проверить нельзя")
    elif sub == "clean":
        force = dry = False
        for x in rest:
            sc = _short_cluster(x.text)
            if x.dyn:
                force = True
            if "f" in sc or _long_matches(x.text, "force", minlen=2):
                force = True
            if "n" in sc or _long_matches(x.text, "dry-run", minlen=2):
                dry = True
            if "i" in sc or _long_matches(x.text, "interactive", minlen=1):
                force = True
        if force or not dry or tail_unknown:
            block("git clean (разрешён только dry-run: git clean -n)")
    elif sub == "branch":
        delete = force = big_d = False
        for x in rest:
            sc = _short_cluster(x.text)
            if "D" in sc:
                big_d = True
            if "d" in sc or _long_matches(x.text, "delete", minlen=3):
                delete = True
            if "f" in sc or _long_matches(x.text, "force", minlen=2):
                force = True
            if x.dyn:
                force = True
        if big_d or (delete and (force or tail_unknown)):
            block("принудительное удаление ветки")
    elif sub == "worktree":
        if rest and rest[0].text in ("remove", "rm"):
            for x in rest[1:]:
                if "f" in _short_cluster(x.text) or _long_matches(x.text, "force", minlen=2) or x.dyn:
                    block("принудительное удаление worktree")
            if tail_unknown:
                block("git worktree remove с аргументами из stdin — проверить нельзя")
    elif sub in ("checkout", "switch"):
        record_checkout(sub, rest, dirpath, ctx)
    if sub in HISTORY_OPS:
        if sub == "rebase":
            pos = [x for x in rest if not x.text.startswith("-")]
            if len(pos) >= 2 and (pos[1].dyn or pos[1].text == PROTECTED):
                block("rebase ветки main")
            for k, x in enumerate(rest):
                if x.text in ("-x", "--exec") and k + 1 < len(rest):
                    analyze_line(rest[k + 1].text, Ctx(dirpath, ctx.depth + 1))
                elif x.text.startswith("--exec="):
                    analyze_line(x.text.split("=", 1)[1], Ctx(dirpath, ctx.depth + 1))
        check_not_on_main(sub, dirpath, globals_, env_extra, ctx)


def globals_for_alias(globals_):
    return globals_


def _quote(t):
    if t and re.fullmatch(r"[A-Za-z0-9_@%+=:,./-]+", t):
        return t
    return "'" + t.replace("'", "'\\''") + "'"


def record_checkout(sub, rest, dirpath, ctx):
    key = os.path.realpath(dirpath) if dirpath else None
    target = UNKNOWN
    create_opts = ("-b", "-B", "--orphan") if sub == "checkout" else ("-c", "-C", "--create", "--force-create", "--orphan")
    i = 0
    while i < len(rest):
        t = rest[i].text
        if t == "--":
            return
        if t in create_opts and i + 1 < len(rest):
            target = UNKNOWN if rest[i + 1].dyn else rest[i + 1].text
            break
        if t == "--detach" or t == "-d" and sub == "switch":
            target = None
            break
        if t == "-":
            target = UNKNOWN
            break
        if t.startswith("-"):
            i += 1
            continue
        target = UNKNOWN if rest[i].dyn else t
        break
    if not rest:
        return
    ctx.pending.setdefault(key, set()).add(target)


def check_not_on_main(sub, dirpath, globals_, env_extra, ctx):
    if STATE["git_env_dirty"]:
        block(f"git {sub} после изменения переменных GIT_* в той же команде — репозиторий не определить (fail closed)")
    br = current_branch(dirpath, globals_, env_extra)
    if br is UNKNOWN:
        block(f"git {sub}: не удалось определить ветку целевого репозитория (fail closed)")
    candidates = {br}
    key = os.path.realpath(dirpath) if dirpath else None
    candidates |= ctx.pending.get(key, set())
    if UNKNOWN in candidates:
        block(f"git {sub} после переключения на неизвестную ветку (fail closed)")
    if PROTECTED in candidates:
        block(f"изменение истории на main (git {sub} в ветке main)")


def check_push(rest, dirpath, globals_, env_extra, tail_unknown):
    if tail_unknown:
        block("git push с аргументами из stdin — проверить нельзя")
    positional = []
    repo_opt = False
    delete = False
    i = 0
    while i < len(rest):
        x = rest[i]
        t = x.text
        if t == "--":
            positional += rest[i + 1:]
            break
        if t.startswith("--"):
            name = t[2:].split("=", 1)[0]
            if "force" in name or _long_matches(t, "force", 3):
                block("force push")
            if _long_matches(t, "mirror", 2):
                block("push --mirror перезаписывает все refs на remote, включая main")
            if _long_matches(t, "all", 2) or _long_matches(t, "branches", 2):
                block("push всех веток, включая main")
            if _long_matches(t, "prune", 2):
                block("push --prune удаляет ветки на remote")
            if _long_matches(t, "delete", 3):
                delete = True
            if name == "repo":
                repo_opt = True
                if "=" not in t:
                    i += 1
            elif name in ("push-option", "receive-pack", "exec", "recurse-submodules") and "=" not in t:
                i += 1
            i += 1
            continue
        sc = _short_cluster(t)
        if sc:
            for k, ch in enumerate(sc):
                if ch == "f":
                    block("force push")
                if ch == "d":
                    delete = True
                if ch == "o":
                    if k == len(sc) - 1:
                        i += 1  # value is the next word
                    break
            i += 1
            continue
        positional.append(x)
        i += 1
    refspecs = positional if repo_opt else positional[1:]
    if positional and not repo_opt and positional[0].dyn:
        pass  # remote name does not decide the destination branch
    if not refspecs:
        check_implicit_push(dirpath, globals_, env_extra, positional[0].text if positional and not repo_opt else None)
        return
    for r in refspecs:
        if r.dyn:
            block("refspec git push вычисляется при выполнении — укажите имя ветки буквально")
        t = r.text.strip()
        if t.startswith("+"):
            block("force push (+refspec)")
        if delete:
            if _is_protected(t):
                block("удаление main на remote")
            continue
        if ":" in t:
            src, dst = t.split(":", 1)
            if not src and not dst:
                block("push ':' (matching) может обновить main")
            if not dst:
                dst = src
        else:
            src = dst = t
        if dst in ("HEAD", "@") or (":" not in t and src in ("HEAD", "@")):
            br = current_branch(dirpath, globals_, env_extra)
            if br is UNKNOWN or br is None:
                block("push HEAD: не удалось определить текущую ветку (fail closed)")
            dst = br
        if _is_protected(dst):
            block("push в main")


def check_implicit_push(dirpath, globals_, env_extra, remote):
    br = current_branch(dirpath, globals_, env_extra)
    if br is UNKNOWN:
        block("git push без refspec: не удалось определить текущую ветку (fail closed)")
    if br == PROTECTED:
        block("push в main (текущая ветка main)")
    pushcfg = git_config(dirpath, globals_, r"^remote\..*\.push$", env_extra, regexp=True)
    if pushcfg is UNKNOWN or pushcfg:
        block("git push без refspec при настроенном remote.*.push — проверить назначение нельзя")
    mode = git_config(dirpath, globals_, "push.default", env_extra)
    if mode is UNKNOWN or mode == "matching":
        block("git push без refspec в режиме matching может обновить main")
    if br is None:
        return
    merge = git_config(dirpath, globals_, f"branch.{br}.merge", env_extra)
    if merge is UNKNOWN:
        block("git push без refspec: не удалось прочитать upstream (fail closed)")
    if _is_protected(merge or ""):
        block("push в main (upstream текущей ветки — main)")


# --------------------------------------------------------------------- main

def main():
    raw = sys.stdin.buffer.read().decode("utf-8", "replace")
    try:
        payload = json.loads(raw)
        cmd = payload.get("tool_input", {}).get("command")
        cwd = payload.get("cwd")
    except Exception:
        payload, cmd, cwd = None, None, None
    if not isinstance(cmd, str) or not cmd.strip():
        if re.search(r'git(\s|\\[tn]|")', raw):
            print("guard-git: не удалось разобрать команду, Git-действие заблокировано (fail closed). См. AGENTS.md.", file=sys.stderr)
            return 2
        return 0
    if not isinstance(cwd, str) or not cwd or not os.path.isabs(cwd):
        cwd = None  # unknown: history-changing commands are blocked
    try:
        analyze_line(cmd, Ctx(cwd))
    except Block as b:
        print(f"guard-git: заблокировано — {b}. См. AGENTS.md.", file=sys.stderr)
        return 2
    except RecursionError:
        print("guard-git: команда слишком сложная для проверки — заблокировано (fail closed). См. AGENTS.md.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    try:
        code = main()
    except Exception as exc:  # fail closed on any internal error
        print(f"guard-git: внутренняя ошибка ({type(exc).__name__}) — заблокировано (fail closed). См. AGENTS.md.", file=sys.stderr)
        code = 2
    sys.exit(code)
