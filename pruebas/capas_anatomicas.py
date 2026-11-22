"""Evita perder órganos compartidos o confundir materiales heredados de la fuente."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'herramientas'))
from clasificar_anatomia import classify,tissue_color
class Capas(unittest.TestCase):
 def test_compartidos(self):
  pancreas=classify('Pancreas',['8: Visceral systems'],['Gland'])
  self.assertEqual(set(pancreas['systems']),{'digestivo','endocrino'})
  self.assertEqual(classify('Pancreatic duct',['8: Visceral systems'],['Gland'])['systems'],['digestivo'])
  self.assertEqual(set(classify('Oropharynx',['8: Visceral systems'],['Mucosa'])['systems']),{'digestivo','respiratorio'})
  self.assertIn('respiratorio',classify('Thyroid cartilage',['1: Skeletal system'],['Cartilage'])['systems'])
 def test_pulmonar(self):
  for material in ['Artery','Vein','Pulmonary artery','Pulmonary vein']:
   info=classify('Vessel',['5: Cardiovascular system'],[material]);color=tissue_color('Vessel',material,info)
   self.assertEqual(color[0]>color[2],material in ['Artery','Pulmonary vein'])
 def test_tejidos(self):
  nerve=dict(primary='nervioso');endocrine=dict(primary='endocrino');heart=dict(primary='circulatorio',vascular_kind='heart')
  white=tissue_color('Anterior commissure','White matter',nerve)
  gray=tissue_color('Anterior horn of spinal cord','Brain-Inner',nerve)
  self.assertNotEqual(white,gray)
  self.assertEqual(gray,tissue_color('Sulcus','Interlobar sulci',nerve))
  self.assertNotEqual(tissue_color('Retina.l','Iris',nerve),tissue_color('Iris.l','Iris',nerve))
  self.assertNotEqual(tissue_color('Thyroid gland','Gland',endocrine),tissue_color('Inferior parathyroid gland.l','Gland',endocrine))
  self.assertGreater(tissue_color('Left ventricle','Trapezius',heart)[0],tissue_color('Left ventricle','Trapezius',heart)[2])
 def test_fascias_soporte(self):
  self.assertEqual(classify('Envelope',['4: Muscular system'],['Fascia'])['primary'],'fascias')
  self.assertEqual(classify('Ligament',['3: Joints'],['Ligament'])['primary'],'soporte')
if __name__=='__main__':unittest.main()
