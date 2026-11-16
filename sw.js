/* 다크 드웰러 오프라인 저장. 만든 때 202611160332 */
const CACHE='dd-cache',FILES=["./","index.html","js/base.js","js/cave.js","js/data.js","js/extra.js","js/game.js","js/gear.js","js/gimmick.js","js/help.js","js/hub.js","js/main.js","js/meta.js","js/mobs.js","js/music.js","js/polish.js","js/rank.js","js/relics.js","js/render.js","js/rift.js","js/scenery.js","js/skills2.js","js/skills3.js","js/ui.js","js/world.js","js/wuxia.js","img/hero.png","img/hero_cool.png","img/gear.png","img/gear2.png","img/mobs.png","img/mobs2.png","img/bosses.png","img/mobs3.png","img/skillsB.png","img/skills.png"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'no-cache'}).then(r=>r.ok&&c.put(f,r)).catch(()=>{})))));});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
/* 인터넷 먼저(4초 안에 답이 없으면 저장해 둔 것), 받은 것은 저장해 둔다 */
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
  e.respondWith((async()=>{const c=await caches.open(CACHE),old=await c.match(q,{ignoreSearch:true});
    const net=fetch(q,{cache:'no-cache'}).then(r=>{if(r.ok)c.put(q,r.clone());return r;});
    if(!old)return net;
    return Promise.race([net,new Promise(res=>setTimeout(()=>res(old),4000))]).catch(()=>old);})());});
