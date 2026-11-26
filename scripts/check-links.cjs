'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '_data/links.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'assets/link-entry.js'), 'utf8');
const template = fs.readFileSync(path.join(root, '_includes/link-entry.html'), 'utf8');
let checks = 0;
function render(key='x', data=config) {
  const route = data.routes[key] || {};
  const elements={};
  for (const id of ['entry-title','entry-status','entry-destination','entry-retry']) {
    elements[id]={hidden:true,textContent:id==='entry-title'?route.title:'',removeAttribute(key){delete this[key]},addEventListener(name,fn){this[name]=fn}};
  }
  const redirects=[];
  const context={URL,document:{title:'',body:{dataset:{enabled:String(route.enabled),target:route.url||'',hosts:(data.allowedHosts||[]).join(','),mail:(data.allowedMailtoRecipients||[]).join(',')}},getElementById:id=>elements[id]},window:{location:{search:'?url=https://evil.example/',hash:'#https://evil.example/',replace:url=>redirects.push(url),reload(){}}}};
  vm.runInNewContext(script,context);checks++;return {elements,redirects};
}
function withURL(url,enabled=true){const c=structuredClone(config);c.routes.x.url=url;c.routes.x.enabled=enabled;return c;}
assert.equal(config.schemaVersion,1);
assert.ok(!fs.existsSync(path.join(root,'.nojekyll')));
assert.ok(!/\bfetch\s*\(/.test(script),'No second configuration request');
assert.ok(template.includes('route.url | escape'));
assert.ok(template.includes('route.title | escape'));
assert.ok(template.includes('allowedHosts | join:'));
assert.ok(template.includes('<noscript>'));
for (const [key,route] of Object.entries(config.routes)) {
 assert.equal(typeof route.enabled,'boolean');assert.ok(route.title.trim());
 const html=fs.readFileSync(path.join(root,'go',key,'index.html'),'utf8');
 assert.ok(html.includes(`route: ${key}\n`));assert.ok(html.includes('{% include link-entry.html %}'));
 const r=render(key);
 assert.deepEqual(r.redirects,route.enabled?[route.url]:[]);
 if(!route.enabled){assert.equal(route.url,null);assert.ok(r.elements['entry-status'].textContent.includes('暂未开放'));}
}
for(const url of ['http://x.com/','javascript:alert(1)','//x.com/','/support/','https://x.com.evil.example/','https://sub.x.com/','https://x.com@evil.example/','https://user:password@x.com/','https://x.com:8443/','https://x.com\\@evil.example/',' https://x.com/','https://x.com/\n','https://wovenhours.formyweblym.top/go/x/','https://wovenhours.formyweblym.top/%67o/x/','https://wovenhours.formyweblym.top/%2fgo/x/','mailto:someone@example.com','mailto:docdreamer@outlook.com?subject=test','mailto:docdreamer@outlook.com%0Acc:someone@example.com',null]) {
 const r=render('x',withURL(url));assert.deepEqual(r.redirects,[]);assert.equal(r.elements['entry-destination'].hidden,true);assert.equal(r.elements['entry-retry'].hidden,false);
}
const mail=render('x',withURL('mailto:docdreamer@outlook.com'));assert.deepEqual(mail.redirects,[]);assert.equal(mail.elements['entry-destination'].href,'mailto:docdreamer@outlook.com');
const changed=withURL('https://x.com/Wovenhours/status/123');assert.deepEqual(render('x',changed).redirects,[changed.routes.x.url]);
assert.deepEqual(render('unknown').redirects,[]);
console.log(`PASS: ${checks} embedded-route scenarios; no configuration fetch. Live Jekyll publication still requires verification.`);
