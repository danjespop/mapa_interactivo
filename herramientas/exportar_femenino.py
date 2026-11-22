"""Exporta una superficie femenina MakeHuman CC0 con rig educativo y postura relajada.
Blender --background --factory-startup --python herramientas/exportar_femenino.py
Los archivos de referencia se describen en ATRIBUCIONES.md; originales fuera del repositorio.
"""
import bpy,math,json,sys
from mathutils import Vector,Matrix,Quaternion
from pathlib import Path
r=Path(__file__).resolve().parent.parent;out=r/'assets/modelo3d'
sys.path.insert(0,str(r/'herramientas'))
from pesos_superficie import surface_weights,smooth_surface_weights
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
vertices=[];body_faces=[];joints={};group=''
for line in open('/tmp/makehuman-base.obj'):
 a=line.split()
 if not a:continue
 if a[0]=='v':vertices.append(Vector(tuple(float(v) for v in a[1:4])))
 elif a[0]=='g':group=a[1]
 elif a[0]=='f':
  face=[int(v.split('/')[0])-1 for v in a[1:]]
  if group=='body':body_faces.append(face)
  elif group.startswith('joint-'):joints.setdefault(group,set()).update(face)
base=[v.copy() for v in vertices]
for file,weight in [('/tmp/female-young.target',1/3),('/tmp/female-african.target',1/3),('/tmp/female-asian.target',1/3),('/tmp/female-weight.target',1),('/tmp/female-breast.target',.35)]:
 for line in open(file):
  a=line.split()
  if len(a)==4 and not line.startswith('#'):vertices[int(a[0])]+=Vector(tuple(float(x)*weight for x in a[1:]))
used={i for f in body_faces for i in f};lo=min(vertices[i].y for i in used);hi=max(vertices[i].y for i in used);scale=1.72/(hi-lo)
def joint(name):return sum((vertices[i] for i in joints[name]),Vector())/len(joints[name])
rawj={name:joint(name) for name in joints}
def metric(v):return Vector((v.x*scale,-v.z*scale,(v.y-lo)*scale))
verts=[metric(v) for v in vertices];js={name:metric(v) for name,v in rawj.items()}
# Classify tissue in the separated reference A-pose, before hands approach the hips.
# This prevents thigh/torso vertices from following nearby fingers in the relaxed pose.
def segment_distance(v,a,b):
 ab=b-a;t=max(0,min(1,(v-a).dot(ab)/max(ab.length_squared,1e-10)));return (v-a-ab*t).length
regions={}
for i in used:
 v=verts[i];options=[(segment_distance(v,js['joint-pelvis'],js['joint-neck']),'axial'),(segment_distance(v,js['joint-neck'],js['joint-head-2']),'axial')]
 for side in ['l','r']:
  for a,b in [('shoulder','elbow'),('elbow','hand'),('hand','hand-3')]:options.append((segment_distance(v,js[f'joint-{side}-{a}'],js[f'joint-{side}-{b}']),'upper_'+side.upper()))
  for a,b in [('upper-leg','knee'),('knee','ankle'),('ankle','foot-2')]:options.append((segment_distance(v,js[f'joint-{side}-{a}'],js[f'joint-{side}-{b}']),'lower_'+side.upper()))
 regions[i]=min(options)[1]
# Relax the reference A-pose, using the original joint landmarks.
for side,sign in [('l',1),('r',-1)]:
 shoulder=js[f'joint-{side}-shoulder'];elbow=js[f'joint-{side}-elbow'];hand=js[f'joint-{side}-hand'];hip=js[f'joint-{side}-upper-leg'];knee=js[f'joint-{side}-knee'];ankle=js[f'joint-{side}-ankle'];
 armangle=-sign*math.atan2(abs(elbow.x-shoulder.x),shoulder.z-elbow.z);legangle=-sign*math.atan2(abs(ankle.x-hip.x),hip.z-ankle.z)
 # Rotate about Blender Y (x/z plane); sign convention is opposite to an x/y-plane rotation.
 armrot=Matrix.Rotation(-armangle,3,'Y');legrot=Matrix.Rotation(-legangle,3,'Y')
 for i in used:
  v=verts[i]
  arm_dist=min((v-shoulder).length,(v-elbow).length,(v-hand).length)
  leg_dist=min((v-hip).length,(v-knee).length,(v-ankle).length)
  if arm_dist<leg_dist and v.x*sign>shoulder.x*sign*.85 and v.z<shoulder.z+.04 and v.z>hip.z-.3:
   t=max(0,min(1,(v.x*sign-shoulder.x*sign*.85)/.045));verts[i]=v.lerp(shoulder+armrot@(v-shoulder),t)
  elif v.x*sign>0 and v.z<hip.z+.015:
   t=max(0,min(1,(hip.z+.015-v.z)/.1));verts[i]=v.lerp(hip+legrot@(v-hip),t)
 for name,v in list(js.items()):
  if name.startswith('joint-'+side+'-'):
   if any(t in name for t in ['elbow','hand','finger']):js[name]=shoulder+armrot@(v-shoulder)
   elif any(t in name for t in ['knee','ankle','foot','toe']):js[name]=hip+legrot@(v-hip)
