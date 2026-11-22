/* Fuente contextual común a todos los módulos. Nunca se inserta HTML del contenido. */
(function(){
  function open(text, trigger){
    const dialog=document.createElement('dialog');dialog.className='fuente-dialog';
    const heading=document.createElement('h2');heading.textContent='Fuente del contenido';
    const content=document.createElement('p');content.textContent=text;
    const close=document.createElement('button');close.type='button';close.textContent='Cerrar';close.className='cerrar-fuente';close.onclick=()=>dialog.close();
    dialog.append(heading,content,close);document.body.append(dialog);
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{dialog.remove();if(trigger?.isConnected)trigger.focus({preventScroll:true});},{once:true});dialog.showModal();close.focus({preventScroll:true});
  }
  window.AtlasSource={open,create(text){const b=document.createElement('button');b.type='button';b.className='fuente-info';b.textContent='i';b.setAttribute('aria-label','Ver fuente');b.title='Ver fuente';b.addEventListener('click',()=>open(text,b));return b;}};
})();
