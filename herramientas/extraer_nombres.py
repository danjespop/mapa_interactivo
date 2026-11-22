"""Extrae el vocabulario ES/EN del texto Translations del Startup.blend original.
Blender --background --factory-startup --disable-autoexec Startup.blend --python herramientas/extraer_nombres.py
Fuente y licencia: assets/modelo3d/ATRIBUCIONES.md.
"""
import bpy,csv,io,json
from pathlib import Path
rows=csv.DictReader(io.StringIO(bpy.data.texts['Translations'].as_string()),delimiter=';')
entries={r['English'].lower():r['Español'] for r in rows if r.get('English') and r.get('Español')}
output=Path(__file__).resolve().parent.parent/'src/data/nombres-z-anatomy.json'
output.write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':'))+'\n')
print('Traducciones de la fuente:',len(entries))
