const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.ATLAS_TEST_URL||'http://127.0.0.1:8002/mapa_interactivo/';
async function fits(page,selector){
 const r=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:innerWidth,h:innerHeight};});
 assert(r.top>=0&&r.bottom<=r.h&&r.left>=0&&r.right<=r.w,selector+' debe quedar dentro de la pantalla: '+JSON.stringify(r));
}
async function tappable(locator){
 const result=await locator.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {width:r.width,height:r.height,hit:el===hit||el.contains(hit),target:hit?.outerHTML.slice(0,150),rect:r.toJSON()};});
 assert(result.width>=44&&result.height>=44&&result.hit,'Control táctil visible y sin solapamientos: '+JSON.stringify(result));
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Geometry and shaders are verified by superficies3d.cjs. Hold the large
 // payload here so software WebGL does not obscure touch/layout failures.
 let releaseModel;const modelGate=new Promise(resolve=>releaseModel=resolve);
 await page.route('**/assets/modelo3d/*',async route=>{await modelGate;await route.continue().catch(()=>{});});
 for(const [width,height] of [[320,568],[390,844],[844,390],[1280,900]]){
  await page.setViewportSize({width,height});await page.goto(base+'locomotor.html#glosario');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Glosario sin desbordamiento horizontal');
  // Open both the annotated body view and the gallery from deep glossary cards.
  for(const index of [0,22,38]){
   console.log('Tarjeta',width,height,index);const trigger=page.locator('.concepto').nth(index).getByRole('button',{name:'Ver en el cuerpo'});await trigger.scrollIntoViewIfNeeded();await tappable(trigger);await trigger.click();
   await fits(page,'dialog[open]');const close=page.locator('dialog[open] button').first();await tappable(close);
   const source=page.locator('dialog[open] .fuente-info');await source.scrollIntoViewIfNeeded();await source.click();await fits(page,'.fuente-dialog[open]');await page.locator('.fuente-dialog .cerrar-fuente').click();
   await page.locator('dialog[open]').evaluate(el=>el.scrollTop=0);await close.click();assert.equal(await page.locator('dialog[open]').count(),0);assert(await trigger.evaluate(el=>document.activeElement===el),'Devuelve el foco a la tarjeta');
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'locomotor.html#laboratorio',{waitUntil:'domcontentloaded'});await page.locator('canvas').waitFor();
 for(const [width,height] of [[320,568],[390,844],[844,390]]){
  console.log('Laboratorio',width,height);await page.setViewportSize({width,height});await page.locator('.lab-sidebar').scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Laboratorio sin desbordamiento horizontal');
  for(const help of await page.locator('.lab-ayuda-sistema').all()){
   await help.scrollIntoViewIfNeeded();await tappable(help);await help.tap();await fits(page,'.lab-dialogo-sistema[open]');await page.keyboard.press('Escape');
  }
  for(const button of await page.locator('.lab-movimientos button').all()){await button.scrollIntoViewIfNeeded();await tappable(button);}
 }
 await page.setViewportSize({width:390,height:844});await page.locator('.lab-viewport').scrollIntoViewIfNeeded();
 const rect=await page.locator('canvas').boundingBox(),before=await page.evaluate(()=>scrollY),session=await page.context().newCDPSession(page);
 const x=Math.round(rect.x+rect.width/2),y=Math.round(rect.y+rect.height*.75);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let n=1;n<=10;n++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-n*18}]});await page.waitForTimeout(16);}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(300);assert((await page.evaluate(()=>scrollY))>before+60,'Se puede desplazar la página deslizando sobre el modelo');
 assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/atlas-imagenes/interfaz-movil.png'});releaseModel();await browser.close();
 console.log('OK: tarjetas profundas, galería y fuentes visibles; cierre y foco; 320/390/844/1280 px; ayudas y botones táctiles; desplazamiento sobre el modelo.');
})().catch(e=>{console.error(e);process.exit(1)});
