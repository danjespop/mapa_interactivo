"""Proyecta el labio derecho sobre el reflejo de la superficie izquierda sana."""
import math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def symmetric_lips(obj):
 mesh=obj.data;vertices=[v.co.copy() for v in mesh.vertices];faces=[tuple(f.vertices) for f in mesh.polygons if all(vertices[i].x<.0004 and 1.49<vertices[i].z<1.57 and vertices[i].y<-.045 for i in f.vertices)]
 tree=BVHTree.FromPolygons(vertices,faces,all_triangles=False);changed=0;maximum=0
 for v in mesh.vertices:
  p=v.co
  if not(.0005<p.x<.037 and 1.511<p.z<1.549 and p.y<-.060):continue
  reflected=Vector((-p.x,p.y,p.z));point,normal,face,distance=tree.find_nearest(reflected)
  if point is None or distance>.008:continue
  edge=min(1,(.037-p.x)/.004,(p.z-1.511)/.003,(1.549-p.z)/.003);factor=max(0,edge);target=Vector((-point.x,point.y,point.z));maximum=max(maximum,(target-p).length);v.co=v.co.lerp(target,factor);changed+=1
 # Fair both mouth corners through their own surface adjacency. This removes
 # the pinched commissure ridge while preserving the lip border and philtrum.
 adjacency={}
 for edge in mesh.edges:
  a,b=edge.vertices;adjacency.setdefault(a,set()).add(b);adjacency.setdefault(b,set()).add(a)
 smoothed=0
 for iteration in range(18):
  previous=[v.co.copy() for v in mesh.vertices]
  for v in mesh.vertices:
   p=previous[v.index];x=abs(p.x)
   if not(.017<x<.045 and 1.508<p.z<1.550 and p.y<-.057):continue
   falloff=math.exp(-((x-.030)/.009)**2-((p.z-1.529)/.012)**2)
   neighbors=adjacency.get(v.index,[])
   if neighbors:v.co=p.lerp(sum((previous[i] for i in neighbors),Vector())/len(neighbors),.45*falloff);smoothed+=1
 mesh.update();print('LIP CORNER FAIRING',smoothed,flush=True)
 print('LIP SYMMETRY',changed,'max correction mm',maximum*1000,flush=True)
