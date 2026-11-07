export const SCHEMA='loopstead-project-v1',MAX_ROWS=999999;
const fail=m=>{throw Error(m);};
function keys(o,names){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==[...names].sort().join('|'))fail('Unsupported project fields.');}
function text(v,max,name,multi=false){if(typeof v!=='string'||v.length>max||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)||(!multi&&/[\r\n]/.test(v)))fail(name+' has unsupported text or exceeds '+max+' characters.');}
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function validate(p){
 keys(p,['schema','title','notes','parts']);if(p.schema!==SCHEMA)fail('Unsupported project version.');text(p.title,80,'Title');if(!p.title.trim())fail('Give the project a name.');text(p.notes,1000,'Project notes',true);
 if(!Array.isArray(p.parts)||p.parts.length>8)fail('Limit: eight project parts.');const ids=new Set();
 for(const c of p.parts){keys(c,['id','name','completed','repeatStart','repeatLength','target','notes']);if(typeof c.id!=='string'||!/^p[1-9]\d{0,5}$/.test(c.id)||ids.has(c.id))fail('Invalid or duplicate part ID.');ids.add(c.id);text(c.name,48,'Part name');if(!c.name.trim())fail('Give the part a name.');text(c.notes,400,'Part notes',true);if(!integer(c.completed,0,MAX_ROWS)||!integer(c.repeatStart,1,MAX_ROWS)||(c.repeatLength!==null&&!integer(c.repeatLength,1,1000))||(c.target!==null&&!integer(c.target,1,MAX_ROWS)))fail('Invalid row, repeat or target value.');}
 return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled project',notes:'',parts:[]});
export function parseProject(source){if(typeof source!=='string'||source.length>30000)fail('Project exceeds 30,000 characters.');return clone(JSON.parse(source));}
export function progress(c){
 // Validate a stand-alone counter through the same schema used by imports.
 validate({schema:SCHEMA,title:'Counter',notes:'',parts:[c]});const next=c.completed+1,worked=Math.max(0,c.completed-c.repeatStart+1);
 return {completed:c.completed,next,canAdvance:c.completed<MAX_ROWS,remaining:c.target===null?null:Math.max(0,c.target-c.completed),targetMet:c.target!==null&&c.completed>=c.target,
  repeats:c.repeatLength===null?null:Math.floor(worked/c.repeatLength),
  nextRepeat:c.repeatLength===null||next<c.repeatStart?null:{number:Math.floor((next-c.repeatStart)/c.repeatLength)+1,row:(next-c.repeatStart)%c.repeatLength+1,length:c.repeatLength},
  beforeRepeat:c.repeatLength!==null&&next<c.repeatStart};
}
export function report(p){validate(p);return {schema:'loopstead-receipt-v1',project:clone(p),parts:p.parts.map(c=>({id:c.id,name:c.name,...progress(c)}))};}
