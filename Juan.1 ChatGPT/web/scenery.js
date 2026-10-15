import * as T from 'three';
export function buildProp(kind){
 const root=new T.Group(),parts={};const mat=(c)=>new T.MeshStandardMaterial({color:c,roughness:.85});const brown=mat('#9c6a3e'),dark=mat('#50392a'),cream=mat('#e9dab5'),green=mat('#52774b'),black=mat('#211e19'),pink=mat('#cc877c'),gold=mat('#d9ab4c');
 function mesh(g,m,p,s=[1,1,1],parent=root){const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 const ball=(p,s,m,parent=root)=>mesh(new T.SphereGeometry(1,16,12),m,p,s,parent);
 const box=(p,s,m,parent=root)=>mesh(new T.BoxGeometry(1,1,1),m,p,s,parent);
 const cyl=(p,r,h,m,parent=root)=>mesh(new T.CylinderGeometry(r,r,h,20),m,p,[1,1,1],parent);
 if(['perro','gato','conejo'].includes(kind)){
  const fur=kind==='gato'?mat('#bd8250'):kind==='conejo'?cream:brown;ball([0,.46,0],[.25,.26,.42],fur);const head=new T.Group();head.position.set(0,.77,.3);root.add(head);parts.head=head;ball([0,0,0],[.24,.23,.22],fur,head);ball([0,-.07,.18],[.15,.1,.12],cream,head);ball([0,-.02,.275],[.055,.035,.035],black,head);
  for(const s of [-1,1]){ball([s*.1,.05,.18],[.035,.043,.023],black,head);ball([s*.11,.07,.2],[.009,.012,.005],cream,head);if(kind==='gato'){const ear=mesh(new T.ConeGeometry(.11,.22,3),fur,[s*.17,.2,0],[1,1,.6],head);ear.rotation.z=-s*.25}else{const ear=ball([s*.18,kind==='conejo'?.31:.02,-.02],kind==='conejo'?[.075,.32,.06]:[.09,.21,.07],fur,head);ear.rotation.z=s*.2}
   for(const z of [-.25,.25]){const leg=new T.Group();leg.position.set(s*.16,.34,z);root.add(leg);box([0,-.12,0],[.09,.24,.09],fur,leg);ball([0,-.27,.025],[.075,.065,.1],fur,leg);(parts.legs??=[]).push(leg)}}
  const tail=new T.Group();tail.position.set(0,.54,-.36);root.add(tail);parts.tail=tail;const t=ball([0,.13,-.1],kind==='conejo'?[.12,.12,.12]:[.055,.22,.055],fur,tail);t.rotation.x=-.7;
 }
 if(kind==='pajaro'){const m=mat('#44828c');ball([0,.4,0],[.16,.2,.24],m);ball([0,.57,.16],[.13,.13,.13],m);mesh(new T.ConeGeometry(.07,.15,4),gold,[0,.55,.32],[1,1,1]).rotation.x=Math.PI/2;for(const s of [-1,1]){ball([s*.1,.6,.22],[.017,.02,.017],black);const wing=new T.Group();wing.position.set(s*.12,.45,0);root.add(wing);ball([s*.1,0,-.02],[.13,.05,.18],m,wing);(parts.wings??=[]).push(wing);cyl([s*.05,.13,.03],.012,.2,dark)}}
 if(kind==='mesa'){box([0,.91,0],[1.5,.12,.8],brown);for(const x of [-.6,.6])for(const z of [-.3,.3])box([x,.43,z],[.1,.86,.1],dark)}
 if(kind==='banco'){box([0,.48,0],[.8,.12,.5],brown);for(const x of [-.3,.3])for(const z of [-.17,.17])box([x,.21,z],[.08,.42,.08],dark)}
 if(kind==='cofre'){box([0,.28,0],[.7,.5,.5],brown);box([0,.53,0],[.73,.08,.53],dark);box([0,.31,.26],[.08,.15,.03],gold)}
 if(kind==='barril'){cyl([0,.4,0],.3,.8,brown);for(const y of [.12,.65])cyl([0,y,0],.31,.06,dark)}
 if(kind==='alcancia'){ball([0,.35,0],[.33,.25,.23],pink);ball([.27,.38,.02],[.13,.13,.15],pink);ball([.37,.38,.02],[.045,.08,.11],pink);for(const z of [-.09,.09])ball([.41,.38,z],[.012,.018,.012],dark);for(const x of [-.2,.2])for(const z of [-.13,.13])box([x,.1,z],[.09,.16,.09],pink);for(const z of [-.14,.14])mesh(new T.ConeGeometry(.08,.16,3),pink,[.21,.58,z]);ball([.24,.48,.18],[.018,.018,.018],black);box([0,.588,0],[.16,.01,.02],dark)}
 if(kind==='moneda'){const o=cyl([0,.14,0],.15,.035,gold);o.rotation.x=Math.PI/2;ball([0,.14,.025],[.08,.08,.01],brown)}
 if(kind==='arbol'){cyl([0,.85,0],.16,1.7,brown);for(const [p,s] of [[[0,2,0],[.8,.9,.8]],[[-.45,1.7,.1],[.6,.65,.6]],[[.45,1.9,-.1],[.55,.7,.55]]])ball(p,s,green)}
 if(kind==='roca'){const o=mesh(new T.DodecahedronGeometry(.35,0),mat('#939389'),[0,.23,0],[1.3,.8,1]);o.rotation.y=.3}
 if(kind==='maceta'||kind==='flores'){if(kind==='maceta')mesh(new T.CylinderGeometry(.22,.15,.35,20),mat('#ab6546'),[0,.175,0]);for(let i=0;i<5;i++){const x=(i-2)*.07,y=.45+(i%3)*.1,z=Math.sin(i*2)*.1;cyl([x,y/2,z],.014,y,green);ball([x,y,z],[.07,.07,.07],i%2?pink:gold)}}
 root.userData.parts=parts;root.name=kind;return root;
}
export function buildEnvironment(kind){const root=new T.Group();const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.95});function box(p,s,m){const o=new T.Mesh(new T.BoxGeometry(...s),m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}function prop(k,p,s=1){const o=buildProp(k);o.position.set(...p);o.scale.setScalar(s);root.add(o);return o}
 const floorColors={estudio:'#e5ddc8',taller:'#bb9972',bosque:'#8a9d64',pueblo:'#d2b28b',desierto:'#dbb781',noche:'#475b4b'};const floor=new T.Mesh(new T.CircleGeometry(30,64),mat(floorColors[kind]));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;root.add(floor);
 if(kind==='taller'){const wall=mat('#a97e53'),wood=mat('#72513a');box([0,2,-3.3],[11,4,.16],wall);for(let i=-5;i<=5;i++)box([i,2,-3.19],[.035,4,.05],wood);box([-2.2,2.3,-3.08],[1.5,1.7,.1],wood);box([-2.2,2.3,-3.01],[1.3,1.5,.04],new T.MeshStandardMaterial({color:'#bdd5d0',emissive:'#769d9c',emissiveIntensity:.35}));box([-2.2,2.3,-2.97],[.045,1.55,.05],wood);box([-2.2,2.3,-2.96],[1.35,.045,.05],wood);box([2,2,-2.8],[2.2,.1,.55],wood);prop('maceta',[1.5,2.05,-2.75]);prop('cofre',[2.4,2.05,-2.75],.65);prop('barril',[-3.2,0,-2.5]);prop('mesa',[2.6,0,-1.8]);prop('alcancia',[2.6,.99,-1.8],.7)}
 if(kind==='bosque'||kind==='noche'){for(let i=0;i<7;i++){const angle=i/7*Math.PI+Math.PI/2;prop('arbol',[Math.cos(angle)*5,0,-2-Math.sin(angle)*3],.8+(i%3)*.25)}prop('roca',[-2.4,0,-1]);prop('flores',[2.3,0,-1]);}
 if(kind==='pueblo'){for(let i=0;i<5;i++){const x=(i-2)*2.7,z=-4-Math.abs(i-2)*.2;box([x,1,z],[2.2,2,1.4],mat(['#d1aa83','#e3c6a0','#b7b191'][i%3]));const roof=new T.Mesh(new T.ConeGeometry(1.7,.9,4),mat('#a56549'));roof.position.set(x,2.4,z);roof.rotation.y=Math.PI/4;root.add(roof);box([x,.6,z+.71],[.5,1.2,.03],mat('#73513c'));box([x+.7,1.25,z+.72],[.45,.6,.04],mat('#7d9c97'));}prop('maceta',[-2,0,-1.5]);prop('banco',[2.1,0,-1.5]);}
 if(kind==='desierto'){for(let i=0;i<4;i++)prop('roca',[(i-1.5)*3,0,-2.5],1+i*.3);const green=mat('#657d54');for(const x of [-3,3]){const cactus=new T.Mesh(new T.CapsuleGeometry(.18,1.4,4,10),green);cactus.position.set(x,.9,-2.4);root.add(cactus)}}
 return root;
}
