"""Valida el banco fuente y prepara los datos sin dependencias de servidor."""
import json
from pathlib import Path
r=Path(__file__).resolve().parent.parent
b=json.loads((r/'src/data/banco_contenidos.json').read_text());cs=b['concepts'];qs=b['questions'];assert len({q['id'] for q in qs})==len(qs)
for i,q in enumerate(qs):
 if q['type']=='choice':
  if i<78:
   c=cs[i//2];q['concept']=c['id'];q['extension']=not c['mandatory_en'] if q['section']=='ingles' else False
   if q['section']=='ingles':pool=[x['en'] for x in cs if x['type']==c['type']]
   elif q['section']=='esqueleto':pool=['cabeza','tronco','extremidades superiores','extremidades inferiores','extremidades']
   else:pool=[x['function'] for x in cs if x['type']=='musculo']
   q['options']=[q['answer']]+list(dict.fromkeys(x for x in pool if x!=q['answer']))[:3]
  assert len(set(q['options']))==len(q['options']) and q['answer'] in q['options']
 if q['id']=='q083':q['explanation']+=' Es la clasificación simplificada del libro; en anatomía las vértebras suelen considerarse huesos irregulares.'
 if q['type']=='posture':
  distractors={'q127':['Sentarse sin apoyar la espalda','Mantenerse encorvado','Girar el tronco mientras se escribe'],'q128':['Usar solo un tirante','Llevarla muy baja y suelta','Cargar todo el peso en un hombro'],'q129':['Alejar la carga del cuerpo','Doblar solo la espalda','Girar bruscamente con la carga'],'q130':['Doblar solo la espalda','Mantener rígidas las rodillas y encorvarse','Tirar de la ropa con el tronco girado']}
  q['options']=[q['answer']]+distractors[q['id']];q['type']='choice'
for c in cs:
 q=dict(id='en_'+c['id'],section='ingles',type='choice',prompt='What is the Spanish word for “'+c['en']+'”?',answer=c['es'],options=[c['es']]+[x['es'] for x in cs if x['type']==c['type'] and x['id']!=c['id']][:3],explanation=c['en']+' = '+c['es']+'.',source=c['source'],language='en',level='basico',extension=not c['mandatory_en'],concept=c['id']);qs.append(q)
# Respuestas contrastadas para práctica de movimiento y salud; las abiertas originales se conservan.
extra=[('movimiento','Al flexionar el codo, ¿qué sucede?','El bíceps se contrae y el tríceps se relaja',['Ambos músculos se relajan','El tríceps se contrae y el bíceps se relaja','Los huesos se contraen'],'Los músculos antagonistas realizan movimientos opuestos.','p50'),('movimiento','¿Qué une muchos músculos a los huesos?','Los tendones',['Los ligamentos','El cartílago articular','Los nervios sensitivos'],'Los tendones transmiten la fuerza del músculo al hueso.','p48-50'),('reflejos','¿Qué coordina muchos movimientos reflejos?','La médula espinal',['El esternón','Los ligamentos','El fémur'],'Muchos reflejos se coordinan en la médula espinal; la información también llega al cerebro.','p51'),('reflejos','¿Qué movimiento es voluntario?','Lanzar una pelota hacia una canasta',['Retirar la mano del calor por reflejo','La respuesta al golpe del tendón rotuliano','Retirar el pie al pisar algo doloroso por reflejo'],'En el movimiento voluntario el cerebro interpreta la información y decide la acción.','p50-51'),('salud','¿Qué es una fractura?','La rotura de un hueso',['Una lesión de un ligamento','Una contracción muscular mantenida','La unión de dos huesos'],'Una fractura puede partir o astillar un hueso.','p52'),('salud','¿Qué es un esguince?','Una lesión de ligamentos',['La rotura de un hueso','La contracción mantenida de un músculo','Una articulación fija'],'Una torcedura puede estirar excesivamente o romper ligamentos.','p52'),('salud','¿Qué ayuda a absorber el calcio?','La vitamina D',['Un ligamento','El cartílago','La contracción muscular'],'La vitamina D ayuda al organismo a absorber y aprovechar el calcio.','p52')]
for i,(section,prompt,answer,opts,explanation,source) in enumerate(extra):qs.append(dict(id='extra'+str(i),section=section,type='choice',prompt=prompt,answer=answer,options=[answer]+opts,explanation=explanation,source=source,language='es',level='basico'))
regions=[('esqueleto_frontal','esqueleto',[('craneo',50,5),('esternon',50,22),('costillas',59,25),('pelvis',59,41),('humero',33,27),('femur',40,56),('rotula',41,66),('tibia',42,78)]),('musculatura_frontal','musculos',[('masetero',54,9),('pectoral',42,22),('abdominal',47,32),('deltoides',34,20),('biceps',32,29),('cuadriceps',41,55)])]
rs=[]
for image,section,points in regions:
 for target,x,y in points:
  c=next(c for c in cs if c['visual_target']==target);rs.append(dict(id=c['id'],imagen=image,section=section,x=x,y=y,revision='Posición del marcador comprobada visualmente en la lámina original. No delimita el órgano.'))
(r/'src/data/regiones-anatomicas.json').write_text(json.dumps(rs,ensure_ascii=False,indent=2)+'\n')
images=json.loads((r/'src/data/imagenes.json').read_text())
for m in images:
 if m['id'] in ['esqueleto_frontal','musculatura_frontal']:m['estado_qa']='aprobada';m['usos']=['estudio','identificacion'];m['nota']='Aprobación didáctica limitada a los marcadores revisados; no certificación anatómica completa.'
 elif m['id'] in ['reflejo_rotuliano','reflejo_retirada_mano']:m['nota']='Circuito nervioso esquemático pendiente de revisión. Excluida de preguntas visuales y del estudio principal.'
 else:m['nota']='Correspondencia visual comprobada; revisión anatómica detallada pendiente. Solo ilustración de estudio.'
(r/'src/data/imagenes.json').write_text(json.dumps(images,ensure_ascii=False,indent=2)+'\n')
(r/'js/locomotor-datos.js').write_text('window.LOCOMOTOR='+json.dumps(dict(bank=b,images=images,regions=rs),ensure_ascii=False,separators=(',',':'))+';\n')
print(len(cs),'conceptos;',len(qs),'actividades;',len(images),'imágenes;',len(rs),'marcadores revisados')
