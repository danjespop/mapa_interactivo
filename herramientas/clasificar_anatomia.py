"""Taxonomía y paleta macroscópica del atlas, sin dependencias de Blender.
Los colores vasculares y linfáticos son convenciones docentes, no color real de la sangre.
"""
ROOTS={'1: Skeletal system':'oseo','3: Joints':'soporte','4: Muscular system':'muscular','5: Cardiovascular system':'circulatorio','6: Lymphoid organs':'linfatico','7: Nervous system & Sense organs':'nervioso','8: Visceral systems':'digestivo','9: Regions of human body':'piel'}
def classify(name,collections,materials):
 n=name.lower();cs=set(collections);m=' '.join(materials).lower();primary=next((v for k,v in ROOTS.items() if k in cs),None)
 if primary is None:return None
 memberships={primary};vascular=None
 if primary=='circulatorio':
  vascular='pulmonary_artery' if 'pulmonary artery' in m or 'Pulmonary arteries' in cs else 'pulmonary_vein' if 'pulmonary vein' in m or 'Pulmonary veins' in cs else 'artery' if 'artery' in m else 'vein' if 'vein' in m else 'valve' if any(t in n for t in ['leaflet','valve','chordae']) else 'heart'
 if primary=='digestivo':
  if 'Respiratory system' in cs or any(t in n for t in ['lung','trachea','bronch','nasopharynx','nasal cavity','epiglottis']):primary='respiratorio'
  elif 'Urinary system' in cs or any(t in n for t in ['kidney','renal pelvis','urinary bladder','ureter','urethra']):primary='urinario'
  elif any(t in n for t in ['parathyroid gland','thyroid gland','hypophysis','pineal gland','suprarenal gland']):primary='endocrino'
  elif 'Male genital system' in cs or any(t in n for t in ['penis','testis','epididymis','prostate','seminal gland','ductus deferens','ejaculatory duct','cavernosum','spongiosum']):primary='reproductor'
  memberships={primary}
  if any(t in n for t in ['oropharynx','laryngopharynx']):memberships.update(['digestivo','respiratorio'])
  if n=='pancreas' or n.startswith('pancreas.'):memberships.update(['digestivo','endocrino']);primary='digestivo'
  if 'pancreatic duct' in n:memberships={'digestivo'};primary='digestivo'
  if 'testis' in n:memberships.add('endocrino')
 if primary=='nervioso' and any(t in n for t in ['hypothalam','hypophysis','pituitary','pineal gland']):memberships.add('endocrino')
 if primary=='oseo' and any(t in n for t in ['tooth','teeth']):memberships.add('digestivo')
 if primary in ['soporte','oseo'] and any(t in n for t in ['thyroid cartilage','cricoid cartilage','arytenoid cartilage','corniculate cartilage','cuneiform cartilage','epiglottic cartilage']):memberships.add('respiratorio')
 if primary=='muscular' and 'fascia' in m:primary='fascias';memberships={'fascias'}
 if 'bursa' in n or 'fat pad' in n:primary='soporte';memberships={'soporte'}
 if primary=='linfatico' and any(t in n for t in ['spleen','thymus','tonsil']):vascular=None
 return dict(primary=primary,systems=sorted(memberships|{primary}),vascular_kind=vascular)
COLORS={'oseo':(.82,.73,.53,1),'soporte':(.66,.72,.71,1),'fascias':(.79,.75,.63,1),'muscular':(.48,.105,.09,1),'circulatorio':(.34,.055,.045,1),'nervioso':(.78,.66,.35,1),'linfatico':(.57,.56,.34,1),'digestivo':(.64,.31,.27,1),'respiratorio':(.50,.30,.33,1),'urinario':(.57,.27,.23,1),'endocrino':(.59,.30,.22,1),'reproductor':(.54,.29,.31,1),'piel':(.48,.265,.135,1)}
def tissue_color(name,material,info):
 n=name.lower();m=material.lower();primary=info['primary'];kind=info.get('vascular_kind');color=COLORS[primary]
 if primary=='circulatorio':
  if kind in ['artery','pulmonary_vein']:return (.66,.018,.026,1)
  if kind in ['vein','pulmonary_artery']:return (.025,.11,.40,1)
  if kind=='valve':return (.78,.73,.59,1)
  return color
 if primary=='nervioso':
  if 'retina' in n:return (.66,.28,.18,1)
  if any(t in n for t in ['falx cerebri','tentorium cerebelli','spinal dura','zonular fibres']):return (.79,.75,.63,1)
  if 'choroid plexus' in n:return (.50,.11,.10,1)
  if m=='lcr':return (.52,.72,.80,1) # Cavidad de LCR: convención de atlas.
  if any(t in n for t in ['anterior horn of spinal cord','posterior horn of spinal cord','gray matter']):return (.58,.43,.38,1)
  if 'white matter' in m or any(t in n for t in ['white matter','corpus callosum','commissure','corticospinal tract','spinothalamic tract','spinocerebellar tract','fasciculus']):return (.80,.75,.60,1)
  if any(t in m for t in ['brain','lobe','cerebell','nucleus','interlobar sulci','insula']) or any(t in n for t in ['gyrus','cerebell','pons','medulla oblongata']):return (.58,.43,.38,1)
  if ('cochlea' in n or 'vestibule' in n) and 'bone' in m:return COLORS['oseo']
 if primary=='endocrino' and 'parathyroid' in n:return (.65,.43,.23,1)
 if 'black'==m or 'hair' in n:return (.045,.022,.012,1)
 if 'tendon' in m or 'fascia' in m:return (.79,.75,.63,1)
 if 'ligament' in m:return (.78,.74,.63,1)
 if 'cornea' in m:return (.95,.95,.95,1)
 if 'lacrimal gland' in n:return (.63,.36,.3,1)
 if 'cartilage' in m:return (.64,.73,.75,1)
 if 'sclera' in n or m=='eye':return (.89,.90,.86,1)
 if 'iris' in m:return (.16,.075,.025,1)
 if 'pupil' in m:return (.006,.004,.003,1)
 if primary=='digestivo':
  if 'liver' in n:return (.29,.055,.040,1)
  if 'gallbladder' in n or 'bile duct' in n or 'hepatic duct' in n or 'cystic duct' in n:return (.24,.31,.10,1)
  if 'pancrea' in n:return (.69,.47,.24,1)
  if 'tooth' in n or 'teeth' in n:return (.87,.82,.65,1)
  if 'tongue' in n or 'gingiva' in n:return (.63,.23,.22,1)
 if primary=='urinario':
  if 'kidney' in n:return (.30,.065,.05,1)
  if 'ureter' in n or 'urethra' in n:return (.72,.52,.41,1)
 if primary=='linfatico':
  if 'spleen' in n:return (.25,.035,.065,1)
  if 'thymus' in n or 'tonsil' in n:return (.60,.31,.30,1)
  if 'duct' in n or 'lymphatic vessel' in n:return (.11,.40,.25,1)
 if primary=='endocrino':
  if 'thyroid' in n:return (.42,.11,.085,1)
  if 'suprarenal' in n:return (.68,.48,.22,1)
  if 'pancrea' in n:return (.69,.47,.24,1)
 if primary=='respiratorio' and any(t in n for t in ['trachea','bronch','cartilage']):return (.67,.72,.68,1)
 return color
