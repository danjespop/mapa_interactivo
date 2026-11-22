"""Importa solo las superficies digestivas verificadas del archivo BodyParts3D 3.0.
Registro uniforme en cuatro referencias óseas, sin inventar ni dibujar los órganos.
"""
import bpy,json,struct,os
from pathlib import Path

def add_reference_parts(project_root):
 reg=json.loads((Path(project_root)/'src/data/registro-bodyparts3d.json').read_text());created=[]
 for identifier,name in reg['parts'].items():
  path=Path(os.environ.get('BODYPARTS3D_STL_DIR','/tmp/bp3d-models'))/(identifier+'.stl')
  with path.open('rb') as f:
   f.read(80);count=struct.unpack('<I',f.read(4))[0];data=f.read()
  vertices=[];faces=[];lookup={}
  for i in range(count):
   values=struct.unpack_from('<12fH',data,i*50);face=[]
   for j in [3,6,9]:
    original=values[j:j+3];key=tuple(original)
    if key not in lookup:
     lookup[key]=len(vertices);vertices.append(tuple(original[k]*reg['scale']+reg['translation'][k] for k in range(3)))
    face.append(lookup[key])
   faces.append(face)
  mesh=bpy.data.meshes.new(name+'_BodyParts3D');mesh.from_pydata(vertices,[],faces);mesh.update();obj=bpy.data.objects.new(name+'_BP3D',mesh)
  bpy.data.collections['8: Visceral systems'].objects.link(obj)
  material=bpy.data.materials.get('Intestine') or bpy.data.materials.new('Intestine');mesh.materials.append(material)
  obj['anatomical_name']=name;obj['source']='BodyParts3D 3.0 / Database Center for Life Science; Kevin-Mattheus-Moerman conversion';obj['source_id']=identifier;obj['source_commit']=reg['source_commit'];created.append(obj)
 return created
