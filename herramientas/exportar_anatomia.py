"""Blender --background --factory-startup --disable-autoexec Startup.blend --python herramientas/exportar_anatomia.py
Convierte Z-Anatomy (commit documentado) en un atlas glTF con rig didáctico, sin ejecutar scripts del archivo.
"""
import bpy,math,json,os,sys
from mathutils import Vector
from pathlib import Path
out=Path(__file__).resolve().parent.parent/'assets/modelo3d';out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(Path(__file__).resolve().parent))
from clasificar_anatomia import classify,tissue_color,COLORS
from pesos_superficie import surface_weights,smooth_surface_weights
from incorporar_bodyparts3d import add_reference_parts
reference_parts=add_reference_parts(Path(__file__).resolve().parent.parent)
selected=[];conversion_omissions=[]
for obj in list(bpy.data.objects):
 if obj.name=='Jejunum' and obj.type=='CURVE':continue # Replaced by a matching reference jejunum/ileum pair.
 if obj.type not in ['MESH','CURVE'] or not any(m and m.name!='Text' for m in obj.data.materials) or obj.name.endswith(('.g','.j')):continue
 if obj.type=='MESH' and len(obj.data.polygons)==0:continue
 if all(m and m.name.startswith(('Origin-','End-')) for m in obj.data.materials):continue
 cols=[c.name for c in obj.users_collection];info=classify(obj.name,cols,[m.name if m else '' for m in obj.data.materials])
 if not info:continue
 obj['region']='upper' if any(any(t in c.lower() for t in ['upper limb','forearm','hand']) or c.lower()=='arm' for c in cols) else 'lower' if any(any(t in c.lower() for t in ['lower limb','thigh','foot']) or c.lower()=='leg' for c in cols) else 'axial'
 obj['system']=info['primary'];obj['systems']=info['systems'];obj['vascular_kind']=info['vascular_kind'] or '';obj['anatomical_name']=obj.get('anatomical_name',obj.name);obj['source_type']=obj.type;obj['source']=obj.get('source','Z-Anatomy / BodyParts3D')
 if '?' in obj.name:
  obj['display_name_es']='Rama vascular sin identificar en el atlas' if info['primary']=='circulatorio' else 'Estructura sin identificar en el atlas';obj['qa_name']='pendiente'
 selected.append(obj)
# Curves are real model surfaces (vessels, nerves and hollow viscera). Bake them while
# their original bevel profiles and dependencies still exist, before removing helpers.
curves=[o for o in selected if o.type=='CURVE']
for o in curves:
 o.data=o.data.copy();o.data.resolution_u=min(o.data.resolution_u,6);o.data.bevel_resolution=min(o.data.bevel_resolution,3)
depsgraph=bpy.context.evaluated_depsgraph_get();baked_curves=[]
for i,o in enumerate(curves):
 mesh=bpy.data.meshes.new_from_object(o.evaluated_get(depsgraph),depsgraph=depsgraph)
 if len(mesh.polygons):baked_curves.append((o,mesh,o.name,o.matrix_world.copy(),[c for c in o.users_collection],dict(o.items())))
 else:conversion_omissions.append(o.name)
 if i%150==0:print('CURVES BAKED',i,flush=True)
new_curves=[]
for old,mesh,name,world,collections,metadata in baked_curves:
 new=bpy.data.objects.new(name+'_surface',mesh);new.matrix_world=world
 for c in collections:c.objects.link(new)
 for key,value in metadata.items():new[key]=value
 new_curves.append((new,name))
selected=[o for o in selected if o.type!='CURVE'];bpy.data.batch_remove(ids=curves)
for new,name in new_curves:new.name=name;selected.append(new)
print('CURVE SURFACES',len(new_curves),'OMISSIONS',conversion_omissions,flush=True)
print('SELECTED',len(selected),flush=True)
world_transforms={o:o.matrix_world.copy() for o in selected}
for o in selected:
 o.animation_data_clear()
 for constraint in list(o.constraints):o.constraints.remove(constraint)
