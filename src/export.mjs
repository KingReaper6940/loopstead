import {validate,report,progress} from './model.mjs';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=(s,n)=>{const a=[...s];return Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n).join(''));};
export const projectJSON=p=>JSON.stringify(validate(p),null,2)+'\n';
export const receiptJSON=p=>JSON.stringify(report(p),null,2)+'\n';
export function repeatText(c){const d=progress(c);return d.nextRepeat?'Next: repeat '+d.nextRepeat.number+', row '+d.nextRepeat.row+' of '+d.nextRepeat.length:d.beforeRepeat?'Setup rows · repeat starts at project row '+c.repeatStart:'No repeat configured';}
export function resumeSVG(p){
 validate(p);const height=160+p.parts.length*190;
 let b='<rect width="1000" height="'+height+'" fill="#f4efe9"/>'+lines(p.title,48).map((t,i)=>'<text x="35" y="'+(40+i*25)+'" font-size="23" font-weight="700">'+esc(t)+'</text>').join('');
 b+='<text x="35" y="106" font-size="15">Finish a row first, then count it. “Next” is the row to work, not a row already finished.</text>';
 p.parts.forEach((c,i)=>{const d=progress(c),y=130+i*190;b+='<rect x="25" y="'+y+'" width="950" height="175" rx="14" fill="#fffdf9" stroke="#c7bbb0"/>';
 b+=lines(c.name,26).map((t,j)=>'<text x="45" y="'+(y+36+j*24)+'" font-size="21" font-weight="700">'+esc(t)+'</text>').join('');
 b+='<text x="45" y="'+(y+112)+'" font-size="16">'+esc(repeatText(c))+'</text><text x="45" y="'+(y+143)+'" font-size="14">'+esc(c.target===null?'No total-row target':d.targetMet?'Target met · planned '+c.target+' rows':d.remaining+' rows to target '+c.target)+'</text><text x="650" y="'+(y+35)+'" font-size="13">LAST COMPLETED</text><text x="650" y="'+(y+80)+'" font-size="38">'+d.completed+'</text><text x="650" y="'+(y+112)+'" font-size="13">WORK NEXT</text><text x="650" y="'+(y+155)+'" font-size="38">'+d.next+'</text>';});
 b+='<text x="35" y="'+(height-12)+'" font-size="12">Loopstead · count snapshot, not a pattern or verified fabric state · full notes are in the HTML / project files</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 '+height+'" role="img" aria-label="Row-count resume card" font-family="Arial,sans-serif"><title>'+esc(p.title)+'</title>'+b+'</svg>';
}
export function resumeHTML(p){
 validate(p);return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title)+' · resume notes</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:850px;margin:30px auto;padding:20px;color:#302c28}section{border:1px solid #baa;padding:20px;margin:20px 0;break-inside:avoid}p,h1,h2{overflow-wrap:anywhere}p{white-space:pre-wrap}strong{font-size:22px}@media print{body{margin:0;max-width:none}}</style><body><h1>'+esc(p.title)+'</h1><p>Finish the row, then count it. Next means the row to work. This is a count snapshot, not a pattern or verified fabric state.</p>'+p.parts.map(c=>{const d=progress(c);return '<section><h2>'+esc(c.name)+'</h2><p>Last completed: <strong>'+d.completed+'</strong> · Work next: <strong>'+d.next+'</strong></p><p>'+esc(repeatText(c))+'</p><p>'+esc(c.repeatLength===null?'No repeat configured.':'Repeat begins at project row '+c.repeatStart+'; '+d.repeats+' full repeats recorded.')+'</p><p>'+esc(c.target===null?'No total-row target.':'Target '+c.target+' rows; '+d.remaining+' remain'+(d.targetMet?' (target met).':'.'))+'</p><p>'+esc(c.notes)+'</p></section>';}).join('')+'<h2>Project notes</h2><p>'+esc(p.notes)+'</p><footer>Loopstead · Browser Print / Save as PDF. Keep project JSON to resume editing; this sheet is not an import format.</footer></body></html>';
}
