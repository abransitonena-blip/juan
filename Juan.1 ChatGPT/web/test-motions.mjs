import assert from 'node:assert/strict';
import {MOTIONS,poseAt,JOINTS,validateProject} from './motions.js';
assert.equal(MOTIONS.length,35);assert.equal(new Set(MOTIONS.map(m=>m.id)).size,35);
for(const m of MOTIONS){const poses=new Set();for(let t=0;t<12;t+=.07){const p=poseAt(m.id,t);for(const joint of [...JOINTS,'cejaL','cejaR']){assert.equal(p[joint].length,3);assert.ok(p[joint].every(v=>Number.isFinite(v)&&Math.abs(v)<Math.PI*2));}assert.ok(Number.isFinite(p.mouth));poses.add(JSON.stringify(p))}if(m.id!=='reposo')assert.ok(poses.size>10,m.id+' debe contener movimiento real')}
const valid={version:2,clips:[{motion:'saludo',duration:4,speed:1,camera:'general',outfit:'artesano'}]};assert.equal(validateProject(valid).length,1);
for(const patch of [{duration:-1},{duration:Infinity},{motion:'script'},{speed:0},{camera:'x'},{outfit:'x'}])assert.throws(()=>validateProject({version:2,clips:[{...valid.clips[0],...patch}]}));
assert.throws(()=>validateProject({version:2,clips:Array(11).fill({...valid.clips[0],duration:30})}));assert.throws(()=>validateProject({version:2,clips:[]}));
console.log('35 movimientos verificados: poses finitas y cambiantes; proyectos inválidos y límite de duración rechazados.');
