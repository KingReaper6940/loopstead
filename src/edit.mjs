import {clone,MAX_ROWS} from './model.mjs';
export function edit(p,a){
 const q=clone(p),at=()=>{const c=q.parts.find(c=>c.id===a.id);if(!c)throw Error('Part no longer exists.');return c;};
 switch(a.type){
 case 'show':q.title=a.title;q.notes=a.notes;break;
 case 'part':{if(a.id){const i=q.parts.findIndex(c=>c.id===a.id);if(i<0)throw Error('Part no longer exists.');q.parts[i]={...a.value,id:a.id};}else{let n=1;while(q.parts.some(c=>c.id==='p'+n))n++;q.parts.push({...a.value,id:'p'+n});}break;}
 case 'finish':{const c=at();if(c.completed>=MAX_ROWS)throw Error('Counter limit reached. Save a backup before starting another part.');c.completed++;break;}
 case 'back':{const c=at();if(c.completed===0)throw Error('No completed rows to remove.');c.completed--;break;}
 case 'remove':at();q.parts=q.parts.filter(c=>c.id!==a.id);break;
 default:throw Error('Unsupported edit.');
 }
 return clone(q);
}
export function history(initial){
 let current=clone(initial),past=[],future=[];
 return {get value(){return clone(current)},get canUndo(){return past.length>0},get canRedo(){return future.length>0},
 peek(dir){const a=dir==='undo'?past:dir==='redo'?future:null;if(!a)throw Error('Invalid history direction.');return a.length?clone(a.at(-1)):null;},
 commit(p){const next=clone(p);if(JSON.stringify(next)===JSON.stringify(current))return false;past.push(current);past=past.slice(-25);current=next;future=[];return true;},
 undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},
 redo(){if(!future.length)return false;past.push(current);past=past.slice(-25);current=future.pop();return true;}};
}
