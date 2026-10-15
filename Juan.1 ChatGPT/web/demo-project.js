import {DEFAULT_SCENE} from './scene-data.js';
export function makeSceneDemo(){
 const asset=(id,kind,position,behavior='quieto',scale=1)=>({id,kind,position,end:[...position],rotation:0,scale,behavior});
 const workshop=DEFAULT_SCENE();workshop.juan.end=[.5,0,0];workshop.objects=[asset('companero','perro',[-1.25,0,.35],'seguir',.85),asset('flores-mesa','flores',[-2.1,0,-.6]),asset('ahorro','alcancia',[1.4,0,.2],'quieto',1.25)];
 const forest=DEFAULT_SCENE();forest.environment='bosque';forest.juan.position=[-.2,0,0];forest.juan.end=[.5,0,0];forest.objects=[asset('conejo','conejo',[-1.3,0,.2],'saltar',.8),asset('ave','pajaro',[1.35,1.25,-.1],'pasear',.9),asset('roca','roca',[2.1,0,-.7])];
 const village=DEFAULT_SCENE();village.environment='pueblo';village.objects=[asset('gato','gato',[-1.2,0,.3],'mirar',.8),asset('cofre','cofre',[1.4,0,.2]),asset('flores','maceta',[-2.1,0,-.6])];
 return {version:3,name:'Tres mundos de Juan',format:'landscape',audio:'calida',stopMotion:true,clips:[{motion:'bienvenida',duration:4,speed:1,camera:'general',outfit:'artesano',scene:workshop,title:'Cada historia empieza en el taller.'},{motion:'curiosidad',duration:4,speed:1,camera:'general',outfit:'artesano',scene:forest,title:'Un paseo, una idea y nuevos amigos.'},{motion:'presentar',duration:4,speed:1,camera:'general',outfit:'fiesta',scene:village,title:'Ahora tú decides qué sucede.'}]};
}
