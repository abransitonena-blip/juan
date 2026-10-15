import * as T from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {createJuan} from './avatar.js';
import {poseAt,motionById,JOINTS} from './motions.js';
import {createStudio} from './studio.js';
import {createSceneEditor} from './scene-editor.js';
const $=s=>document.querySelector(s),viewer=$('#viewer'),status=$('#status');
const tell=t=>status.textContent=t;
try { init(); } catch(error){$('#loading').textContent='No se pudo iniciar el visor 3D. Prueba un navegador con WebGL 2 activado.';tell('Error al iniciar el avatar.');console.error(error)}
function init(){
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;viewer.appendChild(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.05,70);camera.position.set(3.2,2.5,7.4);camera.name='Camara_del_editor';scene.add(camera);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.35,0);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=2;orbit.maxDistance=13;orbit.maxPolarAngle=Math.PI*.49;
const hemi=new T.HemisphereLight('#fff1cf','#aca799',2.5);scene.add(hemi);
const key=new T.DirectionalLight('#ffdfab',4);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.normalBias=.025;scene.add(key);
const fill=new T.DirectionalLight('#cedfef',1.5);fill.position.set(4,3,-2);scene.add(fill);
const ground=new T.Mesh(new T.CircleGeometry(20,80),new T.ShadowMaterial({opacity:.17}));ground.rotation.x=-Math.PI/2;ground.position.y=.01;ground.receiveShadow=true;scene.add(ground);
const pedestal=new T.Mesh(new T.CylinderGeometry(.95,.98,.08,80),new T.MeshStandardMaterial({color:'#c7bca2',roughness:.9}));pedestal.position.y=-.045;pedestal.receiveShadow=true;scene.add(pedestal);
const {avatar,rig,outfit,hat,coin}=createJuan();scene.add(avatar);
fill.position.set(4,3,1);fill.name='Relleno suave';
const rim=new T.DirectionalLight('#ffcb83',2);rim.position.set(2,4,-4);rim.name='Contraluz';scene.add(rim);
function photograph(env,look={preset:'taller',exposure:1.1,fov:35}){
 const mode=look.preset==='taller'&&env==='noche'?'luna':look.preset;
 const c={taller:['#ffdfa9',3.1,1.8,'#bfd9ee',.8,'#ffd7a0',1.3],cine:['#ffe0ae',4.3,.55,'#a8c8f3',.65,'#ffb767',3.5],amanecer:['#ffb970',3.8,1.2,'#9fbcdf',.7,'#ffda9e',2.5],luna:['#9bb7ff',1.7,.45,'#819ac7',.4,'#c6dcff',2.3]}[mode];
 key.color.set(c[0]);key.intensity=c[1];hemi.intensity=c[2];fill.color.set(c[3]);fill.intensity=c[4];rim.color.set(c[5]);rim.intensity=c[6];renderer.toneMappingExposure=look.exposure;camera.fov=look.fov;camera.updateProjectionMatrix();
}

