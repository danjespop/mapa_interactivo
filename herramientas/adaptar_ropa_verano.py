"""Recorta prendas continuas a camisetas de tirantes y pantalón corto."""
import bpy,bmesh,json,math
from pathlib import Path
path=Path(__file__).resolve().parent.parent/'assets/modelo3d/ropa-datos.js';data=json.loads(path.read_text().split('=',1)[1].rsplit(';',1)[0]);result={}
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
for sex,raw in data.items():
 out={k:[] for k in ['positions','indices','joints','weights','parts']};out['bones']=raw['bones'];out['components']={};out['style']='tank-shorts'
 for part in [1,0]:
  faces=[raw['indices'][i:i+3] for i in range(0,len(raw['indices']),3) if raw['parts'][raw['indices'][i]]==part];used=sorted({v for f in faces for v in f});mapping={v:i for i,v in enumerate(used)};mesh=bpy.data.meshes.new('Prenda de verano');mesh.from_pydata([raw['positions'][i*3:i*3+3] for i in used],[],[[mapping[v] for v in f] for f in faces]);mesh.update();obj=bpy.data.objects.new('Prenda',mesh);bpy.context.collection.objects.link(obj);groups=[obj.vertex_groups.new(name=n) for n in raw['bones']]
  for original,index in mapping.items():
   for j in range(4):
    w=raw['weights'][original*4+j]
    if w:groups[raw['joints'][original*4+j]].add([index],w,'REPLACE')
  bm=bmesh.new();bm.from_mesh(mesh)
  if part:
   remove=[]
   for face in bm.faces:
    p=face.calc_center_median();x=abs(p.x);side=.172-(.172-.113)*smooth(1.28,1.37,p.y);neck=(1.405 if p.z>0 else 1.432)+.052*(x/.070)**2
    if x>side or (x<.080 and p.y>neck):remove.append(face)
   bmesh.ops.delete(bm,geom=remove,context='FACES')
  else:bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,.59,0),plane_no=(0,1,0),clear_inner=True,clear_outer=False)
  seen=set();components=[]
  for v in bm.verts:
   if v in seen:continue
   queue=[v];seen.add(v);comp=[]
   while queue:
    current=queue.pop();comp.append(current)
    for edge in current.link_edges:
     other=edge.other_vert(current)
     if other not in seen:seen.add(other);queue.append(other)
   components.append(comp)
  largest=max(components,key=len);remove=[v for c in components if c is not largest for v in c]
  if remove:bmesh.ops.delete(bm,geom=remove,context='VERTS')
  boundary=[v for v in bm.verts if any(e.is_boundary for e in v.link_edges)]
  for _ in range(4):bmesh.ops.smooth_vert(bm,verts=boundary,factor=.45,use_axis_x=True,use_axis_y=True,use_axis_z=True)
  bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.calc_loop_triangles();offset=len(out['positions'])//3
  for v in mesh.vertices:
   out['positions'].extend(round(c,5) for c in v.co);out['parts'].append(part);ws=sorted(((g.group,g.weight) for g in v.groups if g.weight>1e-8),key=lambda a:a[1],reverse=True)[:4];total=sum(w for g,w in ws)
   for j in range(4):out['joints'].append(ws[j][0] if j<len(ws) else 0);out['weights'].append(round(ws[j][1]/total,6) if j<len(ws) else 0)
  for face in mesh.loop_triangles:out['indices'].extend(offset+i for i in face.vertices)
  out['components']['camiseta' if part else 'pantalon']=1;print(sex,part,len(mesh.vertices),flush=True);bpy.data.objects.remove(obj,do_unlink=True)
 result[sex]=out
path.write_text('/* Camisetas de tirantes y pantalones cortos de diseño propio, confeccionados en Blender. */\nglobalThis.ATLAS_SPORTSWEAR='+json.dumps(result,separators=(',',':'))+';\n')