bpy.data.batch_remove(ids=[o for o in bpy.data.objects if o not in selected])
print('REMOVED HELPERS',flush=True)
# Assign all modifiers before updating the dependency graph once, avoiding thousands of scene rebuilds.
from mathutils import Matrix
for obj in selected:
 obj.animation_data_clear();obj.data=obj.data.copy();obj.data.transform(world_transforms[obj]);
 if world_transforms[obj].determinant()<0:obj.data.flip_normals()
 obj.parent=None;obj.matrix_world=Matrix.Identity(4);obj.hide_set(False);obj.hide_viewport=False;obj.hide_render=False
 for mod in list(obj.modifiers):obj.modifiers.remove(mod)
 polys=len(obj.data.polygons);budget=2200 if obj['system']=='muscular' else (10000 if any(n in obj.name.lower() for n in ['frontal bone','parietal bone','temporal bone','occipital bone','mandible','maxilla']) else 3600)
 if 'abdominis' in obj.name.lower() or 'abdominal oblique' in obj.name.lower():budget=14000
 if polys>budget and obj['system']!='piel':
  mod=obj.modifiers.new('Web surface reduction','DECIMATE');mod.ratio=max(.12,budget/polys)
print('MODIFIERS READY',flush=True)
depsgraph=bpy.context.evaluated_depsgraph_get()
baked={}
for idx,obj in enumerate(selected):
 if obj.modifiers:baked[obj]=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),depsgraph=depsgraph)
 if idx%300==0:print('DECIMATED',idx,flush=True)
for obj,mesh in baked.items():
 obj.data=mesh
 for mod in list(obj.modifiers):obj.modifiers.remove(mod)
for obj in selected:
 for f in obj.data.polygons:f.use_smooth=True
bpy.data.batch_remove(ids=list(bpy.data.collections))
collection=bpy.data.collections.new('Anatomical atlas');bpy.context.scene.collection.children.link(collection)
for o in selected:collection.objects.link(o)
# Join anatomical skin regions along their shared boundaries to remove patch seams.
import bmesh
skin_parts=[o for o in selected if o['system']=='piel' and not any(t in o.name.lower() for t in ['hair','nail','perionyx'])]
verts=[];faces=[];skin_regions=[]
region_names=['axial','upper_L','upper_R','lower_L','lower_R']
for o in skin_parts:
 offset=len(verts);verts.extend(tuple(v.co) for v in o.data.vertices)
 region=o['region']+'_'+('L' if o.name.endswith('.l') else 'R') if o['region']!='axial' else 'axial'
 skin_regions.extend([region_names.index(region)]*len(o.data.vertices))
 for f in o.data.polygons:
  material=o.data.materials[f.material_index] if f.material_index<len(o.data.materials) else None
  if material and material.name=='Skin-in':continue
  faces.append(tuple(offset+i for i in f.vertices))
mesh=bpy.data.meshes.new('Continuous anatomical skin');mesh.from_pydata(verts,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh);deform=bm.verts.layers.deform.verify()
for v,region in zip(bm.verts,skin_regions):v[deform][region]=1
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0006);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
skin=bpy.data.objects.new('Continuous anatomical skin',mesh);collection.objects.link(skin);skin['system']='piel';skin['anatomical_name']='Piel completa · regiones cutáneas unificadas';skin['source']='Z-Anatomy / BodyParts3D'
for name in region_names:skin.vertex_groups.new(name='region_'+name)
material=bpy.data.materials.new('Skin unified');skin.data.materials.append(material)
# Subdivision follows smooth skin weights, preserving continuous joint transitions.
for f in skin.data.polygons:f.use_smooth=True
selected=[o for o in selected if o not in skin_parts]+[skin];bpy.data.batch_remove(ids=skin_parts)
print('SKIN UNIFIED',len(skin.data.polygons),flush=True)
print('SURFACES READY',flush=True)
# Materials: preserve sub-surface distinctions (tendons, muscle, cartilage, blood vessels).
colors=COLORS
cache={}
for o in selected:
 info=dict(primary=o['system'],systems=list(o.get('systems',[o['system']])),vascular_kind=o.get('vascular_kind'))
 for i,original in enumerate(o.data.materials):
  name=original.name if original else 'Tissue';color=tissue_color(o['anatomical_name'],name,info);key=(o['system'],name,color)
  if key not in cache:
   m=bpy.data.materials.new(o['system']+'_'+name);m.use_nodes=True;m.diffuse_color=color;bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=color;bsdf.inputs['Roughness'].default_value=.46 if o['system'] in ['digestivo','urinario','respiratorio','endocrino','circulatorio'] else .62;cache[key]=m
  o.data.materials[i]=cache[key]
