// Drills (P7-03, brief 10.3): content/gamification/drills/*.json, checked
// against content/gamification/schema/drill.schema.json and the chapter text.
// Fail closed: a drill that breaks the schema, repeats an id, has an answer
// outside its options or links to a missing anchor stops the build. No
// dependencies: the subset of JSON Schema the drill schema uses is checked here.

const typeOf=value=>Array.isArray(value)?'array':value===null?'null':Number.isInteger(value)?'integer':typeof value;

/** Problems of `value` against `schema` (keywords used by drill.schema.json; any other keyword is an error). */
export function checkSchema(value,schema,where='drill'){
  const known=new Set(['$schema','$id','title','description','type','additionalProperties','required','properties','items','pattern','minLength','maxLength','minItems','maxItems','minimum','maximum']);
  for(const key of Object.keys(schema))if(!known.has(key))return [`${where}: schema keyword ${key} is not supported`];
  const problems=[];const type=typeOf(value);
  if(schema.type&&type!==schema.type&&!(schema.type==='number'&&type==='integer'))return [`${where}: expected ${schema.type}, got ${type}`];
  if(type==='string'){
    const length=[...value].length;
    if(schema.minLength!==undefined&&length<schema.minLength)problems.push(`${where}: shorter than ${schema.minLength}`);
    if(schema.maxLength!==undefined&&length>schema.maxLength)problems.push(`${where}: longer than ${schema.maxLength}`);
    if(schema.pattern&&!new RegExp(schema.pattern,'u').test(value))problems.push(`${where}: does not match ${schema.pattern}`);
  }
  if(type==='integer'){
    if(schema.minimum!==undefined&&value<schema.minimum)problems.push(`${where}: below ${schema.minimum}`);
    if(schema.maximum!==undefined&&value>schema.maximum)problems.push(`${where}: above ${schema.maximum}`);
  }
  if(type==='array'){
    if(schema.minItems!==undefined&&value.length<schema.minItems)problems.push(`${where}: fewer than ${schema.minItems} items`);
    if(schema.maxItems!==undefined&&value.length>schema.maxItems)problems.push(`${where}: more than ${schema.maxItems} items`);
    if(schema.items)value.forEach((item,i)=>problems.push(...checkSchema(item,schema.items,`${where}[${i}]`)));
  }
  if(type==='object'){
    for(const key of schema.required??[])if(!(key in value))problems.push(`${where}: ${key} is missing`);
    for(const [key,item] of Object.entries(value)){
      if(schema.properties?.[key])problems.push(...checkSchema(item,schema.properties[key],`${where}.${key}`));
      else if(schema.additionalProperties===false)problems.push(`${where}: unknown key ${key}`);
    }
  }
  return problems;
}

/**
 * @param {{file:string,data:unknown}[]} inputs drill files
 * @param {object} schema drill.schema.json
 * @param {(id:string)=>string|undefined} pathOf address of an anchor id, or undefined
 */
export function compileDrills(inputs,schema,pathOf){
  const drills=[];const ids=new Set();const chapters=new Set();
  for(const {file,data} of inputs){
    const problems=checkSchema(data,schema,file);
    if(problems.length)throw Error(`Drill ${problems[0]}`);
    if(ids.has(data.id))throw Error(`Drill ${file}: id ${data.id} is already used`);
    if(chapters.has(data.chapter))throw Error(`Drill ${file}: ${data.chapter} already has a drill`);
    ids.add(data.id);chapters.add(data.chapter);
    const cardIds=new Set();
    const cards=data.cards.map(card=>{
      const where=`${file}: card ${card.id}`;
      if(cardIds.has(card.id))throw Error(`Drill ${where} is listed twice`);cardIds.add(card.id);
      const options=new Set(card.options.map(option=>option.id));
      if(options.size!==card.options.length)throw Error(`Drill ${where}: an option id is repeated`);
      if(!options.has(card.answer))throw Error(`Drill ${where}: answer ${card.answer} is not an option`);
      if(!card.anchor.startsWith(`${data.chapter}-`)&&card.anchor!==data.chapter)throw Error(`Drill ${where}: anchor ${card.anchor} is outside ${data.chapter}`);
      const path=pathOf(card.anchor);
      if(!path)throw Error(`Drill ${where}: missing anchor ${card.anchor}`);
      const {anchor,...rest}=card;
      return {...rest,href:`${path}#${encodeURIComponent(anchor)}`};
    });
    drills.push({id:data.id,chapter:data.chapter,title:data.title,minutes:data.minutes,intro:data.intro,cards});
  }
  return drills.sort((a,b)=>a.chapter.localeCompare(b.chapter));
}
