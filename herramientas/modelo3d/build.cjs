// npm ci --prefix herramientas/modelo3d; node herramientas/modelo3d/build.cjs
const path=require('node:path');
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../../src/cuerpo3d.js')],outfile:path.join(__dirname,'../../js/cuerpo3d.js'),nodePaths:[path.join(__dirname,'node_modules')],bundle:true,format:'iife',minify:true});