# Blend tissue colors continuously across tendon/muscle boundaries instead of jagged face colors.
for o in selected:
 if o['system']!='muscular' or not any(m and 'Tendon' in m.name for m in o.data.materials) or len(o.data.materials)<2:continue
 mesh=o.data;vertex_colors=[Vector((0,0,0)) for _ in mesh.vertices];counts=[0]*len(mesh.vertices)
 for f in mesh.polygons:
  m=mesh.materials[f.material_index];color=Vector(m.diffuse_color[:3])
  for i in f.vertices:vertex_colors[i]+=color;counts[i]+=1
 for i in range(len(vertex_colors)):
  if counts[i]:vertex_colors[i]/=counts[i]
 neighbors=[set() for _ in mesh.vertices]
 for edge in mesh.edges:
  a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
 for _ in range(0 if 'abdominis' in o.name.lower() else 2):
  vertex_colors=[color*.65+sum((vertex_colors[j] for j in neighbors[i]),Vector())/max(1,len(neighbors[i]))*.35 for i,color in enumerate(vertex_colors)]
 attr=mesh.color_attributes.new(name='TissueColor',type='FLOAT_COLOR',domain='POINT')
 for i,color in enumerate(vertex_colors):attr.data[i].color=(*color,1)
 m=bpy.data.materials.new('muscular_Fibras y tendón');m.use_nodes=True;node=m.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='TissueColor';m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);mesh.materials.clear();mesh.materials.append(m)
 for f in mesh.polygons:f.material_index=0
print('TISSUES SMOOTHED',flush=True)
# Straightforward deformation rig uses landmark positions in the source coordinates, in meters.
spec=[('pelvis',(0,.025,.86),(0,.02,1.0),None),('spine',(0,.02,1.0),(0,.02,1.42),'pelvis'),('neck',(0,.02,1.42),(0,.02,1.52),'spine'),('head',(0,.02,1.52),(0,.02,1.72),'neck')]
for sign,side in [(1,'L'),(-1,'R')]:
 spec.extend([(f'clavicle_{side}',(sign*.025,.015,1.40),(sign*.18,.015,1.40),'spine'),(f'upperarm_{side}',(sign*.18,.015,1.40),(sign*.232,.025,1.09),f'clavicle_{side}'),(f'forearm_{side}',(sign*.232,.025,1.09),(sign*.26,-.01,.86),f'upperarm_{side}'),(f'hand_{side}',(sign*.26,-.01,.86),(sign*.29,-.015,.69),f'forearm_{side}'),(f'thigh_{side}',(sign*.085,.025,.86),(sign*.085,.025,.43),'pelvis'),(f'shin_{side}',(sign*.085,.025,.43),(sign*.09,.035,.085),f'thigh_{side}'),(f'foot_{side}',(sign*.09,.035,.085),(sign*.09,-.11,.025),f'shin_{side}')])
# Digit joints use the actual phalanges from the reference geometry, not guessed hand cylinders.
finger_rigid={};thumb_rigid={}
for side in ['L','R']:
 suffix='.'+side.lower()
 for digit,word in enumerate(['first','second','third','fourth','fifth']):
  parts=[]
  for part in ['Proximal','Middle','Distal']:
   name=part+' phalanx of '+word+' finger of hand'+suffix
   obj=next((o for o in selected if o.name==name),None)
   if obj:parts.append(obj)
  meta=next((o for o in selected if o.name==word.capitalize()+' metacarpal bone'+suffix),None)
  if not parts or not meta:continue
  centers=[sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices) for o in [meta]+parts]
  points=[]
  for i,obj in enumerate(parts):
   direction=(centers[i+1]-centers[i]).normalized();values=[v.co.dot(direction) for v in obj.data.vertices];center=centers[i+1]
   start=center+direction*(min(values)-center.dot(direction));end=center+direction*(max(values)-center.dot(direction))
   if i==0:points.append(start)
   points.append(end)
  if digit==0:
   direction=(points[0]-centers[0]).normalized();values=[v.co.dot(direction) for v in meta.data.vertices];base=centers[0]+direction*(min(values)-centers[0].dot(direction));spec.append((f'thumb_base_{side}',base,points[0],f'hand_{side}'));thumb_rigid[meta.name]=f'thumb_base_{side}'
  for j,obj in enumerate(parts):
   key=f'finger_{digit}_{j}_{side}';parent=(f'thumb_base_{side}' if digit==0 else f'hand_{side}') if j==0 else f'finger_{digit}_{j-1}_{side}';spec.append((key,points[j],points[j+1],parent));finger_rigid[obj.name]=key
# The palm ends at the metacarpophalangeal row, not at the fingertips.
for side in ['L','R']:
 points=[Vector(a) for name,a,b,parent in spec if name.startswith('finger_') and name.endswith('_0_'+side) and not name.startswith('finger_0_')]
 if points:
  end=sum(points,Vector())/len(points);spec=[(name,a,end if name==f'hand_{side}' else b,parent) for name,a,b,parent in spec]
