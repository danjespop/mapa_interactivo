"""Optimiza originales locales sin modificarlos. Requiere Pillow.
python3 herramientas/optimizar_anatomia.py /ruta/originales [--dry-run]
Los originales deben tener los nombres 01.png…30.png de origenes-imagenes.json.
"""
import argparse,json
from pathlib import Path
from PIL import Image, ImageOps
p=argparse.ArgumentParser();p.add_argument('originales',type=Path);p.add_argument('--dry-run',action='store_true');a=p.parse_args()
r=Path(__file__).resolve().parent.parent
mapping=json.loads((r/'src/data/origenes-imagenes.json').read_text());manifest=[]
for m in mapping:
 dest=r/'assets/anatomia'/m['section']/m['filename']
 if dest.exists():raise SystemExit(f'Colisión: {dest}. No se sobrescribe.')
 if not (a.originales/f"{m['n']:02}.png").is_file():raise SystemExit(f"Falta original {m['n']}")
for m in mapping:
 src=a.originales/f"{m['n']:02}.png";dest=r/'assets/anatomia'/m['section']/m['filename']
 with Image.open(src) as original:
  im=ImageOps.exif_transpose(original);im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  alpha=im.mode=='RGBA' and im.getextrema()[3][0]<255
  if not alpha:im=im.convert('RGB')
  if not a.dry_run:dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,'WEBP',quality=86,method=6)
  manifest.append(dict(id=m['id'],ruta=str(dest.relative_to(r)),titulo_es=m['title'],alt_es='Ilustración de '+m['title'].lower(),seccion=m['section'],origen=m['nombre'],archivo_zip=m['zip'],entrada=m['canonical'],estado_qa='pendiente',usos=['estudio'],ancho=im.width,alto=im.height,transparencia_real=alpha,peso_original=src.stat().st_size,peso_web=dest.stat().st_size if dest.exists() else None))
 print(('PREVIA ' if a.dry_run else '')+str(dest.relative_to(r)), im.size)
if not a.dry_run:(r/'src/data/imagenes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
