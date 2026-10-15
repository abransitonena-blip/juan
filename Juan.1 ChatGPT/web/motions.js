import {normalizeScene} from './scene-data.js';
// Biblioteca original. Radianes; funciones puras compartidas por visor y película.
export const JOINTS=['torso','cabeza','brazoL','brazoR','codoL','codoR','piernaL','piernaR','rodillaL','rodillaR'];
export const MOTIONS=[
 ['reposo','En calma','Pausas',3],['respirar','Respirar tranquilo','Pausas',4],['escuchar','Escuchar con atención','Pausas',4],
 ['saludo','Saludar','Conversación',4],['despedida','Despedirse','Conversación',4],['bienvenida','Dar la bienvenida','Conversación',4],['presentar','Presentar una idea','Conversación',5],['explicar','Explicar con las manos','Conversación',6],['enumerar','Contar tres ideas','Conversación',6],['senalarL','Señalar a la izquierda','Conversación',3],['senalarR','Señalar a la derecha','Conversación',3],['arriba','Señalar arriba','Conversación',3],['abajo','Señalar abajo','Conversación',3],
 ['pensar','Pensar una respuesta','Reacciones',5],['curiosidad','Examinar con curiosidad','Reacciones',5],['asentir','Decir que sí','Reacciones',3],['negar','Decir que no','Reacciones',3],['sorpresa','Una sorpresa','Reacciones',4],['alegria','Una buena noticia','Reacciones',4],['celebrar','Celebrar un logro','Reacciones',4],['reir','Reír con cariño','Reacciones',4],['tristeza','Un momento de tristeza','Reacciones',5],['frustracion','Algo no salió bien','Reacciones',5],['alivio','Soltar la tensión','Reacciones',4],['dudar','No estar seguro','Reacciones',4],
 ['agradecer','Dar las gracias','Acciones',4],['reverencia','Hacer una reverencia','Acciones',4],['ofrecer','Ofrecer una pieza','Acciones',4],['recoger','Buscar una herramienta','Acciones',5],['trabajar','Trabajar en el taller','Acciones',6],['aplaudir','Aplaudir','Acciones',4],['baile','Bailar','Movimiento',6],['caminar','Caminar en el sitio','Movimiento',6],['marchar','Marchar con energía','Movimiento',5],['estirar','Estirarse','Movimiento',5]
].map(([id,label,group,duration])=>({id,label,group,duration}));
export const motionById=Object.fromEntries(MOTIONS.map(m=>[m.id,m]));
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function poseAt(id,t){
 const p=Object.fromEntries(JOINTS.map(k=>[k,[0,0,0]]));const m=Object.hasOwn(motionById,id)?motionById[id]:motionById.reposo;const phase=(t%m.duration)/m.duration;const e=smooth(phase/.16)*(1-smooth((phase-.82)/.18));const w=Math.sin(t*4),soft=Math.sin(t*2);let brow=0,mouth=1;
 const arm=(l,r,el=-.5,er=-.5)=>{p.brazoL=[-.12,0,l];p.brazoR=[-.12,0,r];p.codoL=[el,0,0];p.codoR=[er,0,0]};
 switch(id){
 case 'respirar':p.torso[0]=soft*.025;p.cabeza[2]=.025;break;
 case 'escuchar':p.cabeza=[.04+Math.sin(t*2)*.025,-.15,-.09];p.codoL[0]=-.14;break;
 case 'saludo':p.brazoR=[-.1,0,2.05*e];p.codoR=[-.25*e,0,(.3+Math.sin(t*6)*.22)*e];p.cabeza[2]=-.08*e;break;
 case 'despedida':p.brazoL=[0,0,-1.7*e];p.codoL=[-.4*e,0,-(.3+Math.sin(t*7)*.16)*e];p.cabeza[0]=.07*e;break;
 case 'bienvenida':arm(-.9*e,.9*e,-.4*e,-.4*e);p.cabeza[0]=.04*e;break;
 case 'presentar':p.brazoR=[-.3*e,0,.8*e];p.codoR=[-1.2*e,0,0];p.cabeza[1]=-.15*e;break;
 case 'explicar':arm(-(.4+.12*soft)*e,(.5+.15*w)*e,(-.9+.2*w)*e,(-1+.2*soft)*e);p.cabeza[1]=.1*soft*e;mouth=1+.25*Math.abs(Math.sin(t*8))*e;break;
 case 'enumerar':{const n=Math.floor(t%6/2);arm(-.35*e,(.5+n*.15)*e,-1.2*e,-1.4*e);p.cabeza[0]=Math.sin(t*3)*.05*e;break;}
 case 'senalarL':p.brazoL=[-.1*e,0,-1.25*e];p.cabeza[1]=.35*e;break;
 case 'senalarR':p.brazoR=[-.1*e,0,1.25*e];p.cabeza[1]=-.35*e;break;
 case 'arriba':p.brazoR=[0,0,2.7*e];p.cabeza[0]=-.2*e;break;
 case 'abajo':p.brazoR=[-.5*e,0,.25*e];p.torso[0]=.18*e;p.cabeza[0]=.3*e;break;
 case 'pensar':p.brazoL=[-.6*e,0,-.3*e];p.codoL=[-2*e,0,0];p.cabeza=[.12*e,-.15*e,-.1*e];brow=.06*e;break;
 case 'curiosidad':p.cabeza=[.2*e,-.25*e,-.12*e];p.torso[0]=.1*e;p.brazoL[0]=-.3*e;p.codoL[0]=-1.5*e;brow=.12*e;break;
 case 'asentir':p.cabeza[0]=.17*Math.sin(t*5)*e;break;
 case 'negar':p.cabeza[1]=.25*Math.sin(t*5)*e;break;
 case 'sorpresa':arm(-.45*e,.45*e,-1.7*e,-1.7*e);p.torso[0]=-.09*e;p.cabeza[0]=-.12*e;brow=.2*e;mouth=1+.8*e;break;
 case 'alegria':arm(-.6*e,.6*e,-.7*e,-.7*e);p.cabeza[2]=.1*soft*e;brow=.08*e;break;
 case 'celebrar':arm(-2.4*e,2.4*e,-.1*e,-.1*e);p.cabeza[0]=-.1*e;break;
 case 'reir':p.torso[0]=(.08+.025*Math.sin(t*12))*e;p.cabeza[0]=(-.1+.04*Math.sin(t*12))*e;arm(-.2*e,.2*e,-1.5*e,-1.5*e);mouth=1+.5*e;break;
 case 'tristeza':p.cabeza=[.3*e,0,-.07*e];p.torso[0]=.1*e;arm(.08*e,-.08*e,-.1*e,-.1*e);brow=-.08*e;break;
 case 'frustracion':p.cabeza=[.12*e,.08*w*e,0];p.brazoR=[-.4*e,0,.3*e];p.codoR[0]=-1.6*e;p.torso[2]=.05*e;brow=-.12*e;break;
 case 'alivio':p.torso[0]=.07*(1-e);arm(-.25*e,.25*e,-.2*e,-.2*e);p.cabeza[0]=-.08*e;break;
 case 'dudar':arm(-.6*e,.6*e,-1.3*e,-1.3*e);p.cabeza[2]=.12*soft*e;brow=.08*e;break;
 case 'agradecer':arm(-.23*e,.23*e,-1.8*e,-1.8*e);p.cabeza[0]=.17*e;p.torso[0]=.07*e;break;
 case 'reverencia':p.torso[0]=.4*e;p.cabeza[0]=.12*e;p.codoL[0]=-.9*e;p.codoR[0]=-.9*e;break;
 case 'ofrecer':arm(-.22*e,.22*e,-1.3*e,-1.3*e);p.brazoL[0]=-.3*e;p.brazoR[0]=-.3*e;p.cabeza[0]=.07*e;break;
 case 'recoger':p.torso=[.28*e,.1*e,.08*e];p.cabeza[0]=.3*e;p.brazoR=[-.7*e,0,.2*e];p.codoR[0]=-.2*e;break;
 case 'trabajar':p.cabeza[0]=.25*e;arm(-.3*e,.3*e,(-1.15+.22*w)*e,-1.15*e);p.torso[0]=.1*e;break;
 case 'aplaudir':p.brazoL=[-.8*e,0,-.35*e];p.brazoR=[-.8*e,0,.35*e];p.codoL=[-1.25*e,(-.42+.17*w)*e,0];p.codoR=[-1.25*e,(.42-.17*w)*e,0];break;
 case 'baile':p.torso[2]=w*.08;arm(-.8+w*.25,.8+w*.25,-.7,-.7);p.cabeza[2]=-w*.05;break;
 case 'caminar':case 'marchar':{const a=id==='marchar'?.5:.34;p.piernaL[0]=Math.sin(t*5)*a;p.piernaR[0]=-Math.sin(t*5)*a;p.rodillaL[0]=Math.max(0,-Math.sin(t*5))*.4;p.rodillaR[0]=Math.max(0,Math.sin(t*5))*.4;p.brazoL[0]=-Math.sin(t*5)*a;p.brazoR[0]=Math.sin(t*5)*a;break;}
 case 'estirar':arm(-2.7*e,2.7*e,0,0);p.torso[2]=Math.sin(t*1.5)*.08*e;break;
 }
 return {...p,cejaL:[0,0,brow],cejaR:[0,0,-brow],mouth};
}
export function validateProject(value){
 if(!value||![2,3].includes(value.version)||!Array.isArray(value.clips)||!value.clips.length||value.clips.length>40)throw Error('El proyecto debe contener entre 1 y 40 tomas.');
 const clips=value.clips.map(c=>{if(!Object.hasOwn(motionById,c.motion)||!Number.isFinite(c.duration)||c.duration<1||c.duration>30||!Number.isFinite(c.speed)||c.speed<.25||c.speed>2||!['general','retrato','custom'].includes(c.camera)||!['artesano','fiesta','madera'].includes(c.outfit))throw Error('Hay una toma con datos no válidos.');const view=c.view&&Array.isArray(c.view.position)&&Array.isArray(c.view.target)&&c.view.position.length===3&&c.view.target.length===3&&[...c.view.position,...c.view.target].every(n=>Number.isFinite(n)&&Math.abs(n)<=100)?{position:[...c.view.position],target:[...c.view.target]}:null;if(c.camera==='custom'&&!view)throw Error('La toma necesita una cámara guardada.');return {motion:c.motion,duration:c.duration,speed:c.speed,camera:c.camera,outfit:c.outfit,scene:normalizeScene(c.scene),title:typeof c.title==='string'?c.title.slice(0,120):'',offset:Number.isFinite(c.offset)?Math.max(0,Math.min(600,c.offset)):0,view}});
 if(clips.reduce((n,c)=>n+c.duration,0)>300)throw Error('La película puede durar hasta 5 minutos.');return clips;
}
