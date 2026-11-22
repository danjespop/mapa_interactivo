"""Reduce las prendas terminadas, conservando las costuras y sus pesos de animación."""
import bpy,json,bmesh
from pathlib import Path
path=Path(__file__).resolve().parent.parent/'assets/modelo3d/ropa-datos.js';text=path.read_text();raw=json.loads(text.split('=',1)[1].rsplit(';',1)[0]);result={}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for sex,data in raw.items():
 out={k:[] for k in ['positions','indices','joints','weights','parts']};out['bones']=data['bones'];out['components']={}
 for part in [1,0]:
  faces=[data['indices'][i:i+3] for i in range(0,len(data['indices']),3) if data['parts'][data['indices'][i]]==part];used=sorted({v for f in faces for v in f});remap={v:i for i,v in enumerate(used)}
  mesh=bpy.data.meshes.new('Prenda continua');mesh.from_pydata([data['positions'][i*3:i*3+3] for i in used],[],[[remap[v] for v in f] for f in faces]);mesh.update();obj=bpy.data.objects.new('Prenda',mesh);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True);groups=[obj.vertex_groups.new(name=n) for n in data['bones']]
  for original,index in remap.items():
   for j in range(4):
    w=data['weights'][original*4+j]
    if w:groups[data['joints'][original*4+j]].add([index],w,'REPLACE')
  mod=obj.modifiers.new('Malla web conservando pesos','DECIMATE');mod.ratio=min(1,28000/len(mesh.polygons));mod.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=mod.name)
  bm=bmesh.new();bm.from_mesh(obj.data);seen=set();components=[]
  for v in bm.verts:
   if v in seen:continue
   stack=[v];seen.add(v);component=[]
   while stack:
    current=stack.pop();component.append(current)
    for edge in current.link_edges:
     other=edge.other_vert(current)
     if other not in seen:seen.add(other);stack.append(other)
   components.append(component)
  largest=max(len(c) for c in components);small=[v for c in components if len(c)<max(10,largest*.001) for v in c]
  if small:bmesh.ops.delete(bm,geom=small,context='VERTS')
  out['components']['camiseta' if part else 'pantalon']=sum(len(c)>=max(10,largest*.001) for c in components)
  bm.to_mesh(obj.data);bm.free();obj.data.calc_loop_triangles();offset=len(out['positions'])//3
  for v in obj.data.vertices:
   out['positions'].extend(round(c,5) for c in v.co);out['parts'].append(part);ws=sorted(((g.group,g.weight) for g in v.groups if g.weight>1e-8),key=lambda a:a[1],reverse=True)[:4];total=sum(w for g,w in ws)
   if not total:raise RuntimeError('Vértice sin pesos')
   for j in range(4):out['joints'].append(ws[j][0] if j<len(ws) else 0);out['weights'].append(round(ws[j][1]/total,6) if j<len(ws) else 0)
  for face in obj.data.loop_triangles:out['indices'].extend(offset+i for i in face.vertices)
  print('SIMPLIFICADA',sex,part,len(obj.data.vertices),'componentes',out['components'],flush=True);bpy.data.objects.remove(obj,do_unlink=True)
 result[sex]=out
path.write_text('/* Prendas continuas de diseño propio confeccionadas en Blender. Ver ATRIBUCIONES.md. */\nglobalThis.ATLAS_SPORTSWEAR='+json.dumps(result,separators=(',',':'))+';\n');print('ROPA WEB',path.stat().st_size,flush=True)
