/* 新しいトップの動き（2026-11・見本ブランチ）。入場演出・ふわっと出る・コンセプト写真のゆるい寄り。 */
(function(){
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('nt-js');

  /* 入場演出：来るたびに出す（?intro=1 でも見られる）。画面を押すとすぐ消える */
  var intro = document.getElementById('nt-intro'), force = /[?&]intro=1/.test(location.search), seen = false;
  /* 来るたびに出す。ただし、サイトの中の別のページから戻ってきた時と、ブラウザの「戻る」で戻った時は出さない（買い物の途中で何度も出ると邪魔になるため） */
  try{
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
    var back = nav && nav.type === 'back_forward';
    var inside = document.referrer && document.referrer.indexOf(location.origin) === 0 && !(nav && nav.type === 'reload');
    seen = !!(back || inside);
  }catch(e){}
  function end(){ root.classList.remove('nt-intro-on','nt-intro-out'); }
  if(intro && !calm && (force || !seen)){
    root.classList.add('nt-intro-on');
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

  /* ひと吹き：最初の画面の写真にふれると、白い霧が出る */
  var slides = document.querySelector('.nt-hero .hero-slides'), hint = document.getElementById('nt-puff-hint');
  if(slides){
    if(calm && hint) hint.style.display = 'none';
    slides.addEventListener('pointerdown', function(e){
      if(calm) return;
      var r = slides.getBoundingClientRect();
      for(var i = 0; i < 4; i++){
        var s = document.createElement('span'); s.className = 'nt-puff';
        s.style.left = (e.clientX - r.left + (i - 1.5) * 16) + 'px'; s.style.top = (e.clientY - r.top - i * 12) + 'px'; s.style.animationDelay = (i * 0.07) + 's';
        slides.appendChild(s); s.addEventListener('animationend', function(){ this.remove(); });
      }
      if(hint && !hint.classList.contains('gone')){ hint.classList.add('gone'); if(typeof gtag !== 'undefined'){ try{ gtag('event','nt_puff',{event_category:'new_top'}); }catch(err){} } }
    });
  }

  /* 今日の1本：押すと瓶が次々に入れ替わって、香りが1つ出る（来るたび・ひくたびに違う香り） */
  var tBtn = document.getElementById('nt-today-btn'), tStage = document.getElementById('nt-today-stage'), tImg = document.getElementById('nt-today-img'), tInfo = document.getElementById('nt-today-info'), tLast = 0, tBusy = false;
  var TINT = { citrus:'#f6f2c9', floral:'#fde9e4', sweet:'#fde9e4', woody:'#fdfbe2', oriental:'#e4f3f4' }, DOTS = ['#ffc3b9','#5ab9be','#faf5be','#ebe65f','#ffc3b9','#5ab9be'];
  function tList(){ try{ return PRODUCTS.filter(function(p){ return p.type === 'sample_and_fullbottle' && sampleSellable(p) && sampleImg(p); }); }catch(e){ return []; } }
  function tEv(n, o){ try{ ga4Event(n, o || {}); }catch(e){} }
  function tShow(p){
    var prof = (window.ntProfile && window.ntProfile[p.id]) || null;
    tStage.style.setProperty('--nt-tint', TINT[(p.tags || [])[0]] || '#fdfbe6');
    tImg.src = sampleImg(p); tImg.alt = (p.nameJa || p.name) + ' のお試しの瓶';
    tInfo.innerHTML = '<div class="nt-today-br">' + p.brand + '</div><div class="nt-today-nm">' + (p.nameJa || p.name) + '</div>' +
      (prof ? '<p class="nt-today-one">' + prof[4] + '</p>' : '') +
      '<div class="nt-today-pr">お試し 1.5mL &yen;' + p.samplePrice.toLocaleString() + '</div>' +
      '<div class="nt-today-acts"><button type="button" class="nt-today-see">この香りを見る</button><button type="button" class="nt-today-add">カートへ</button></div>';
    tInfo.querySelector('.nt-today-see').addEventListener('click', function(){ tEv('nt_today_view', { product_id: p.id }); openProductSheet(p.id, 'today'); });
    tInfo.querySelector('.nt-today-add').addEventListener('click', function(){ tEv('nt_today_add', { product_id: p.id }); addSampleCart(p.id, 'today'); });
    tStage.querySelectorAll('i.dot').forEach(function(d){ d.remove(); });
    if(!calm) DOTS.forEach(function(col, i){ var d = document.createElement('i'); d.className = 'dot'; d.style.background = col; var a = (i / DOTS.length) * Math.PI * 2; d.style.setProperty('--bx', Math.round(Math.cos(a) * 80) + 'px'); d.style.setProperty('--by', Math.round(Math.sin(a) * 80) + 'px'); tStage.appendChild(d); });
    tStage.classList.remove('spin'); void tStage.offsetWidth; tStage.classList.add('hit');
    tBtn.textContent = 'もう一度ひく'; tBtn.classList.add('again'); tBtn.disabled = false; tBusy = false;
  }
  if(tBtn && tStage){
    tBtn.addEventListener('click', function(){
      if(tBusy) return;
      var list = tList(); if(!list.length){ return; }
      var pool = list.filter(function(p){ return p.id !== tLast; }), pick = pool[Math.floor(Math.random() * pool.length)]; tLast = pick.id;
      tEv('nt_today_draw', { product_id: pick.id });
      if(calm){ tShow(pick); return; }
      tBusy = true; tBtn.disabled = true; tStage.classList.remove('hit'); tStage.classList.add('spin');
      tInfo.innerHTML = '<p class="nt-today-wait">えらんでいます…</p>';
      var n = 0, total = 14;
      (function step(){
        if(n >= total){ tShow(pick); return; }
        tImg.src = sampleImg(list[Math.floor(Math.random() * list.length)]); n++;
        setTimeout(step, 70 + n * n * 1.4);
      })();
    });
  }
})();
