(function(){
/* Instagram row: loads the live @sweethomechicagoland feed (refreshed every 3 hours)
   and plays Reels in an on-page pop-up. If the feed can't load, the saved reels stay. */
var row=document.getElementById('shig-row'); if(!row) return;
var prev=document.getElementById('shig-prev'), next=document.getElementById('shig-next');
function step(){var c=row.querySelector('.shig-card');return c?(c.getBoundingClientRect().width+16):300;}
if(prev) prev.addEventListener('click',function(){row.scrollBy({left:-step(),behavior:'smooth'});});
if(next) next.addEventListener('click',function(){row.scrollBy({left:step(),behavior:'smooth'});});
var COUNT=8, SRC='https://chrisgrano.github.io/shcl-social-feed/widget.js';
function fmt(n){if(n==null)return '';if(n<10000)return n.toLocaleString('en-US');if(n<100000)return (Math.round(n/100)/10+'').replace(/\.0$/,'')+'K';if(n<1000000)return Math.round(n/1000)+'K';return (Math.round(n/100000)/10+'').replace(/\.0$/,'')+'M';}
function build(){
  var F=window.SHCLFeed; if(!F) return;
  F.load().then(function(feed){
    var items=(feed.items||[]).filter(function(p){return p.type==='reel';}).slice(0,COUNT);
    if(!items.length) return;
    var tpl=row.querySelector('.shig-card'); if(!tpl) return;
    var frag=document.createDocumentFragment();
    items.forEach(function(p,i){
      var a=tpl.cloneNode(true);
      a.href=p.permalink; a.target='_blank'; a.rel='noopener';
      a.style.backgroundImage='url("'+F.base+p.image+'")';
      a.setAttribute('aria-label',(p.caption||'Instagram reel').slice(0,100));
      var v=a.querySelector('.shig-views');
      if(v) v.textContent=p.views!=null?fmt(p.views)+' views':(p.likes!=null?fmt(p.likes)+' likes':'');
      a.addEventListener('click',function(e){
        if(e.metaKey||e.ctrlKey||e.shiftKey||e.button===1) return;
        e.preventDefault(); F.open(feed,items,i);
      });
      frag.appendChild(a);
    });
    row.innerHTML=''; row.appendChild(frag); row.scrollLeft=0;
  }).catch(function(){});
}
if(window.SHCLFeed) build();
else{
  document.addEventListener('shclfeed:ready',build,{once:true});
  if(!document.querySelector('script[src="'+SRC+'"]')){var s=document.createElement('script');s.src=SRC;s.async=true;document.head.appendChild(s);}
}
})();
