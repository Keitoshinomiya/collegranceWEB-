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
})();
