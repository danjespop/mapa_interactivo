const{chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.ATLAS_TEST_URL||'http://127.0.0.1:8002/mapa_interactivo/';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1450,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'locomotor.html#laboratorio',{waitUntil:'domcontentloaded'});await page.locator('canvas').waitFor();
 // Keep the initial frame light on software WebGL; actual pelvis and organs
 // are displayed below, after both reference bodies have loaded.
 await page.evaluate(()=>{for(const input of document.querySelectorAll('[data-system]')){input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}});
 await page.locator('canvas[data-ready=true]').waitFor({timeout:120000});await page.getByLabel('Elegir modelo corporal').selectOption('femenino');await page.locator('canvas[data-female-ready=true]').waitFor({timeout:180000});
 assert.equal(await page.locator('[data-system=reproductor]').isEnabled(),true);assert.equal(await page.locator('canvas').getAttribute('data-female-reproductive'),'21');assert.equal(await page.locator('[data-layer-count=reproductor]').innerText(),'21');
 await page.getByLabel('Detalles naturales: respiración, mirada y parpadeo').uncheck();
 const search=page.getByLabel('Buscar estructura anatómica'),results=page.locator('.lab-busqueda button');
 for(const term of ['útero','ovario','trompa','fallopian','vagina','uretra femenina']){await search.fill(term);assert(await results.count()>0,'Búsqueda bilingüe: '+term);}
 await search.fill('ovario');assert.equal(await results.count(),2);await results.first().click();assert((await page.locator('.lab-globo-seleccion [lang=es]').innerText()).includes('Ovario'));assert((await page.locator('.lab-globo-seleccion [lang=en]').innerText()).includes('Ovary'));
 await search.fill('vagina');await results.first().click();await page.locator('.lab-seleccion .fuente-info').click();assert((await page.locator('.fuente-dialog').innerText()).includes('Reconstrucción didáctica'));await page.locator('.cerrar-fuente').click();
 await page.getByLabel('Revisar una capa anatómica').evaluate(el=>el.parentElement.open=true);await page.getByLabel('Revisar una capa anatómica').selectOption('reproductor');await page.getByRole('button',{name:'Aislar esta capa',exact:true}).click();
 for(const action of ['caminar','saltar','sentarse','peso']){await page.locator('[data-action='+action+']').click();for(const phase of ['200','550','800']){await page.getByLabel('Explorar la fase del movimiento').fill(phase);assert.equal(await page.locator('canvas').getAttribute('data-action'),action);}}
 await page.locator('[data-action=quieto]').click();await page.getByRole('button',{name:'Aislar esta capa',exact:true}).click();await page.locator('.lab-viewport').screenshot({path:'/tmp/atlas-imagenes/reproductor-femenino-final.png',timeout:120000});
 await page.getByLabel('Elegir modelo corporal').selectOption('masculino');await search.fill('vagina');assert.equal(await results.count(),0,'No aparecen órganos femeninos en el hombre');
 await page.getByLabel('Elegir modelo corporal').selectOption('femenino');await search.fill('ovario');assert.equal(await results.count(),2,'No se duplican piezas al cambiar de modelo');
 assert.deepEqual(errors,[]);await browser.close();console.log('OK: 21 superficies reproductoras, ovarios endocrinos, búsquedas ES/EN, fuentes de reconstrucciones, selección, movimientos y separación de ambos cuerpos.');
})().catch(e=>{console.error(e);process.exit(1)});