print('FINGER JOINTS',len(finger_rigid),flush=True)
arm=bpy.data.armatures.new('Educational pose rig');rig=bpy.data.objects.new('AnatomyRig',arm);collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,a,b,parent in spec:
 bone=arm.edit_bones.new(name);bone.head=a;bone.tail=b
 if parent:bone.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for name,a,b,parent in spec:
 direction=(Vector(b)-Vector(a)).normalized()
 if name.startswith(('finger_','thumb_base_','hand_')):
  axis=Vector((0,-1,0)).cross(direction).normalized();rig.data.bones[name]['flexion_axis']=[axis.x,axis.z,-axis.y]
segments=[(name,Vector(a),Vector(b)) for name,a,b,_ in spec]
def distance(v,a,b):
 ab=b-a;t=max(0,min(1,(v-a).dot(ab)/ab.length_squared));return (v-a-ab*t).length
rigid_terms=['bone','femur','tibia','fibula','humerus','ulna','radius','patella','rib','vertebra','sacrum','scapula','clavicle','phalange','carpal','tarsal','mandible','tooth','teeth','sternum']
for idx,o in enumerate(selected):
 region_indices={g.index:g.name.removeprefix('region_') for g in o.vertex_groups if g.name.startswith('region_')}
 groups={name:o.vertex_groups.new(name=name) for name,_,_ in segments};rigid=o['system'] in ['oseo','soporte'];center=sum((Vector(v) for v in o.bound_box),Vector())/8
 rigid_name=min(segments,key=lambda seg:distance(center,seg[1],seg[2]))[0] if rigid else None
 name=o.name.lower();side='L' if name.endswith('.l') else 'R'
 if rigid:
  if any(t in name for t in ['rib','sternum','thoracic vertebra']):rigid_name='spine'
  elif any(t in name for t in ['scapula','clavicle']):rigid_name='clavicle_'+side
  elif any(t in name for t in ['sacrum','coxal','hip bone','lumbar vertebra','coccyx']):rigid_name='pelvis'
  elif any(t in name for t in ['cervical vertebra','hyoid']):rigid_name='neck'
  elif center.z>1.5:rigid_name='head'
 if o.name in finger_rigid:rigid_name=finger_rigid[o.name]
 if o.name in thumb_rigid:rigid_name=thumb_rigid[o.name]
 if rigid:groups[rigid_name].add(list(range(len(o.data.vertices))),1,'REPLACE')
 else:
  def smooth(a,b,x):
   t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
  side='L' if name.endswith('.l') else 'R'
  axial=any(t in name for t in ['rectus abdominis','abdominal oblique','transversus abdominis','serratus anterior','serratus posterior','intercostal','multifid','spinalis thoracis','longissimus thoracis','longissimus lumborum','iliocostalis thoracis','iliocostalis lumborum','quadratus lumborum','diaphragm'])
  pectoral='pectoralis major' in name;latissimus='latissimus' in name;deltoid='deltoid muscle' in name
  girdle=any(t in name for t in ['trapezius','rhomboid major','rhomboid minor','levator scapulae']);cuff=any(t in name for t in ['supraspinatus','infraspinatus','subscapularis','teres major','teres minor']);pector_minor='pectoralis minor' in name
  for v in o.data.vertices:
   if o['system'] in ['piel','fascias']:
    region=max(((g.weight,region_indices[g.group]) for g in v.groups if g.group in region_indices),default=(1,o.get('region','axial')+'_'+side if o.get('region') in ['upper','lower'] else 'axial'))[1]
    if any(t in name for t in ['nail','perionyx']):region=('lower_' if '(foot)' in name else 'upper_')+side
    for key,w in surface_weights(v.co,region,segments).items():groups[key].add([v.index],w,'REPLACE')
    continue
   if axial or pectoral or latissimus or deltoid or girdle or cuff or pector_minor or (o['system']=='piel' and abs(v.co.x)<.145 and .91<v.co.z<1.43):
    z=v.co.z;x=abs(v.co.x)
    w_spine=smooth(.94,1.12,z);weights={'spine':w_spine,'pelvis':1-w_spine}
    if pectoral or latissimus:
     insertion=smooth(.115,.18,x)*smooth(1.21,1.35,z)
     weights={k:w*(1-insertion) for k,w in weights.items()};weights['upperarm_'+side]=insertion
     if pectoral and 'clavicular' in name:weights={'clavicle_'+side:1-insertion,'upperarm_'+side:insertion}
    elif deltoid:
     insertion=1-smooth(1.24,1.40,z);weights={'clavicle_'+side:1-insertion,'upperarm_'+side:insertion}
    if 'serratus anterior' in name or pector_minor:
     insertion=smooth(.015,.075,v.co.y)*(1-smooth(.08,.17,x)) if not pector_minor else smooth(1.24,1.38,z)*smooth(.065,.14,x)
     weights={k:w*(1-insertion) for k,w in weights.items()};weights['clavicle_'+side]=insertion
    elif girdle:
     insertion=smooth(.025,.13,x);neck_weight=smooth(1.38,1.52,z);weights={'spine':(1-insertion)*(1-neck_weight),'neck':(1-insertion)*neck_weight,'clavicle_'+side:insertion}
    elif cuff:
     insertion=smooth(.125,.2,x);weights={'clavicle_'+side:1-insertion,'upperarm_'+side:insertion}
    for key,w in weights.items():
     if w>0:groups[key].add([v.index],w,'REPLACE')
    continue
   in_hand=.63<v.co.z<.885 and abs(v.co.x)>.18
   candidates=[seg for seg in segments if (not seg[0].startswith('finger_') or in_hand) and (not in_hand or seg[0].endswith('_'+('L' if v.co.x>0 else 'R')))]
   if o['system'] in ['muscular','fascias','circulatorio','nervioso'] and o.get('region')=='upper':candidates=[seg for seg in candidates if seg[0].endswith('_'+side) and any(seg[0].startswith(t) for t in ['clavicle','upperarm','forearm','hand','finger'])]
   elif o['system'] in ['muscular','fascias','circulatorio','nervioso'] and o.get('region')=='lower':candidates=[seg for seg in candidates if seg[0]=='pelvis' or (seg[0].endswith('_'+side) and any(seg[0].startswith(t) for t in ['thigh','shin','foot']))]
   if o['system'] in ['digestivo','respiratorio','urinario','endocrino','reproductor','linfatico','circulatorio','nervioso'] and o.get('region')=='axial':
    allowed=['spine','pelvis']+(['neck','head'] if v.co.z>1.37 else [])
    candidates=[seg for seg in candidates if seg[0] in allowed or (v.co.z>1.28 and abs(v.co.x)>.07 and o['system'] in ['circulatorio','nervioso'] and seg[0].startswith('clavicle_'))]
   ds=sorted(((distance(v.co,a,b),key) for key,a,b in candidates),key=lambda x:x[0])[:4]
   w=[1/max(.012,d)**4 for d,_ in ds];total=sum(w)
   for (_,key),weight in zip(ds,w):groups[key].add([v.index],weight/total,'REPLACE')
 if o['system']=='fascias' or o==skin:smooth_surface_weights(o,groups)
 if o==skin:
  bpy.context.view_layer.objects.active=o;o.select_set(True);sub=o.modifiers.new('Continuous skin surface smoothing','SUBSURF');sub.levels=2;sub.render_levels=2;bpy.ops.object.modifier_apply(modifier=sub.name);o.select_set(False)
 mod=o.modifiers.new('Educational animation skin','ARMATURE');mod.object=rig;o.parent=rig
 if idx%150==0:print('WEIGHTED',idx,flush=True)
