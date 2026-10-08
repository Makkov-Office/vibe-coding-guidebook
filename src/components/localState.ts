// Keep local marks across SPA pages when browser storage is unavailable.
const sessionValues=new Map<string,string|null>();
let unavailable=false;
export function readLocal(key:string):string|null{
 if(unavailable&&sessionValues.has(key))return sessionValues.get(key)??null;
 try{const value=localStorage.getItem(key);sessionValues.set(key,value);return value;}
 catch{unavailable=true;return sessionValues.get(key)??null;}
}
export function writeLocal(key:string,value:string):boolean{
 sessionValues.set(key,value);
 try{localStorage.setItem(key,value);return true;}catch{unavailable=true;return false;}
}
export function removeLocal(key:string):boolean{
 sessionValues.set(key,null);
 try{localStorage.removeItem(key);return true;}catch{unavailable=true;return false;}
}
export const localUnavailable=()=>unavailable;
