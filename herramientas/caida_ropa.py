"""Asienta prendas con restricciones de longitud, gravedad y colisión en Blender.
Entrada: ropa-datos.js (patrones continuos) y /tmp/cuerpos-colision-ropa.json,
generado por modelo3d/exportar-colision-ropa.mjs. Congela el drapeado; el
movimiento web conserva el mismo esqueleto (no simula tela en tiempo real).
"""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
def outward(point,normal):
 center=Vector(((.078 if point.x>0 else -.078) if point.y<.84 else 0,point.y,.015))
 return normal if normal.dot(point-center)>=0 else -normal
root=Path(__file__).resolve().parent.parent;path=root/'assets/modelo3d/ropa-datos.js'
raw=json.loads(path.read_text().split('=',1)[1].rsplit(';',1)[0]);bodies=json.loads(Path('/tmp/cuerpos-colision-ropa.json').read_text());result={}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.gravity=(0,-9.81,0);scene.render.fps=30
for sex,data in raw.items():
 body=bodies[sex];mesh=bpy.data.meshes.new('Cuerpo de colisión');mesh.from_pydata(body['positions'],[],body['faces']);mesh.update();collider=bpy.data.objects.new('Cuerpo',mesh);bpy.context.collection.objects.link(collider);bpy.context.view_layer.objects.active=collider;collider.select_set(True)
 dec=collider.modifiers.new('Proxy de colisión','DECIMATE');dec.ratio=min(1,12000/len(mesh.polygons));bpy.ops.object.modifier_apply(modifier=dec.name)
 bm=bmesh.new();bm.from_mesh(collider.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(collider.data);bm.free();collider.modifiers.new('Colisión textil','COLLISION');collider.collision.thickness_outer=.004;collider.collision.cloth_friction=8
 tree=BVHTree.FromPolygons([v.co for v in collider.data.vertices],[tuple(f.vertices) for f in collider.data.polygons]);out={k:[] for k in ['positions','indices','joints','weights','parts']};out.update(bones=data['bones'],components={'camiseta':1,'pantalon':1},style='tank-shorts-draped')
 for part in [1,0]:
  scene.frame_set(1);faces=[data['indices'][i:i+3] for i in range(0,len(data['indices']),3) if data['parts'][data['indices'][i]]==part];used=sorted({v for f in faces for v in f});remap={v:i for i,v in enumerate(used)}
  mesh=bpy.data.meshes.new('Tela continua');mesh.from_pydata([data['positions'][i*3:i*3+3] for i in used],[],[[remap[i] for i in f] for f in faces]);mesh.update();obj=bpy.data.objects.new('Camiseta' if part else 'Pantalón',mesh);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;collider.select_set(False);obj.select_set(True)
  groups=[obj.vertex_groups.new(name=n) for n in data['bones']]
  for old,i in remap.items():
   for j in range(4):
    w=data['weights'][old*4+j]
    if w:groups[data['joints'][old*4+j]].add([i],w,'REPLACE')
  # Keep the original connected sheet; in particular do not cut through crotch
  # triangles while removing the former inner shell.
  for v in mesh.vertices:
   p,n,_,distance=tree.find_nearest(v.co)
   if p is not None:
    n=outward(p,n)
    if distance<.012 and (v.co-p).dot(n)<.006:v.co=p+n*.006
  pin=obj.vertex_groups.new(name='Anclajes')
  for v in mesh.vertices:
   y=v.co.y;w=max(0,min(1,(y-(1.405 if part else .925))/(.022 if part else .025)))
   if w:pin.add([v.index],w,'REPLACE')
  # Position-based drape: bounded gravity, edge-length constraints and contact.
  # A large unconstrained Blender Cloth step can explode the pre-existing fine
  # triangulation; small projected constraints retain the finished topology.
  initial=[v.co.copy() for v in mesh.vertices];positions=[v.copy() for v in initial]
  edges=[(e.vertices[0],e.vertices[1],(initial[e.vertices[0]]-initial[e.vertices[1]]).length) for e in mesh.edges]
  anchors=[max(0,min(1,(v.y-(1.405 if part else .925))/(.022 if part else .025))) for v in initial]
  for iteration in range(60):
   for i,p in enumerate(positions):p.y-=.00020*(1-anchors[i])
   for sweep in range(2):
    for a,b,length in edges:
     delta=positions[b]-positions[a];distance=delta.length
     if distance<1e-8:continue
     wa,wb=1-anchors[a],1-anchors[b];total=wa+wb
     if total:correction=delta*((distance-length)/distance*.75);positions[a]+=correction*(wa/total);positions[b]-=correction*(wb/total)
   for i,p in enumerate(positions):
    p.lerp(initial[i],anchors[i]);delta=p-initial[i]
    if delta.length>.035:p=initial[i]+delta.normalized()*.035;positions[i]=p
    closest,normal,_,distance=tree.find_nearest(p)
    if closest is not None:
     normal=outward(closest,normal)
     if distance<.018 and (p-closest).dot(normal)<.006:positions[i]=closest+normal*.006
    delta=positions[i]-initial[i]
    if delta.length>.025:positions[i]=initial[i]+delta.normalized()*.025
  maximum=max((p-initial[i]).length for i,p in enumerate(positions))
  if maximum>.055:raise RuntimeError('Caída fuera del margen de confección: '+str(maximum))
  for v,p in zip(mesh.vertices,positions):v.co=p
  print('DESPLAZAMIENTO MAX',sex,part,round(maximum,4),flush=True)
  mesh.calc_loop_triangles();offset=len(out['positions'])//3
  for v in mesh.vertices:
   if not all(math.isfinite(c) for c in v.co):raise RuntimeError('Simulación inestable')
   out['positions'].extend(round(c,5) for c in v.co);out['parts'].append(part);ws=sorted(((g.group,g.weight) for g in v.groups if g.group<len(groups) and g.weight>1e-8),key=lambda a:a[1],reverse=True)[:4];total=sum(w for g,w in ws)
   if not total:raise RuntimeError('Tela sin pesos')
   for j in range(4):out['joints'].append(ws[j][0] if j<len(ws) else 0);out['weights'].append(round(ws[j][1]/total,6) if j<len(ws) else 0)
  for f in mesh.loop_triangles:out['indices'].extend(offset+i for i in f.vertices)
  print('DRAPEADO',sex,part,len(mesh.vertices),len(mesh.polygons),flush=True);bpy.data.objects.remove(obj,do_unlink=True)
 result[sex]=out;bpy.data.objects.remove(collider,do_unlink=True)
path.write_text('/* Ropa continua drapeada con colisión sobre cada cuerpo en Blender. Ver ATRIBUCIONES.md. */\nglobalThis.ATLAS_SPORTSWEAR='+json.dumps(result,separators=(',',':'))+';\n')
