self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'TattoHub',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'TattoHub',{body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',tag:d.tag||'tattohub',renotify:true,data:{url:d.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=(e.notification.data&&e.notification.data.url)||'/';
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow(u)}))});