const mouthObject=avatar.getObjectByName('Boca sonriente'),mouthBase=mouthObject.scale.clone();
let studio;
const scenery=createSceneEditor({scene,avatar,camera,orbit,canvas:renderer.domElement,status:tell,environmentChanged:photograph,stopPlayback:()=>setPlaying(false),isBusy:()=>Boolean(studio?.isBusy()||studio?.hasSequence())});
ground.visible=false;pedestal.visible=false;
function applyMotion(data){for(const k of [...JOINTS,'cejaL','cejaR'])rig[k].rotation.set(...data[k]);mouthObject.scale.y=mouthBase.y*(data.mouth||1)}
function readMotion(){return {...Object.fromEntries([...JOINTS,'cejaL','cejaR'].map(k=>[k,[rig[k].rotation.x,rig[k].rotation.y,rig[k].rotation.z]])),mouth:mouthObject.scale.y/mouthBase.y}}
let playing=false,time=0,last=performance.now(),currentPose='reposo',outfitName='artesano',lightName='calida';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;orbit.enableDamping=!reduced;
const baseKeys=['torso','cabeza','brazoL','brazoR','codoL','codoR','piernaL','piernaR','rodillaL','rodillaR'];
const presets={reposo:{},saludo:{brazoR:[-.1,0,2.15],codoR:[-.3,0,.4],cabeza:[0,0,-.08]},pensar:{brazoL:[-.6,0,-.3],codoL:[-2,0,0],cabeza:[.1,-.15,-.1]},presentar:{brazoR:[-.3,0,.8],codoR:[-1.2,0,0],cabeza:[0,-.12,0]},abierto:{brazoL:[-.2,0,-.75],brazoR:[-.2,0,.75],codoL:[-.4,0,0],codoR:[-.4,0,0]},celebrar:{brazoL:[0,0,-2.4],brazoR:[0,0,2.4],cabeza:[-.1,0,0]}};
const poseNames={reposo:'En calma',saludo:'Saludar',pensar:'Pensar',presentar:'Presentar',abierto:'Bienvenida',celebrar:'Celebrar'};
function applyPose(name){for(const k of baseKeys)rig[k].rotation.set(...(presets[name]?.[k]||[0,0,0]));rig.cejaL.rotation.z=0;rig.cejaR.rotation.z=0;mouthObject.scale.copy(mouthBase);currentPose=name;$('#mode-label').textContent='Pose · '+poseNames[name];syncSliders()}
function setPlaying(value){if(studio?.isBusy())return;studio?.cancelPreview();playing=value;$('#play').textContent=value?'Ⅱ':'▶';$('#play').setAttribute('aria-label',value?'Pausar animación':'Reproducir animación');if(value){time=0;$('#mode-label').textContent='En movimiento';document.querySelectorAll('[data-pose]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})}else{$('#mode-label').textContent='Pose personalizada'}}
function choose(container,button){container.querySelectorAll('button').forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))})}
$('#poses').addEventListener('click',e=>{const b=e.target.closest('[data-pose]');if(!b)return;setPlaying(false);applyPose(b.dataset.pose);choose($('#poses'),b);tell('Pose: '+poseNames[currentPose])});
document.querySelectorAll('[data-outfit]').forEach(b=>b.addEventListener('click',()=>{outfitName=b.dataset.outfit;outfit(outfitName);choose(b.parentElement,b);tell('Atuendo: '+b.textContent.replace('✓','').trim())}));
$('#hat').addEventListener('change',e=>hat.visible=e.target.checked);$('#coin').addEventListener('change',e=>coin.visible=e.target.checked);
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{lightName=b.dataset.light;choose(b.parentElement,b);const cfg={calida:['#ffdfab',4,2.5,1.25],estudio:['#ffffff',3,3,1.2],noche:['#8facff',1.8,.8,.95]}[lightName];key.color.set(cfg[0]);key.intensity=cfg[1];hemi.intensity=cfg[2];renderer.toneMappingExposure=cfg[3];viewer.parentElement.style.background=lightName==='noche'?'radial-gradient(ellipse at 50% 40%,#858b86,#394844)':''}));
$('#turn').addEventListener('input',e=>{avatar.rotation.y=T.MathUtils.degToRad(Number(e.target.value));$('#turn-value').value=e.target.value+'°';scenery.commitJuan()});
$('#play').addEventListener('click',()=>setPlaying(!playing));$('#animation').addEventListener('change',()=>{time=0;if(!playing)tell('Animación seleccionada. Pulsa reproducir.')});
function focusCamera(face=false){orbit.target.set(0,face?2.65:1.35,0);camera.position.set(face?1.1:0,face?2.9:2.25,face?3.1:8.2);orbit.update()}
$('#camera-front').addEventListener('click',()=>focusCamera());$('#camera-face').addEventListener('click',()=>focusCamera(true));
const joints=[['cabeza','y','Mirada',-60,60],['cabeza','x','Inclinar cabeza',-30,30],['brazoL','z','Brazo izquierdo',-150,30],['brazoR','z','Brazo derecho',-30,150],['codoL','x','Codo izquierdo',-140,0],['codoR','x','Codo derecho',-140,0]];
const sliders=[];joints.forEach(([joint,axis,label,min,max],i)=>{const wrap=document.createElement('div'),id='joint-'+i;wrap.innerHTML=`<label class="range-label" for="${id}">${label}<output>0°</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="0">`;const input=wrap.querySelector('input'),output=wrap.querySelector('output');input.addEventListener('input',()=>{setPlaying(false);rig[joint].rotation[axis]=T.MathUtils.degToRad(Number(input.value));output.value=input.value+'°';currentPose='personalizada';document.querySelectorAll('[data-pose]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})});$('#joint-sliders').append(wrap);sliders.push({input,output,joint,axis})});
function syncSliders(){sliders.forEach(({input,output,joint,axis})=>{const n=Math.round(T.MathUtils.radToDeg(rig[joint].rotation[axis]));input.value=n;output.value=n+'°'})}
for(const [button,other,panel,otherPanel] of [['appearance-tab','rig-tab','appearance','rig'],['rig-tab','appearance-tab','rig','appearance']])$('#'+button).addEventListener('click',()=>{$('#'+panel).hidden=false;$('#'+otherPanel).hidden=true;$('#'+button).classList.add('active');$('#'+button).setAttribute('aria-pressed','true');$('#'+other).classList.remove('active');$('#'+other).setAttribute('aria-pressed','false');syncSliders()});
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click()}
$('#save-image').addEventListener('click',()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob){tell('No se pudo guardar la imagen.');return}const url=URL.createObjectURL(blob);download(url,'Juan-avatar.png');setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Imagen de Juan guardada.')},'image/png')});
$('#save-pose').addEventListener('click',()=>{const data={version:1,atuendo:outfitName,luz:lightName,sombrero:hat.visible,moneda:coin.visible,posicion:avatar.position.toArray(),giro:avatar.rotation.y,articulaciones:Object.fromEntries(baseKeys.map(k=>[k,[rig[k].rotation.x,rig[k].rotation.y,rig[k].rotation.z]])),unidades:'radianes'};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));download(url,'Juan-pose.json');setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Pose descargada en JSON.')});
function move(direction){const delta={left:[-.12,0],right:[.12,0],forward:[0,.12],back:[0,-.12]}[direction];avatar.position.x=T.MathUtils.clamp(avatar.position.x+delta[0],-1.3,1.3);avatar.position.z=T.MathUtils.clamp(avatar.position.z+delta[1],-.7,.7);scenery.commitJuan();tell('Posición actualizada.')}
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.move)));
viewer.addEventListener('keydown',e=>{const d={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'forward',ArrowDown:'back'}[e.key];if(d){e.preventDefault();move(d)}if(e.code==='Space'){e.preventDefault();setPlaying(!playing)}});renderer.domElement.addEventListener('pointerdown',()=>viewer.focus({preventScroll:true}));
$('#reset').addEventListener('click',()=>{setPlaying(false);applyPose('reposo');choose($('#poses'),document.querySelector('[data-pose="reposo"]'));avatar.position.set(0,0,0);avatar.rotation.y=0;$('#turn').value=0;$('#turn-value').value='0°';focusCamera();scenery.commitJuan();tell('Pose y cámara restablecidas.')});
const audio=$('#audio');$('#speak').addEventListener('click',()=>{if(!audio.paused){audio.pause();$('#speak').textContent='▷ Escuchar a Juan';return}audio.src='assets/voz_'+$('#voice').value+'.wav';audio.play().then(()=>{$('#speak').textContent='Ⅱ Pausar voz';tell('Reproduciendo voz sintética de Juan.')}).catch(()=>tell('No se pudo reproducir la voz.'));});audio.addEventListener('ended',()=>$('#speak').textContent='▷ Escuchar a Juan');$('#voice').addEventListener('change',()=>{audio.pause();$('#speak').textContent='▷ Escuchar a Juan'});
const dialog=$('#reference-dialog');$('#reference-open').addEventListener('click',()=>dialog.showModal());$('#reference-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
function animate(t){const dt=Math.min((t-last)/1000,.05);last=t;const sequence=studio?.tick(t);if(playing&&!sequence){time+=dt;const u=$('#stop-motion').checked?Math.floor(time*12)/12:time;applyMotion(poseAt($('#animation').value,u));scenery.tick(time,motionById[$('#animation').value].duration);}orbit.update();renderer.render(scene,camera);studio?.capture();requestAnimationFrame(animate)}
new ResizeObserver(()=>{const w=viewer.clientWidth,h=viewer.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}).observe(viewer);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();tell('El visor perdió la conexión gráfica. Recarga la página.');setPlaying(false)});
studio=createStudio({scene,camera,scenery,cameraSnapshot:()=>({position:camera.position.toArray(),target:orbit.target.toArray()}),getCanvas:()=>renderer.domElement,apply:applyMotion,readPose:readMotion,exposure:()=>renderer.toneMappingExposure,pauseAudio:()=>{audio.pause();$('#speak').textContent='▷ Escuchar a Juan'},getOutfit:()=>outfitName,status:tell,environmentChanged:photograph,stopPlayback:()=>setPlaying(false),previewMotion:id=>{$('#animation').value=id;setPlaying(true)},setCamera:(type,view)=>{if(type==='custom'&&view){camera.position.fromArray(view.position);orbit.target.fromArray(view.target);orbit.update()}else focusCamera(type==='retrato')},setOutfit:name=>{outfitName=name;outfit(name);choose(document.querySelector('.outfits'),document.querySelector('[data-outfit="'+name+'"]'))}});
applyPose('reposo');$('#loading').remove();tell(reduced?'Listo. Las animaciones se activan solo al reproducir.':'Listo para crear.');requestAnimationFrame(animate);
}
