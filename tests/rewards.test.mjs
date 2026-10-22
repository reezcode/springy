import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EMPTY_PROGRESS, exerciseKey } from '../lib/progress/schema.ts';
import { rewardStatus } from '../lib/progress/rewards.ts';
import { getModuleRefs } from '../content/index.ts';

const modules = [
  {id:'m1',lessons:[{id:'m1-1',exerciseIds:['a','b','c']},{id:'m1-2',exerciseIds:['d']}]},
  {id:'m2',lessons:[{id:'m2-1',exerciseIds:['e']}]},
];
const passed={passed:true,attempts:1,updatedAt:'2026-10-22T00:00:00Z'};
const fresh=()=>structuredClone(EMPTY_PROGRESS);

test('XP counts canonical first passes and completion bonuses, never attempts or unknown IDs',()=>{
  const p=fresh();
  p.exercises['m1-1:a']=passed;
  p.exercises['m99-99:unknown']=passed;
  let r=rewardStatus(p,modules);
  assert.equal(r.xp,20);
  assert.ok(r.badges.find(b=>b.id==='spark').unlocked);
  p.exercises['m1-1:a']={...passed,attempts:1000};
  assert.equal(rewardStatus(p,modules).xp,20);
  p.exercises['m1-1:b']=passed;p.exercises['m1-1:c']=passed;
  r=rewardStatus(p,modules);
  assert.equal(r.xp,110);assert.equal(r.level,2);
  assert.ok(r.badges.find(b=>b.id==='bloom').unlocked);
  p.exercises['m1-2:d']=passed;
  r=rewardStatus(p,modules);
  assert.equal(r.xp,330);assert.equal(r.modulesComplete,1);
  assert.ok(r.badges.find(b=>b.id==='master').unlocked);
  delete p.exercises['m1-1:a'];
  assert.equal(rewardStatus(p,modules).xp,110);
  p.exercises['m1-1:a']=passed;
  assert.equal(rewardStatus(p,modules).xp,330,'resetting and replaying cannot exceed canonical XP');
});

test('daily challenge and streak use local dates and cap quest progress',()=>{
  const p=fresh();
  p.activity={'2026-10-20':1,'2026-10-21':1,'2026-10-22':10};
  const r=rewardStatus(p,modules,new Date(2026,9,22,12));
  assert.equal(r.todayCount,2);assert.equal(r.dailyComplete,true);assert.equal(r.streak,3);
  assert.ok(r.badges.find(b=>b.id==='streak').unlocked);
  const next=rewardStatus(p,modules,new Date(2026,9,23,12));
  assert.equal(next.todayCount,0);assert.equal(next.dailyComplete,false);assert.equal(next.streak,3);
  const afterBreak=rewardStatus(p,modules,new Date(2026,9,24,12));
  assert.equal(afterBreak.streak,0);
  assert.ok(afterBreak.badges.find(b=>b.id==='streak').unlocked,'earned streak badge survives a missed day');
});

test('existing completed curricula unlock the final level and all completion milestones without migration',()=>{
  const p=fresh(), refs=getModuleRefs();
  for(const m of refs)for(const l of m.lessons)for(const id of l.exerciseIds)p.exercises[exerciseKey(l.id,id)]=passed;
  const r=rewardStatus(p,refs);
  assert.equal(r.xp,6560);assert.equal(r.level,8);assert.equal(r.levelPercent,100);assert.equal(r.xpToNext,0);
  assert.equal(r.nextLevel,undefined);
  assert.ok(r.badges.find(b=>b.id==='scholar').unlocked);
  assert.ok(r.badges.find(b=>b.id==='halfway').unlocked);
  assert.equal(rewardStatus(fresh(),refs).xp,0);
});
