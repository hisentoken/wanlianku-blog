const $ = selector => document.querySelector(selector);
const dialog=$('.search-dialog');
if($('.search-open kbd'))$('.search-open kbd').textContent=/Mac/.test(navigator.platform)?'⌘ K':'Ctrl K';
let searchIndex;
let searchTimer;
let previousFocus;
async function openSearch() {
  previousFocus=document.activeElement;
  dialog.showModal();
  $('#global-search').focus();
  if (!searchIndex) {
    try { const response=await fetch(new URL('search-index.json',document.currentScript?.src||document.querySelector('script[src$="site.js"]').src).href.replace('/js/search-index.json','/search-index.json')); if(!response.ok) throw Error(); searchIndex=await response.json(); runSearch(); }
    catch { $('#search-status').textContent='搜索暂时不可用，请从“所有文章”按专题浏览。'; }
  }
}
function closeSearch(){dialog.close();previousFocus?.focus();}
$('.search-open')?.addEventListener('click',openSearch);
$('.search-close')?.addEventListener('click',closeSearch);
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeSearch();}});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)openSearch();}});
const normalize=text=>text.toLocaleLowerCase().trim();
function runSearch(){
  if(!searchIndex)return;
  const query=normalize($('#global-search').value);
  const terms=query.split(/\s+/).filter(Boolean);
  const results=terms.length?searchIndex.filter(p=>terms.every(term=>normalize(`${p.title} ${p.description} ${p.tags.join(' ')} ${p.text||''}`).includes(term))):[];
  const box=$('#search-results');box.replaceChildren();
  $('#search-status').textContent=query?`找到 ${results.length} 篇文章${results.length>30?'，显示前 30 篇':''}`:`输入关键词，搜索全部 ${searchIndex.length} 篇文章`;
  for(const p of results.slice(0,30)){const a=document.createElement('a');a.href=p.url;a.className='search-result';const meta=document.createElement('span');meta.className='meta';meta.textContent=`${p.topic} · ${p.date}`;const title=document.createElement('h3');title.textContent=p.title;const desc=document.createElement('p');desc.textContent=p.description;a.append(meta,title,desc);box.append(a);}
  if(query&&!results.length){const p=document.createElement('p');p.className='search-no-results';p.textContent='没有匹配的文章，试试更短的关键词。';box.append(p);}
}
$('#global-search')?.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,100);});
const grid=$('#archive-grid');
if(grid){
  const cards=[...grid.querySelectorAll('.post-card')];let currentPage=1;const pageSize=12;
  const input=$('#archive-search'),sort=$('#archive-sort');
  input.value=new URLSearchParams(location.search).get('q')||'';
  function render(scroll=false){
    const terms=normalize(input.value).split(/\s+/).filter(Boolean);
    const matches=cards.filter(c=>terms.every(t=>normalize(c.dataset.search).includes(t))).sort((a,b)=>sort.value==='newest'?b.dataset.date.localeCompare(a.dataset.date):a.dataset.date.localeCompare(b.dataset.date));
    const pages=Math.ceil(matches.length/pageSize);currentPage=Math.max(1,Math.min(currentPage,pages||1));
    cards.forEach(c=>c.hidden=true);
    matches.forEach(c=>grid.append(c));matches.slice((currentPage-1)*pageSize,currentPage*pageSize).forEach(c=>c.hidden=false);
    $('#archive-empty').hidden=matches.length>0;
    $('#archive-status').textContent=`${input.value?'找到':'共'} ${matches.length} 篇文章${pages?` · 第 ${currentPage} / ${pages} 页`:''}`;
    const pagination=$('#pagination');pagination.replaceChildren();
    if(pages>1)for(let n=0;n<=pages+1;n++){
      const button=document.createElement('button');button.type='button';button.textContent=n===0?'← 上一页':n===pages+1?'下一页 →':String(n);
      const target=n===0?currentPage-1:n===pages+1?currentPage+1:n;
      button.disabled=target<1||target>pages;
      if(n===currentPage)button.setAttribute('aria-current','page');
      button.setAttribute('aria-label',n===0?'上一页':n===pages+1?'下一页':`第 ${n} 页`);
      button.addEventListener('click',()=>{currentPage=target;render(true);});pagination.append(button);
    }
    if(scroll)$('#archive-status').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  input.addEventListener('input',()=>{currentPage=1;render();});sort.addEventListener('change',()=>{currentPage=1;render();});$('#archive-reset').addEventListener('click',()=>{input.value='';currentPage=1;render();input.focus();});render();
}
const progress=$('.reading-progress');
const topButton=$('.back-top');
function updateScroll(){const span=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${span?Math.min(100,scrollY/span*100):0}%`;topButton.classList.toggle('is-visible',scrollY>600);}
addEventListener('scroll',updateScroll,{passive:true});updateScroll();
topButton?.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
const tocLinks=[...document.querySelectorAll('.toc a')];
if(tocLinks.length){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){tocLinks.forEach(a=>{const active=a.hash==='#'+entry.target.id;a.classList.toggle('is-active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-90px 0px -60% 0px'});tocLinks.forEach(a=>{const heading=document.getElementById(a.hash.slice(1));if(heading)observer.observe(heading);});}
$('#copy-link')?.addEventListener('click',async()=>{const button=$('#copy-link');try{await navigator.clipboard.writeText(location.href.split('#')[0]);button.textContent='已复制';$('#copy-status').textContent='文章链接已复制';setTimeout(()=>button.textContent='复制链接',2000);}catch{button.textContent='请复制地址栏';$('#copy-status').textContent='请从浏览器地址栏复制当前文章链接';}});
