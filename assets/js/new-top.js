/* 新しいトップの動き（2026-11・見本ブランチ）。入場演出・ふわっと出る・コンセプト写真のゆるい寄り。 */
(function(){
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('nt-js');

  /* 入場演出：その訪問で1回だけ（?intro=1 で何度でも見られる）。画面を押すとすぐ消える */
  var intro = document.getElementById('nt-intro'), seen = false, force = /[?&]intro=1/.test(location.search);
  try{ seen = sessionStorage.getItem('ntIntro') === '1'; }catch(e){}
  function end(){ root.classList.remove('nt-intro-on','nt-intro-out'); }
  if(intro && !calm && (force || !seen)){
    root.classList.add('nt-intro-on');
    try{ sessionStorage.setItem('ntIntro','1'); }catch(e){}
    setTimeout(function(){ root.classList.add('nt-intro-out'); }, 1950);
    setTimeout(end, 2800);
    intro.addEventListener('click', end);
    if(typeof gtag !== 'undefined'){ try{ gtag('event','nt_intro_view',{event_category:'new_top'}); }catch(e){} }
  }

  /* ふわっと出る */
  var els = document.querySelectorAll('.nt-rv');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('nt-in-view'); io.unobserve(e.target); } });
    },{threshold:.2});
    els.forEach(function(e){ io.observe(e); });
  } else { els.forEach(function(e){ e.classList.add('nt-in-view'); }); }

  /* コンセプトの写真が、スクロールに合わせてごくゆっくり寄る */
  var one = document.querySelector('.nt-one'), tick = false;
  if(one && !calm){
    addEventListener('scroll', function(){
      if(tick) return; tick = true;
      requestAnimationFrame(function(){
        tick = false;
        var r = one.getBoundingClientRect();
        if(r.bottom < 0 || r.top > innerHeight) return;
        var t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
        one.style.setProperty('--z', (1 + t*0.12).toFixed(3));
      });
    }, {passive:true});
  }

  /* ケースの列：横に送れることを伝える（進み具合の線・次へのボタン・最初に一度だけ少し動いて戻る） */
  var row = document.querySelector('.nt-cases'), wrap = document.querySelector('.nt-cases-wrap');
  if(row && wrap){
    var bar = document.querySelector('.nt-cases-bar i'), next = wrap.querySelector('.nt-cases-next'), moved = false;
    function sync(){
      var max = row.scrollWidth - row.clientWidth, t = max > 0 ? row.scrollLeft / max : 0;
      if(bar) bar.style.setProperty('--x', (t * (100/0.22 - 100)).toFixed(1) + '%');
      wrap.classList.toggle('end', max <= 0 || t > 0.98);
    }
    row.addEventListener('scroll', function(){ moved = true; sync(); }, {passive:true});
    if(next) next.addEventListener('click', function(){ row.scrollBy({left: row.clientWidth * 0.8, behavior: calm ? 'auto' : 'smooth'}); });
    sync();
    if(!calm && 'IntersectionObserver' in window){
      var peek = new IntersectionObserver(function(es){
        if(!es[0].isIntersecting) return; peek.disconnect();
        setTimeout(function(){ if(moved || row.scrollWidth <= row.clientWidth) return;
          row.scrollTo({left:70, behavior:'smooth'}); setTimeout(function(){ row.scrollTo({left:0, behavior:'smooth'}); }, 650); }, 500);
      }, {threshold:.6});
      peek.observe(row);
    }
  }
})();
