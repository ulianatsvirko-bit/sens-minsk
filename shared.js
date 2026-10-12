(() => {
const menu=document.querySelector('.sens-menu');
if(menu){
 const wide=matchMedia('(min-width:64rem)');
 const sync=()=>{menu.open=wide.matches};sync();wide.addEventListener('change',sync);
 menu.addEventListener('click',event=>{if(event.target.closest('a')&&!wide.matches)menu.open=false});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!wide.matches&&menu.open){menu.open=false;menu.querySelector('summary').focus()}});
 document.addEventListener('click',event=>{if(!wide.matches&&!menu.contains(event.target))menu.open=false});
 menu.addEventListener('toggle',()=>menu.querySelector('summary').setAttribute('aria-label',menu.open?'Закрыть навигацию':'Открыть навигацию'));
 const current=location.pathname.split('/').pop()||'index.html';
 const links=[...menu.querySelectorAll('a')];
 const currentLink=links.find(link=>{
  const target=new URL(link.href,location.href);
  const targetPage=target.pathname.split('/').pop()||'index.html';
  return targetPage===current&&!target.hash;
 })||links.find(link=>{
  const target=new URL(link.href,location.href);
  return (target.pathname.split('/').pop()||'index.html')===current;
 });
 if(currentLink)currentLink.setAttribute('aria-current','page');
}

const pageProgress=document.querySelector('[data-sens-progress]');
if(pageProgress){
 let framePending=false;
 const updateProgress=()=>{
  const distance=document.documentElement.scrollHeight-window.innerHeight;
  const ratio=distance>0?Math.min(1,Math.max(0,window.scrollY/distance)):0;
  pageProgress.style.transform=`scaleX(${ratio})`;framePending=false;
 };
 const queueProgress=()=>{if(!framePending){framePending=true;requestAnimationFrame(updateProgress)}};
 window.addEventListener('scroll',queueProgress,{passive:true});
 window.addEventListener('resize',queueProgress);
 window.addEventListener('pageshow',queueProgress);
 new ResizeObserver(queueProgress).observe(document.body);
 updateProgress();
}

})();
