"""Pesos por región de superficie: evita conexiones por mera proximidad mano/cadera.
Las coordenadas de referencia usan Blender Z vertical. Dos articulaciones contiguas
por vértice; las superficies de piel y fascias comparten el mismo criterio.
"""
from math import sqrt

def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def distance(p,a,b):
 d=[b[i]-a[i] for i in range(3)];t=max(0,min(1,sum((p[i]-a[i])*d[i] for i in range(3))/max(1e-12,sum(v*v for v in d))))
 return sqrt(sum((p[i]-a[i]-t*d[i])**2 for i in range(3)))
def surface_weights(p,region,segments):
 seg={name:(a,b) for name,a,b in segments};z=p[2];side=region[-1] if region.startswith(('upper_','lower_')) else ('L' if p[0]>0 else 'R')
 def nearest(keys):
  ds=sorted((distance(p,*seg[k]),k) for k in keys if k in seg)[:2];ws=[1/max(.009,d)**4 for d,k in ds];total=sum(ws)
  return {k:w/total for (d,k),w in zip(ds,ws)}
 if region.startswith('lower_'):
  keys=[f'{part}_{side}' for part in ['thigh','shin','foot']]
  if z>seg['thigh_'+side][0][2]-.12:keys.append('pelvis')
  return nearest(keys)
 shoulder=seg['upperarm_'+side][0];elbow=seg['upperarm_'+side][1]
 if region.startswith('upper_'):
  keys=[f'{part}_{side}' for part in ['upperarm','forearm','hand']]
  fingers=[k for k in seg if k.startswith('finger_') and k.endswith('_'+side)]
  # A digit can blend with its own adjacent joints and the palm, never a neighbouring digit.
  if fingers and z<seg['hand_'+side][0][2]-.015:
   closest=min(fingers,key=lambda k:distance(p,*seg[k]));digit=closest.split('_')[1]
   if distance(p,*seg[closest])<distance(p,*seg['hand_'+side]):keys=['hand_'+side]+[k for k in fingers if k.split('_')[1]==digit]+([f'thumb_base_{side}'] if digit=='0' and f'thumb_base_{side}' in seg else [])
  weights=nearest(keys)
  if z>elbow[2]+.1:
   arm=smooth(abs(shoulder[0])-.075,abs(shoulder[0])+.035,abs(p[0]));clav=smooth(shoulder[2]-.09,shoulder[2]+.015,z)*.4
   weights={'spine':1-arm,'clavicle_'+side:arm*clav,'upperarm_'+side:arm*(1-clav)}
  return weights
 pelvis=seg['pelvis'][0];neck=seg['neck'];head=seg['head']
 w=smooth(pelvis[2]+.04,seg['spine'][0][2]+.12,z);weights={'pelvis':1-w,'spine':w}
 if z>neck[0][2]-.05:
  n=smooth(neck[0][2]-.05,neck[1][2],z);h=smooth(head[0][2]-.015,head[0][2]+.07,z)
  weights={'spine':1-n,'neck':n*(1-h),'head':n*h}
 # Blend the axillary seam continuously into the shoulder, while the abdomen stays axial.
 a=smooth(abs(shoulder[0])-.075,abs(shoulder[0])+.035,abs(p[0]))*smooth(shoulder[2]-.11,shoulder[2]-.025,z)*(1-smooth(shoulder[2]+.02,shoulder[2]+.12,z))
 if a:
  weights={k:v*(1-a) for k,v in weights.items()};weights['clavicle_'+side]=a*.4;weights['upperarm_'+side]=a*.6
 return {k:v for k,v in weights.items() if v>1e-8}

def smooth_surface_weights(obj,groups,iterations=16):
 """Suaviza pesos por conectividad antes de subdividir; no aproxima superficies cercanas.
 La conectividad mantiene separados dedos, brazos y muslos que se rozan en reposo.
 """
 names={g.index:name for name,g in groups.items()};neighbors=[set() for v in obj.data.vertices]
 for edge in obj.data.edges:
  a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
 weights=[{names[g.group]:g.weight for g in v.groups if g.group in names and g.weight>1e-8} for v in obj.data.vertices]
 for _ in range(iterations):
  result=[]
  for i,own in enumerate(weights):
   adjacent=neighbors[i]
   if not adjacent:result.append(own);continue
   new={k:w*.5 for k,w in own.items()};factor=.5/len(adjacent)
   for j in adjacent:
    for k,w in weights[j].items():new[k]=new.get(k,0)+w*factor
   top=sorted(new.items(),key=lambda pair:pair[1],reverse=True)[:4];total=sum(w for k,w in top);result.append({k:w/total for k,w in top})
  weights=result
 for group in groups.values():group.remove(list(range(len(obj.data.vertices))))
 for i,values in enumerate(weights):
  for key,w in values.items():groups[key].add([i],w,'REPLACE')
