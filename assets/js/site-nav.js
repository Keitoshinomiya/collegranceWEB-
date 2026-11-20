/* 全ページ共通のメニュー（2026-11・スマホのメニューを作り直し、パソコンのメニューに1項目足す）
   brand-fonts.js の最後から読み込む＝ほぼ全ページに1か所で効く。見た目は assets/css/new-nav.css。
   今までの .mobile-nav（ページごとに書いてあるHTML）は使わず、ここで同じ中身のメニューを作る。
   ハンバーガーが無いページ（お客様の声・テーマ別の案内）には、ボタンを足す。 */
(function(){
  if(window.__ntNav) return; window.__ntNav = true;
  var LINE = 'https://line.me/R/ti/p/@711rocrx';
  var MAIN = [
    ['お試しの香りをえらぶ', '1.5mL・¥750から。3本で15%引き', '/#popular-scroll'],
    ['フルボトル', '気に入った香りを通常サイズで', '/#fullbottle'],
    ['ギフトセット', '選べる3本＋ケース＋ポーチ', '/gift-set.html'],
    ['読みもの', '香りの知識・レビュー・ランキング', '/journal.html'],
    ['お客様の声', 'アンケートに届いた回答', '/customer-voice.html'],
    ['コレグランスについて', '名前の由来と、中身のこと', '/about.html']
  ];
  var SUB = [['お問い合わせ','/contact.html'],['配送・返品','/tokushoho.html#shipping'],['特定商取引法','/tokushoho.html'],['LINEで相談', LINE]];
  var sparkle = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.5 5Q12.20 11.80 19 13.5Q12.20 15.20 10.5 22Q8.80 15.20 2 13.5Q8.80 11.80 10.5 5ZM19 1.5Q19.80 4.70 23 5.5Q19.80 6.30 19 9.5Q18.20 6.30 15 5.5Q18.20 4.70 19 1.5Z"/></svg>';
  function ev(n, o){ try{ if(typeof gtag !== 'undefined') gtag('event', n, o || {}); }catch(e){} }

  function build(){
    var nav = document.createElement('div');
    nav.id = 'nt-nav'; nav.setAttribute('role', 'dialog'); nav.setAttribute('aria-modal', 'true'); nav.setAttribute('aria-label', 'メニュー'); nav.hidden = true;
    nav.innerHTML =
      '<div class="ntn-head"><a href="/" class="ntn-logo" aria-label="COLLEGRANCE トップへ"></a><button type="button" class="ntn-close" aria-label="メニューを閉じる"><span></span><span></span></button></div>' +
      '<div class="ntn-body">' +
        '<div class="ntn-cta"><a class="ntn-b1" href="/#popular-scroll" data-nt="shop">香りをえらぶ</a><button type="button" class="ntn-b2" data-nt="diag">' + sparkle + 'AIで診断する</button></div>' +
        '<ul class="ntn-main">' + MAIN.map(function(m){ return '<li><a href="' + m[2] + '"><span><b>' + m[0] + '</b><small>' + m[1] + '</small></span><i aria-hidden="true">&rarr;</i></a></li>'; }).join('') + '</ul>' +
        '<ul class="ntn-sub">' + SUB.map(function(m){ return '<li><a href="' + m[1] + '"' + (/^https/.test(m[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + m[0] + '</a></li>'; }).join('') + '</ul>' +
      '</div>';
    document.body.appendChild(nav);
    nav.querySelector('.ntn-close').addEventListener('click', close);
    nav.addEventListener('click', function(e){
      var a = e.target.closest('a,button[data-nt]'); if(!a) return;
      if(a.getAttribute('data-nt') === 'diag'){
        ev('nt_nav_click', {event_label: 'diagnosis'}); close();
        if(typeof openDiagnosis === 'function') openDiagnosis(); else location.href = '/?diagnosis=1';
        return;
      }
      if(a.tagName === 'A'){ ev('nt_nav_click', {event_label: a.getAttribute('href')}); close(); }
    });
    return nav;
  }
  var nav = null, last = null;
  function open(){
    if(!nav) nav = build();
    last = document.activeElement;
    nav.hidden = false; void nav.offsetWidth; nav.classList.add('open');
    document.documentElement.classList.add('ntn-lock');
    document.querySelectorAll('.hamburger').forEach(function(b){ b.setAttribute('aria-expanded', 'true'); });
    var c = nav.querySelector('.ntn-close'); if(c) c.focus();
    ev('nt_nav_open', {});
  }
  function close(){
    if(!nav) return;
    nav.classList.remove('open'); document.documentElement.classList.remove('ntn-lock');
    document.querySelectorAll('.hamburger').forEach(function(b){ b.setAttribute('aria-expanded', 'false'); b.classList.remove('open'); });
    setTimeout(function(){ if(nav && !nav.classList.contains('open')) nav.hidden = true; }, 320);
    if(last && last.focus) try{ last.focus(); }catch(e){}
  }
  function toggle(){ if(nav && nav.classList.contains('open')) close(); else open(); }

  function init(){
    /* 今までのスマホのメニューは閉じたままにして、ボタンを新しいメニューにつなぐ */
    window.toggleMobileNav = toggle;
    var old = document.getElementById('mobile-nav'); if(old){ old.classList.remove('open'); old.setAttribute('aria-hidden', 'true'); }
    var burgers = document.querySelectorAll('.hamburger');
    if(!burgers.length){
      var host = document.querySelector('.site-header .header-right') || document.querySelector('.site-header .header-inner') || document.querySelector('.gh-bar');
      if(host){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'hamburger ntn-added'; b.innerHTML = '<span></span><span></span><span></span>';
        host.appendChild(b); burgers = [b];
      }
    }
    Array.prototype.forEach.call(burgers, function(b){
      b.removeAttribute('onclick'); b.setAttribute('aria-label', 'メニューを開く'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function(e){ e.preventDefault(); toggle(); });
    });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    /* パソコンのメニュー：About の中に「コレグランスについて」を足す */
    document.querySelectorAll('.header-nav .mega-drop-grid').forEach(function(g){
      var bs = g.querySelector('a[href*="brand-story"]');
      if(bs && !g.querySelector('a[href*="about.html"]')){
        var a = document.createElement('a'); a.href = '/about.html'; a.innerHTML = 'コレグランスについて<span class="mega-sub">名前の由来と、中身のこと</span>';
        g.insertBefore(a, bs);
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
