import {mountProduction} from '/web/production-bridge.js';
const $=s=>document.querySelector(s);
function ready(){
 const blocks=location.pathname==='/blocks.html';
 if(blocks&&!window.__blocks){setTimeout(ready,100);return;}
 let renderedPayload=null;
 const fields={text:'#text',voice:'#voice',rate:'#rate',outfit:'#outfit',background:'#background',camera:'#camera',format:'#format',hat:'#hat',captions:'#captions',coin:'#coin'};
 const read=()=>Object.fromEntries(Object.entries(fields).map(([k,s])=>[k,$(s).type==='checkbox'?$(s).checked:k==='rate'?Number($(s).value):$(s).value]));
 function load(p){if(blocks){window.__blocks.load(p);return}for(const [k,s] of Object.entries(fields)){const n=$(s);if(p[k]!==undefined){if(n.type==='checkbox')n.checked=Boolean(p[k]);else n.value=k==='voice'?({jorge:'es-MX-JorgeNeural',dalia:'es-MX-DaliaNeural',tomas:'es-AR-TomasNeural',alvaro:'es-ES-AlvaroNeural'}[p[k]]||p[k]):p[k];n.dispatchEvent(new Event('change',{bubbles:true}));}}$('#text').dispatchEvent(new Event('input',{bubbles:true}));$('#status').textContent='Proyecto abierto. Genera la voz para crear el video.';}
 if(!blocks&&!$('#voice').options.length){setTimeout(ready,100);return;}
 $('#record').addEventListener('click',()=>{renderedPayload=JSON.parse(JSON.stringify(blocks?window.__blocks.project():read()))},true);
 mountProduction({engine:blocks?'blocks':'speech',snapshot:()=>blocks?window.__blocks.project():read(),load,title:()=>blocks?$('#name').value:$('#text').value.slice(0,55)||'Juan · Texto y voz',busy:()=>!$('#stop').hidden,video:()=>{const a=$('#download');return a?.hasAttribute('href')?{url:a.href,name:a.download,project:renderedPayload}:null;}});
}
ready();
