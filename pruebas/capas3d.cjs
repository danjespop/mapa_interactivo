const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const manifest=require('../assets/modelo3d/manifest.json');fs.mkdirSync('/tmp/atlas-imagenes',{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1450,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const base=process.env.ATLAS_TEST_URL||'http://127.0.0.1:8001/mapa_interactivo/';
 await page.goto(base+'locomotor.html#laboratorio');await page.locator('canvas[data-ready=true]').waitFor({timeout:120000});
 await page.locator('.lab-cobertura summary').first().click();
 assert.equal(await page.getByLabel('Mostrar membranas y epiplones').isChecked(),false);
 for(const [key,layer] of Object.entries(manifest.layers)){
  assert.equal(await page.locator('[data-layer-count='+key+']').innerText(),String(layer.structures));
  await page.getByLabel('Revisar una capa anatómica').selectOption(key);
  assert((await page.locator('.lab-cobertura .nota').innerText()).includes(String(layer.structures)));
  await page.getByRole('button',{name:'↺ Reiniciar vista'}).click();
  await page.getByRole('button',{name:'Aislar esta capa',exact:true}).click();
  assert(await page.locator('[data-system='+key+']').isChecked());
  assert.equal(await page.locator('[data-system]:checked').count(),1);
  assert((await page.locator('.lab-status').innerText()).endsWith('1 capa'));
  if(['digestivo','circulatorio','respiratorio','nervioso'].includes(key)){
   await page.locator('canvas').scrollIntoViewIfNeeded();
   await page.locator('.lab-viewport').screenshot({path:'/tmp/atlas-imagenes/capa-'+key+'.png'});
  }
 }
 for(const [name,en] of [['Yeyuno','Jejunum'],['Íleon','Ileum'],['Recto','Rectum'],['Páncreas','Pancreas'],['Esófago','Oesophagus']]){
  const search=page.getByRole('searchbox',{name:'Buscar estructura anatómica'});await search.fill(name);
  assert(await page.locator('.lab-busqueda button').count()>0,name);
  await page.getByRole('button',{name:name+' · '+en,exact:true}).click();assert((await page.locator('.lab-seleccion').innerText()).includes(en));
 }
 await page.getByRole('searchbox',{name:'Buscar estructura anatómica'}).fill('Pleura');await page.getByRole('button',{name:'Pleura',exact:true}).click();await page.locator('.lab-globo-seleccion:not([hidden])').waitFor();assert(await page.getByLabel('Mostrar membranas y epiplones').isChecked());
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('OK: 13 capas con inventario, aislamiento y encuadre, membranas, búsqueda digestiva ES, materiales sin errores de shader y móvil.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