# Nodes keep anatomical names and system metadata for selection and layer isolation.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in selected:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out/'anatomia.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_apply=False,export_yup=True,export_skins=True,export_normals=True,export_texcoords=False,export_cameras=False,export_lights=False)
stats=dict(structures=len(selected),polygons=sum(len(o.data.polygons) for o in selected),vertices=sum(len(o.data.vertices) for o in selected),systems={s:sum(o['system']==s for o in selected) for s in colors},bytes=(out/'anatomia.glb').stat().st_size,rig_revision='regional-height-constrained-surfaces-v4',finger_joints=len(finger_rigid),curve_surfaces=len(new_curves),conversion_omissions=conversion_omissions,source_commit='d14fa54355a3b484cefd08c33f6e18526d9aea85')
stats['layers']={system:dict(structures=sum(system in list(o.get('systems',[o['system']])) for o in selected),curve_surfaces=sum(system in list(o.get('systems',[o['system']])) and o.get('source_type')=='CURVE' for o in selected),named_structures=sorted(o['anatomical_name'] for o in selected if system in list(o.get('systems',[o['system']])))) for system in COLORS}
stats['reference_parts']=[dict(id=o['source_id'],name=o['anatomical_name'],source=o['source']) for o in reference_parts]
stats['vascular_counts']={kind:sum(o.get('vascular_kind')==kind for o in selected) for kind in ['artery','vein','pulmonary_artery','pulmonary_vein','heart','valve']}
(out/'manifest.json').write_text(json.dumps(stats,indent=2));print('EXPORT',json.dumps(stats),flush=True)
