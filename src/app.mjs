import {blank,progress} from './model.mjs';
import {example} from './example.mjs';
import {history,edit} from './edit.mjs';
import {localStore,STORAGE_KEY} from './storage.mjs';
import {esc,repeatText} from './export.mjs';
import {attachHandoff} from './handoff.mjs';
export function createApp(doc,win=doc.defaultView,suppliedStorage){
 const $=s=>doc.querySelector(s),forms={show:$('#show-form'),part:$('#part-form')};
 let storage=suppliedStorage;if(storage===undefined){try{storage=win.localStorage;}catch{storage={getItem(){throw Error('Unavailable');}};}}
 const store=localStore(storage),h=history(store.initial),dirty=new Set();let partId=null,revision=0,onChange=()=>{};
 const status=m=>{$('#status').textContent=m;},field=(f,n)=>forms[f].elements.namedItem(n);
 const checkDraft=except=>{if([...dirty].some(k=>k!==except))throw Error('Save or clear form drafts before another action.');};
 const checkEdit=except=>{checkDraft(except);if(store.state.blocked)throw Error(store.state.message);};
 function reset(kind){forms[kind].reset();dirty.delete(kind);if(kind==='show'){field('show','title').value=h.value.title;field('show','notes').value=h.value.notes;}else{partId=null;$('#part-heading').textContent='Add a part';}revision++;}
 function persist(p,force=false){const r=store.save(p,force);if(!r.applied){render();throw Error(store.state.message);}return r;}
 function commit(p,force=false){persist(p,force);h.commit(p);revision++;}
 function render(){
  const focus=doc.activeElement?.dataset?.action?{action:doc.activeElement.dataset.action,id:doc.activeElement.dataset.id}:null;
  const p=h.value,s=store.state;$('#project-title').textContent=p.title;$('#part-count').textContent=p.parts.length+' / 8 parts';$('#save-status').textContent=s.message;$('#save-status').classList.toggle('warning',s.mode==='memory'||s.blocked);$('#reconcile').hidden=!s.blocked&&s.mode!=='memory';
  $('#cards').innerHTML=p.parts.map(c=>{const d=progress(c);return '<article class="counter"><h3>'+esc(c.name)+'</h3><div class="next-label">WORK NEXT · PROJECT ROW</div><div class="next-count">'+d.next+'</div><div class="completed">Last completed: <b>'+d.completed+'</b></div><div class="repeat"><strong>'+esc(repeatText(c))+'</strong>'+(d.repeats===null?'Set a repeat length to track it.':d.repeats+' full repeats recorded.')+'</div><p class="target">'+esc(c.target===null?'No total-row target':d.targetMet?'Target met · planned '+c.target+' rows; counting can continue':d.remaining+' rows remain to target '+c.target)+'</p><button class="finish" type="button" data-action="finish" data-id="'+c.id+'" '+(!d.canAdvance||s.blocked?'disabled':'')+'>Finished row '+d.next+'</button><div class="actions"><button type="button" data-action="back" data-id="'+c.id+'" '+(c.completed===0||s.blocked?'disabled':'')+'>Back one row</button><button type="button" data-action="edit" data-id="'+c.id+'">Edit / correct</button><button type="button" data-action="remove" data-id="'+c.id+'" '+(s.blocked?'disabled':'')+'>Delete part</button></div>'+(c.notes?'<p class="part-notes">'+esc(c.notes)+'</p>':'')+'</article>';}).join('')||'<div class="empty"><strong>A fresh start.</strong><p>Add a part in the editor, or try the example. Each part keeps its own row count.</p></div>';
  if(!dirty.has('show')){field('show','title').value=p.title;field('show','notes').value=p.notes;}
  $('#undo').disabled=!h.canUndo||s.blocked;$('#redo').disabled=!h.canRedo||s.blocked;
  if(focus){const b=doc.querySelector('[data-action="'+focus.action+'"][data-id="'+focus.id+'"]');if(b&&!b.disabled)b.focus();}
  onChange();
 }
 const run=fn=>{try{fn();}catch(e){status(e.message);}};
 for(const [kind,form] of Object.entries(forms)){
  const changed=()=>{dirty.add(kind);revision++;status('Unsaved '+kind+' draft. Save or clear it before counting or downloading.');onChange();};
  form.addEventListener('input',changed);form.addEventListener('change',changed);
  $('#'+kind+'-clear').addEventListener('click',()=>{reset(kind);render();status('Draft cleared.');});
  form.addEventListener('submit',e=>{e.preventDefault();run(()=>{checkEdit(kind);const get=n=>field(kind,n).value;
   const action=kind==='show'?{type:'show',title:get('title'),notes:get('notes')}:{type:'part',id:partId,value:{name:get('name'),completed:Number(get('completed')),repeatStart:Number(get('repeatStart')),repeatLength:get('repeatLength')===''?null:Number(get('repeatLength')),target:get('target')===''?null:Number(get('target')),notes:get('notes')}};
   if(kind==='part'&&(get('completed')===''||get('repeatStart')===''))throw Error('Completed rows and repeat start are required.');
   commit(edit(h.value,action));reset(kind);render();status('Saved '+kind+'. '+store.state.message);});});
 }
 $('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;run(()=>{const {action,id}=b.dataset;
  if(action==='edit'){checkDraft();reset('part');partId=id;const c=h.value.parts.find(v=>v.id===id);for(const [k,v] of Object.entries(c)){const f=field('part',k);if(f)f.value=v??'';}$('#part-heading').textContent='Edit '+c.name;field('part','name').focus();return;}
  checkEdit();commit(edit(h.value,{type:action,id}));if(action==='remove')reset('part');render();status(action==='finish'?'Row recorded. '+store.state.message:action==='back'?'Removed one completed row.':'Part deleted. Undo is available.');});});
 for(const [id,maker] of [['demo',example],['new',blank]])$('#'+id).addEventListener('click',()=>run(()=>{checkEdit();commit(maker());reset('part');render();status(id==='demo'?'Invented example loaded. Undo restores the previous project.':'Blank project ready. Undo restores the previous project.');}));
 for(const dir of ['undo','redo'])$('#'+dir).addEventListener('click',()=>run(()=>{checkEdit();const p=h.peek(dir);if(!p)return;persist(p);h[dir]();revision++;reset('part');render();status(dir==='undo'?'Undone.':'Redone.');}));
 $('#use-browser').addEventListener('click',()=>run(()=>{checkDraft();const p=store.readExternal();h.commit(p);revision++;reset('part');render();status('Loaded browser copy. The previous tab project is in Undo history.');}));
 $('#use-local').addEventListener('click',()=>run(()=>{checkDraft();persist(h.value,true);revision++;render();status(store.state.message);}));
 win.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===null){store.observe();revision++;render();}});
 win.addEventListener('beforeunload',e=>{if(dirty.size||store.state.mode==='memory'||store.state.blocked){e.preventDefault();e.returnValue='';}});
 render();
 return {get value(){return h.value},get revision(){return revision},get dirty(){return dirty.size>0},get saveState(){return store.state},status,
  load(p){checkDraft();commit(p,true);reset('part');render();status('Backup opened and saved if storage is available. Undo restores the previous project.');},
  subscribe(fn){onChange=fn;fn();}};
}
if(typeof document!=='undefined')attachHandoff(createApp(document),document);
