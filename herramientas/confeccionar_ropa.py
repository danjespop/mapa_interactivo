"""Une patrones de prendas, suaviza costuras y abre cuello, mangas y bajos.
Blender --background --factory-startup --python herramientas/confeccionar_ropa.py
Entradas: /tmp/ropa-patrones.json, generado con herramientas/modelo3d/exportar-ropa.mjs.
"""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
raw=json.loads(Path('/tmp/ropa-patrones.json').read_text());result={}
for sex,data in raw.items():
 packed={'positions':[],'indices':[],'joints':[],'weights':[],'parts':[],'bones':data['bones']}
 for part in [1,0]:
  points=[data['positions'][i:i+3] for i in range(0,len(data['positions']),3)];faces=[data['indices'][i:i+3] for i in range(0,len(data['indices']),3) if data['parts'][data['indices'][i]]==part]
  used=sorted({v for f in faces for v in f});remap={v:i for i,v in enumerate(used)};mesh=bpy.data.meshes.new('Patrón');mesh.from_pydata([points[i] for i in used],[],[[remap[v] for v in f] for f in faces]);mesh.update();source=bpy.data.objects.new('Patrón original',mesh);bpy.context.collection.objects.link(source)
  groups=[source.vertex_groups.new(name=name) for name in data['bones']]
  for old,new in remap.items():
   for j in range(4):
    weight=data['weights'][old*4+j]
    if weight:groups[data['joints'][old*4+j]].add([new],weight,'REPLACE')
  # Close the temporary volumes so the voxel operation unites intersecting pieces.
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
  obj=source.copy();obj.data=mesh.copy();bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True);source.select_set(False);obj.data.remesh_voxel_size=.0045;obj.data.use_remesh_preserve_volume=True;bpy.ops.object.voxel_remesh()
  relax=obj.modifiers.new('Costuras continuas','SMOOTH');relax.factor=.55;relax.iterations=12;bpy.ops.object.modifier_apply(modifier=relax.name)
  bm=bmesh.new();bm.from_mesh(obj.data);remove=[]
  for face in bm.faces:
   center=face.calc_center_median();cut=False
   if part:
    cut=center.y>1.451 or center.y<.946
    for side in ['L','R']:
     a=Vector(data['reference']['upperarm_'+side]);b=Vector(data['reference']['forearm_'+side]);axis=(b-a).normalized();cuff=a.lerp(b,.72)
     if abs(center.x)>.14 and (center-cuff).dot(axis)>-.004 and face.normal.dot(axis)>.45 and (center-a-axis*(center-a).dot(axis)).length<.09:cut=True
   else:cut=center.y>.981 or center.y<.118
   if cut:remove.append(face)
  bmesh.ops.delete(bm,geom=remove,context='FACES');bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0005);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
  # Subtle cloth folds rather than the original body or genital contours.
  for v in obj.data.vertices:
   y=v.co.y;amplitude=.0012*(max(0,1-abs(y-(1.02 if part else .46))/.13));v.co+=v.normal*(math.sin(y*105+v.co.x*37+v.co.z*24)*amplitude)
  for name in data['bones']:
   if name not in obj.vertex_groups:obj.vertex_groups.new(name=name)
  transfer=obj.modifiers.new('Pesos de los patrones','DATA_TRANSFER');transfer.object=source;transfer.use_vert_data=True;transfer.data_types_verts={'VGROUP_WEIGHTS'};transfer.vert_mapping='POLYINTERP_NEAREST';transfer.layers_vgroup_select_src='ALL';transfer.layers_vgroup_select_dst='NAME';bpy.ops.object.modifier_apply(modifier=transfer.name)
  shell=obj.modifiers.new('Espesor del tejido','SOLIDIFY');shell.thickness=.0012;shell.offset=0;bpy.ops.object.modifier_apply(modifier=shell.name)
  obj.data.calc_loop_triangles();offset=len(packed['positions'])//3
  for v in obj.data.vertices:
   packed['positions'].extend(round(c,5) for c in v.co);packed['parts'].append(part);weights=sorted(((g.group,g.weight) for g in v.groups if g.weight>1e-8),key=lambda p:p[1],reverse=True)[:4];total=sum(w for g,w in weights)
   if not total:raise RuntimeError('Vértice de prenda sin articulación')
   for j in range(4):packed['joints'].append(weights[j][0] if j<len(weights) else 0);packed['weights'].append(round(weights[j][1]/total,6) if j<len(weights) else 0)
  for face in obj.data.loop_triangles:packed['indices'].extend(offset+i for i in face.vertices)
  print('PRENDA',sex,part,len(obj.data.vertices),len(obj.data.polygons),flush=True);bpy.data.objects.remove(obj,do_unlink=True);bpy.data.objects.remove(source,do_unlink=True)
 result[sex]=packed
out=Path(__file__).resolve().parent.parent/'assets/modelo3d/ropa-datos.js';out.write_text('/* Prendas de diseño propio, ajustadas al atlas. Ver ATRIBUCIONES.md. */\nglobalThis.ATLAS_SPORTSWEAR='+json.dumps(result,separators=(',',':'))+';\n');print('ROPA',out.stat().st_size,flush=True)