# Straighten the reference forearms before rigging. The MakeHuman base has a
# pre-flexed elbow; adding the animation on top would over-flex wrists/hands.
for side in ['l','r']:
 shoulder=js[f'joint-{side}-shoulder'];elbow=js[f'joint-{side}-elbow'];hand=js[f'joint-{side}-hand'];direction=(hand-elbow).normalized();target=(elbow-shoulder).normalized();rotation=direction.rotation_difference(target)
 for i in used:
  if regions[i]!='upper_'+side.upper():continue
  t=max(0,min(1,((verts[i]-elbow).dot(direction)+.025)/.065));t=t*t*(3-2*t)
  if t:verts[i]=elbow+Quaternion().slerp(rotation,t)@(verts[i]-elbow)
 for name,v in list(js.items()):
  if name.startswith('joint-'+side+'-') and any(t in name for t in ['hand','finger']):js[name]=elbow+rotation@(v-elbow)
# Put both palms in the same anatomical reference used by the animation.
# Thumb/index and little-finger MCP landmarks define the palm plane.
palm_normals={}
for side in ['l','r']:
 wrist=js[f'joint-{side}-hand'];elbow=js[f'joint-{side}-elbow'];axis=(wrist-elbow).normalized()
 center=sum((js[f'joint-{side}-finger-{digit}-1'] for digit in range(2,6)),Vector())/4
 across=js[f'joint-{side}-finger-2-1']-js[f'joint-{side}-finger-5-1'];normal=(center-wrist).cross(across).normalized()
 if side=='r':normal=-normal
 current=(normal-axis*normal.dot(axis)).normalized();target=Vector((0,-1,0));target=(target-axis*target.dot(axis)).normalized();angle=math.atan2(axis.dot(current.cross(target)),current.dot(target));rotation=Quaternion(axis,angle)
 for i in used:
  if regions[i]!='upper_'+side.upper():continue
  t=max(0,min(1,((verts[i]-wrist).dot(axis)+.045)/.06));t=t*t*(3-2*t)
  if t:verts[i]=wrist+Quaternion().slerp(rotation,t)@(verts[i]-wrist)
 for name,v in list(js.items()):
  if name.startswith('joint-'+side+'-') and any(t in name for t in ['hand','finger']):js[name]=wrist+rotation@(v-wrist)
 result=rotation@normal;palm_normals[side]=[result.x,result.z,-result.y]
# Keep only the body surface, excluding MakeHuman's fitting helpers.
ids=sorted(used);remap={v:i for i,v in enumerate(ids)};mesh=bpy.data.meshes.new('MakeHuman female surface');mesh.from_pydata([verts[i] for i in ids],[],[[remap[i] for i in face] for face in body_faces]);mesh.update();obj=bpy.data.objects.new('Cuerpo femenino · MakeHuman',mesh);bpy.context.collection.objects.link(obj);obj['system']='piel';obj['anatomical_name']='Superficie femenina MakeHuman CC0';obj['source']='MakeHuman Community';
mat=bpy.data.materials.new('piel_Superficie femenina');mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.48,.265,.135,1);bsdf.inputs['Roughness'].default_value=.62;mesh.materials.append(mat)
region_groups={name:obj.vertex_groups.new(name='region_'+name) for name in ['axial','upper_L','upper_R','lower_L','lower_R']}
for original in ids:region_groups[regions[original]].add([remap[original]],1,'REPLACE')
region_indices={g.index:name for name,g in region_groups.items()}
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
for f in obj.data.polygons:f.use_smooth=True
pelvis=js['joint-pelvis'];spine=Vector((0,pelvis.y,pelvis.z+.12));neck=js['joint-neck'];head=js['joint-head'];top=js['joint-head-2'];spec=[('pelvis',pelvis,spine,None),('spine',spine,neck,'pelvis'),('neck',neck,head,'spine'),('head',head,top,'neck')]
for side in ['l','r']:
 S=side.upper();a=js[f'joint-{side}-shoulder'];b=js[f'joint-{side}-elbow'];c=js[f'joint-{side}-hand'];d=sum((js[f'joint-{side}-finger-{digit}-1'] for digit in range(2,6)),Vector())/4;hip=js[f'joint-{side}-upper-leg'];knee=js[f'joint-{side}-knee'];ankle=js[f'joint-{side}-ankle'];toe=js[f'joint-{side}-foot-2'];spec.extend([(f'clavicle_{S}',js[f'joint-{side}-clavicle'],a,'spine'),(f'upperarm_{S}',a,b,f'clavicle_{S}'),(f'forearm_{S}',b,c,f'upperarm_{S}'),(f'hand_{S}',c,d,f'forearm_{S}'),(f'thigh_{S}',hip,knee,'pelvis'),(f'shin_{S}',knee,ankle,f'thigh_{S}'),(f'foot_{S}',ankle,toe,f'shin_{S}')])
