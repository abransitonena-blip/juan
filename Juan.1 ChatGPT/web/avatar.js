import * as T from 'three';
export function createJuan(){
 const avatar=new T.Group(), rig={}, clothing=new T.Group();avatar.name='Juan';
 let seed=41;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 function texture(type){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=type==='wood'?'#c38c55':type==='cloth'?'#315d63':'#be944f';x.fillRect(0,0,256,256);
  if(type==='wood'){for(let i=0;i<150;i++){x.strokeStyle=`rgba(81,40,13,${.03+rand()*.11})`;x.lineWidth=.3+rand()*1.2;x.beginPath();const p=rand()*256;x.moveTo(p,0);for(let y=0;y<=256;y+=8)x.lineTo(p+Math.sin(y*.024+i)*3,y);x.stroke();}}
  else{for(let i=0;i<256;i+=type==='cloth'?3:6){x.strokeStyle=i%2?'#ffffff17':'#201b1026';x.lineWidth=type==='cloth'?.7:1.5;x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke();}for(let i=0;i<1600;i++){x.fillStyle='#dbca9c30';x.fillRect(rand()*256,rand()*256,1,2)}}
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;return tx;}
 const woodTex=texture('wood'),clothTex=texture('cloth'),strawTex=texture('straw');
 const mat=(color,roughness=.7,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
 const wood=mat('#e2aa69',.62,{map:woodTex,bumpMap:woodTex,bumpScale:.022}),grain=mat('#885528',.9),joint=mat('#815b38'),hair=mat('#53504a'),hairLight=mat('#a7a193'),cream=mat('#ede0c5',.94),vest=mat('#77a5a8',.95,{map:clothTex}),pants=mat('#5a4932',.9),leather=mat('#67401e',.7),scarf=mat('#922d36',.8),straw=mat('#edc57e',.9,{map:strawTex,bumpMap:strawTex,bumpScale:.016}),gold=mat('#c49436',.3,{metalness:.7}),ivory=mat('#f4ecdb',.3),iris=mat('#633b1f',.32),black=mat('#17130e',.22);
 const sphere=new T.SphereGeometry(1,28,20);
 function group(name,parent,pos){const o=new T.Group();o.name=name;o.position.set(...pos);parent.add(o);rig[name]=o;return o}
 function ball(parent,name,pos,scale,m){const o=new T.Mesh(sphere,m);o.name=name;o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 function tube(parent,points,r,m){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,24,r,6,false),m);o.castShadow=true;parent.add(o);return o;}
 function cylinder(parent,pos,rt,rb,height,m){const o=new T.Mesh(new T.CylinderGeometry(rt,rb,height,32),m);o.position.set(...pos);o.castShadow=true;parent.add(o);return o}
 const body=group('torso',avatar,[0,1.52,0]);
 ball(body,'Cuerpo de madera',[0,0,0],[.32,.43,.19],wood);ball(body,'Cadera',[0,-.42,0],[.29,.16,.18],wood);
 const clothes=group('ropa',body,[0,0,0]);ball(clothes,'Camisa',[0,0,.005],[.328,.425,.205],cream);
 for(const s of [-1,1]){ball(clothes,'Chaleco',[s*.185,-.035,.035],[.17,.39,.205],vest);const lapel=ball(clothes,'Solapa',[s*.135,.24,.19],[.05,.18,.03],cream);lapel.rotation.z=s*.35;ball(clothes,'Bolsillo',[s*.18,-.19,.23],[.09,.045,.014],vest);for(let j=0;j<7;j++)ball(clothes,'Puntada',[s*(.28-j*.027),-.25,.222],[.004,.002,.003],gold)}
 for(const y of [-.25,-.08,.09]){ball(clothes,'Botón',[.07,y,.248],[.023,.023,.012],gold);ball(clothes,'Hilo',[.07,y,.26],[.007,.003,.003],leather)}
 ball(clothes,'Cintura del pantalón',[0,-.42,0],[.30,.15,.192],pants);cylinder(clothes,[0,-.365,0],.3,.3,.065,leather);
 const scarfGroup=group('panuelo',clothes,[0,.34,.13]);ball(scarfGroup,'Nudo',[0,0,.09],[.068,.065,.052],scarf);
 for(const s of [-1,1]){const tie=ball(scarfGroup,'Pico del pañuelo',[s*.04,-.12,.075],[.047,.16,.025],scarf);tie.rotation.z=s*.25;}
 const head=group('cabeza',body,[0,.59,0]);cylinder(head,[0,-.18,0],.1,.095,.22,wood);
 ball(head,'Cabeza tallada',[0,.17,0],[.345,.44,.29],wood);ball(head,'Mandíbula',[0,-.06,.035],[.285,.21,.24],wood);
 for(const s of [-1,1]){
  ball(head,'Oreja',[s*.344,.13,-.015],[.075,.13,.058],wood);ball(head,'Interior oreja',[s*.37,.14,.035],[.032,.071,.02],grain);
  ball(head,'Mejilla',[s*.20,.01,.214],[.128,.14,.1],wood);
  ball(head,'Cuenca',[s*.127,.23,.247],[.112,.101,.05],grain);ball(head,'Ojo',[s*.127,.233,.275],[.089,.077,.034],ivory);
  ball(head,'Iris',[s*.125,.231,.304],[.045,.05,.016],iris);ball(head,'Pupila',[s*.125,.231,.318],[.024,.031,.009],black);ball(head,'Reflejo',[s*.125-.012,.249,.326],[.01,.012,.005],ivory);
  const brow=group('ceja'+(s===-1?'L':'R'),head,[s*.125,.345,.273]);tube(brow,[[-.094,-.005,0],[-.04,.035,.016],[.03,.03,.02],[.09,0,0]],.025,hair);
  for(let j=0;j<7;j++)tube(brow,[[-.08+j*.024,-.01,.024],[-.07+j*.024,.025,.025]],.003,hairLight);
  for(let j=0;j<3;j++)tube(head,[[s*.20,.13-j*.016,.283],[s*.27,.14-j*.02,.257],[s*.29,.15-j*.025,.22]],.003,grain);
  for(let j=0;j<4;j++)tube(head,[[s*.035,.41+j*.026,.244],[s*.15,.405+j*.022,.24],[s*.24,.39+j*.018,.205]],.0025,grain);
  ball(head,'Patilla',[s*.304,.26,-.02],[.052,.21,.15],hair);
  for(let j=0;j<9;j++)tube(head,[[s*.26,.52-j*.025,-.04],[s*.35,.39-j*.025,-.05],[s*.35,.19-j*.015,.008]],.006,j%2?hairLight:hair);
 }
 ball(head,'Nariz puente',[0,.19,.29],[.063,.12,.07],wood);ball(head,'Nariz punta',[0,.075,.36],[.095,.07,.084],wood);
 ball(head,'Boca sonriente',[0,-.082,.255],[.15,.045,.026],leather);ball(head,'Dientes',[0,-.067,.276],[.106,.019,.009],ivory);
 for(const s of [-1,1]){
  tube(head,[[0,.013,.329],[s*.06,.015,.344],[s*.14,-.015,.333],[s*.23,.0,.30],[s*.26,.055,.282]],.034,hair);
  for(let i=0;i<8;i++){const dy=(i-3.5)*.006;tube(head,[[s*.015,.034+dy,.353],[s*.1,.011+dy,.365],[s*.19,-.004+dy,.338],[s*.25,.029+dy,.306],[s*.263,.064+dy,.288]],.003,i%3?hairLight:hair);}
 }
 for(let i=0;i<6;i++){const x=(i-2.5)*.035;tube(head,[[x,-.17,.24],[x*.9,-.205,.211]],.002,grain)}
 const hat=group('sombrero',head,[0,.52,-.015]);hat.rotation.z=-.1;hat.rotation.x=.05;
 const hatPoints=[[0,0],[.38,0],[.72,.01],[.78,.04],[.79,.065],[.72,.083],[.40,.10],[.365,.29],[.29,.40],[.12,.42],[0,.42]].map(p=>new T.Vector2(...p));
 const hatMesh=new T.Mesh(new T.LatheGeometry(hatPoints,64),straw);hatMesh.scale.z=.85;hatMesh.castShadow=true;hat.add(hatMesh);
 const band=cylinder(hat,[0,.145,0],.385,.405,.075,leather);band.scale.z=.85;
 for(let i=0;i<10;i++){const ring=new T.Mesh(new T.TorusGeometry(.43+i*.033,.003,4,64),straw);ring.rotation.x=Math.PI/2;ring.position.y=.085;ring.scale.y=.85;hat.add(ring)}
 const armClothes=[];
 for(const s of [-1,1]){
  const side=s===-1?'L':'R',arm=group('brazo'+side,body,[s*.37,.23,0]);ball(arm,'Hombro',[0,0,0],[.095,.095,.095],joint);ball(arm,'Brazo',[s*.025,-.21,0],[.075,.22,.075],wood);
  const sleeve=group('manga'+side,arm,[0,0,0]);armClothes.push(sleeve);ball(sleeve,'Manga',[s*.015,-.17,0],[.1,.23,.1],cream);cylinder(sleeve,[s*.025,-.345,0],.105,.105,.08,cream);
  const elbow=group('codo'+side,arm,[s*.025,-.405,0]);ball(elbow,'Codo',[0,0,0],[.065,.065,.065],joint);ball(elbow,'Antebrazo',[0,-.18,0],[.065,.18,.065],wood);
  for(let i=0;i<3;i++)tube(elbow,[[-.025+i*.025,-.035,.061],[-.028+i*.025,-.18,.065],[-.02+i*.025,-.30,.04]],.002,grain);
  const hand=group('mano'+side,elbow,[0,-.39,0]);ball(hand,'Palma',[0,0,0],[.079,.09,.038],wood);ball(hand,'Muñeca',[0,.085,0],[.05,.035,.04],joint);
  for(let i=0;i<4;i++){const finger=group('dedo'+side+i,hand,[(i-1.5)*.034,-.08,.007]);ball(finger,'Falange',[0,-.039,0],[.014,.041,.017],wood);ball(finger,'Nudillo',[0,-.078,0],[.015,.014,.017],joint);ball(finger,'Punta',[0,-.108,.008],[.013,.032,.016],wood);}
  const thumb=ball(hand,'Pulgar',[-s*.085,-.015,.026],[.023,.065,.023],wood);thumb.rotation.z=-s*.5;
  const leg=group('pierna'+side,avatar,[s*.145,1.08,0]);ball(leg,'Muslo',[0,-.23,0],[.105,.25,.115],wood);
  const trouser=group('pantalon'+side,leg,[0,0,0]);armClothes.push(trouser);ball(trouser,'Pantalón',[0,-.24,0],[.12,.29,.135],pants);
  const knee=group('rodilla'+side,leg,[0,-.49,0]);ball(knee,'Rodilla',[0,0,0],[.074,.074,.074],joint);ball(knee,'Pierna',[0,-.22,0],[.073,.225,.074],wood);
  const lower=group('bajo'+side,knee,[0,0,0]);armClothes.push(lower);ball(lower,'Bajo pantalón',[0,-.19,0],[.09,.25,.095],pants);
  ball(knee,'Bota',[0,-.475,.068],[.112,.075,.19],leather);
 }
 const coin=group('moneda',rig.manoR,[0,-.10,.07]);coin.visible=false;const cm=cylinder(coin,[0,0,0],.065,.065,.012,gold);cm.rotation.x=Math.PI/2;ball(coin,'Sello',[0,0,.01],[.035,.035,.004],gold);
 avatar.userData={rig,vest,scarf,hat,coin,clothes,armClothes};
 function outfit(name){const bare=name==='madera';clothes.visible=!bare;avatar.traverse(o=>{if(o.name==='Bota')o.material=bare?wood:leather});armClothes.forEach(o=>o.visible=!bare);vest.color.set(name==='fiesta'?'#bc6862':'#77a5a8');scarf.color.set(name==='fiesta'?'#c69a40':'#922d36')}
 return {avatar,rig,outfit,hat,coin};
}