for side in ['l','r']:
 for digit in range(1,6):
  points=[js[f'joint-{side}-finger-{digit}-{j}'] for j in range(1,5) if f'joint-{side}-finger-{digit}-{j}' in js]
  for j in range(len(points)-1):
   key=f'finger_{digit-1}_{j}_{side.upper()}';parent=f'hand_{side.upper()}' if j==0 else f'finger_{digit-1}_{j-1}_{side.upper()}';spec.append((key,points[j],points[j+1],parent))
arm=bpy.data.armatures.new('Female educational rig');rig=bpy.data.objects.new('FemaleRig',arm);bpy.context.collection.objects.link(rig);obj.select_set(False);rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for name,a,b,parent in spec:
 bone=arm.edit_bones.new('female_'+name);bone.head=a;bone.tail=b
 if parent:bone.parent=arm.edit_bones['female_'+parent]
bpy.ops.object.mode_set(mode='OBJECT')
for name,a,b,parent in spec:
 if name.startswith(('finger_','hand_')):
  axis=Vector((0,-1,0)).cross((Vector(b)-Vector(a)).normalized()).normalized();rig.data.bones['female_'+name]['flexion_axis']=[axis.x,axis.z,-axis.y]
def dist(v,a,b):
 ab=b-a;t=max(0,min(1,(v-a).dot(ab)/max(1e-10,ab.length_squared)));return (v-a-ab*t).length
segments=[(name,Vector(a),Vector(b)) for name,a,b,_ in spec];groups={name:obj.vertex_groups.new(name='female_'+name) for name,_,_ in segments}
for v in obj.data.vertices:
 region=max(((g.weight,region_indices[g.group]) for g in v.groups if g.group in region_indices),default=(1,'axial'))[1]
 for name,w in surface_weights(v.co,region,segments).items():groups[name].add([v.index],w,'REPLACE')
smooth_surface_weights(obj,groups)
bpy.context.view_layer.objects.active=obj;obj.select_set(True);rig.select_set(False);sub=obj.modifiers.new('Continuous smooth surface','SUBSURF');sub.levels=2;sub.render_levels=2;bpy.ops.object.modifier_apply(modifier=sub.name)
mod=obj.modifiers.new('Female skin animation','ARMATURE');mod.object=rig;obj.parent=rig
# Hair and eyes are attached from the atlas at runtime, retaining their original attribution.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'femenino.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_skins=True,export_texcoords=False)
(out/'femenino-manifest.json').write_text(json.dumps(dict(source='MakeHuman Community, CC0',commit=Path('/tmp/makehuman-commit.txt').read_text().strip(),vertices=len(obj.data.vertices),faces=len(obj.data.polygons),height_m=1.72,regional_skinning=True,breast_target='female-young-averagemuscle-averageweight-maxcup-averagefirmness.target',breast_target_weight=.35,anatomical_palm_reference=True,palm_normals=palm_normals,rig_revision='continuous-regional-surface-digit-axes-v3',eye_centers={side:[js['joint-'+side+'-eye'].x,js['joint-'+side+'-eye'].z,-js['joint-'+side+'-eye'].y] for side in ['l','r']},scope='Superficie femenina de referencia. Sistemas internos compartidos del atlas Z-Anatomy, no específicos de sexo.'),indent=2)+'\n');print('FEMALE EXPORTED',len(obj.data.vertices),flush=True)
