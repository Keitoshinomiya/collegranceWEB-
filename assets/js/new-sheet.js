/* 商品の画面を回遊しやすくする（2026-11・見本ブランチ）
   ① あわせて比べたい香り：この香りと近い2つを、同じ物差し（甘さ・爽やかさ・深み・持続）で横に並べる。1回押すだけで一緒に入る
   ② カートに入れても画面を閉じない：「入れました・あと何本で何%引き・次の香り」を出す。カートへのボタンは画面の下にいつも出す
   今の画面（renderProductSheet）はそのまま使い、描いたあとに足している。戻す時は index.html のこのファイルの読み込みを消す。
   ⚠ 物差しの数値とひとことは下書き（Claude が作成）。香りの感じ方なので、本番に入れる前に四宮さん・美延さんの確認が要る。 */
(function(){
  if(typeof renderProductSheet !== 'function' || typeof PRODUCTS === 'undefined') return;

  /* id: [甘さ, 爽やかさ, 深み, 持続, ひとこと]（各1〜5） */
  var PROFILE = {
    1:[2,4,2,3,'洗いたてのシーツのような、やわらかい清潔感'],
    2:[2,5,2,2,'青いマンゴーと水辺の、みずみずしい爽やかさ'],
    3:[4,1,5,4,'ラム酒とタバコの、甘くて大人っぽい香り'],
    4:[2,2,4,4,'木とパウダーの、落ち着いた上品さ'],
    5:[3,4,2,2,'みずみずしい洋梨と白い花の、やさしい香り'],
    6:[1,3,4,3,'すっきりした木の香りに、やわらかいムスク'],
    7:[2,4,2,3,'白い花と石けんのような、透明感のある香り'],
    8:[1,2,4,5,'肌になじむ、ムスクと木の静かな香り'],
    9:[3,4,2,3,'すだちと白い花に、ほんのりバニラ'],
    10:[3,2,4,3,'やわらかい木とバニラの、あたたかい香り'],
    11:[3,3,2,3,'カシスと青いバラの、華やかな香り'],
    12:[1,4,4,4,'ベルガモットとペッパーの、きりっとした香り'],
    13:[2,2,3,4,'アイリスとムスクの、肌のようなやわらかさ'],
    14:[1,5,2,3,'水と白い花の、透きとおった香り'],
    15:[4,2,3,4,'ラベンダーとオレンジの花に、バニラの甘さ'],
    16:[1,5,1,2,'緑茶とシトラスの、すっきり軽い香り'],
    17:[5,1,4,4,'アプリコットとバニラの、濃くて甘い香り'],
    18:[1,5,2,2,'レモンと青りんごの、夏らしい爽やかさ'],
    19:[2,1,5,4,'白檀の、静かであたたかい木の香り'],
    20:[4,4,1,2,'桃とネクタリンの、みずみずしい甘さ'],
    21:[2,3,3,4,'お茶とベルガモットの、落ち着いた香り'],
    22:[2,3,4,3,'お香と木の、森の中のような香り'],
    23:[3,1,5,4,'アンバーと白檀の、夜に合うやわらかさ']
  };
  var AXES = ['甘さ','爽やかさ','深み','持続'];
  var added = {};   /* この画面を開いている間に、カートに入れた香り */

  function sell(p){ return p && p.type === 'sample_and_fullbottle' && sampleSellable(p); }
  function inCart(id){ return cart.some(function(c){ return c.sample && c.id === id; }); }
  function yen(n){ return '&yen;' + Math.round(n).toLocaleString(); }
  function ev(name, o){ try{ ga4Event(name, o || {}); }catch(e){} }

  /* 近い香りを選ぶ：同じ系統を優先し、物差しが近い順。カートに入っている香りは外す */
  function picks(p, n){
    var a = PROFILE[p.id]; if(!a) return [];
    return PRODUCTS.filter(function(x){ return x.id !== p.id && sell(x) && PROFILE[x.id] && !inCart(x.id); })
      .map(function(x){
        var b = PROFILE[x.id], d = 0; for(var i=0;i<4;i++) d += Math.abs(a[i]-b[i]);
        var share = (x.tags || []).filter(function(t){ return (p.tags || []).indexOf(t) > -1; }).length;
        return { p:x, s: share*2 - d + (x.salesCount ? Math.min(1, x.salesCount/500) : 0) };
      }).sort(function(u,v){ return v.s - u.s; }).slice(0, n).map(function(u){ return u.p; });
  }
  function dots(v){ var h=''; for(var i=1;i<=5;i++) h += '<i' + (i<=v ? ' class="on"' : '') + '></i>'; return '<span class="ntc-dots" role="img" aria-label="5段階の' + v + '">' + h + '</span>'; }
  /* 今のカートに k 本足したときの、その香りたちの合計と割引の率 */
  function priceWith(list){
    var rate = sampleBundleRate(sampleBottleCount() + list.length);
    return { rate: rate, total: list.reduce(function(s, x){ return s + Math.round(x.samplePrice * (1 - rate)); }, 0) };
  }
  function progress(){
    var n = sampleBottleCount(), t = sampleBundleTiers(), rate = sampleBundleRate(n);
    var next = t.filter(function(x){ return x.min > n; })[0];
    if(!n) return '';
    var now = 'いま' + n + '本' + (rate ? '・' + Math.round(rate*100) + '%引き' : '');
    return next ? now + '。<b>あと' + (next.min - n) + '本で' + Math.round(next.rate*100) + '%引き</b>' : now + '（いちばんお得です）';
  }

  function compareHtml(p){
    var others = picks(p, 2); if(!others.length) return '';
    var cols = [p].concat(others);
    var head = cols.map(function(x, i){
      return '<div class="ntc-col' + (i ? '' : ' me') + '">' +
        (sampleImg(x) ? '<img src="' + sampleImg(x) + '" alt="" width="42" height="56" loading="lazy">' : '') +
        '<div class="ntc-br">' + x.brand + '</div><div class="ntc-nm">' + (x.nameJa || x.name) + '</div>' +
        '<div class="ntc-one">' + PROFILE[x.id][4] + '</div></div>';
    }).join('');
    var rows = AXES.map(function(ax, k){
      return '<div class="ntc-ax">' + ax + '</div>' + cols.map(function(x){ return '<div class="ntc-cell">' + dots(PROFILE[x.id][k]) + '</div>'; }).join('');
    }).join('');
    var foot = cols.map(function(x, i){
      if(!i) return '<div class="ntc-cell"><span class="ntc-tag">いま見ている香り</span><div class="ntc-pr">' + yen(x.samplePrice) + '</div></div>';
      return '<div class="ntc-cell"><div class="ntc-pr">' + yen(x.samplePrice) + '</div>' +
        '<button type="button" class="ntc-add" onclick="ntSheet.add(' + x.id + ',' + p.id + ')">＋ 入れる</button>' +
        '<button type="button" class="ntc-see" onclick="ntSheet.see(' + x.id + ')">くわしく見る</button></div>';
    }).join('');
    var pair = [others[0]]; if(!inCart(p.id)) pair.unshift(p);
    var pw = priceWith(pair);
    var label = (pair.length === 2 ? 'この2本をまとめてカートへ ' : (others[0].nameJa || others[0].name) + ' もカートへ ') + yen(pw.total) + (pw.rate ? '（' + Math.round(pw.rate*100) + '%引き）' : '');
    return '<section class="ntc" id="ntc"><div class="ps-sec-title">あわせて比べたい香り</div>' +
      '<p class="ntc-sub">香りは、2〜3本を並べてつけると違いが分かります。同じ便で届き、送料は無料です。</p>' +
      '<div class="ntc-grid" style="--n:' + cols.length + '">' + head + rows + '<div class="ntc-ax"></div>' + foot + '</div>' +
      '<button type="button" class="ps-main ntc-pair" onclick="ntSheet.pair(' + p.id + ',' + others[0].id + ')">' + label + '</button></section>';
  }
  function doneHtml(p){
    if(!added[p.id]) return '';
    var nx = picks(p, 1)[0];
    return '<div class="ntd" id="ntd"><div class="ntd-ok">カートに入れました</div>' + (progress() ? '<div class="ntd-pg">' + progress() + '</div>' : '') +
      (nx ? '<button type="button" class="ntd-next" onclick="ntSheet.see(' + nx.id + ')">' + (sampleImg(nx) ? '<img src="' + sampleImg(nx) + '" alt="" width="30" height="40">' : '') +
        '<span><small>次に見るなら</small><b>' + (nx.nameJa || nx.name) + '</b><em>' + PROFILE[nx.id][4] + '</em></span><i>&rarr;</i></button>' : '') + '</div>';
  }
  function bar(p){
    var ov = document.getElementById('sample-lp-overlay'), b = document.getElementById('nt-bar');
    if(!b){ b = document.createElement('div'); b.id = 'nt-bar'; ov.appendChild(b); }
    if(!sell(p)){ b.style.display = 'none'; return; }
    b.style.display = '';
    var pg = progress();
    b.innerHTML = '<div class="nt-bar-in">' + (pg ? '<div class="nt-bar-pg">' + pg + '</div>' : '') +
      (added[p.id]
        ? '<div class="nt-bar-row"><button type="button" class="ps-sub" onclick="ntSheet.toCompare()">ほかの香りも見る</button><button type="button" class="ps-main" onclick="closeSampleLP();openCart()">カートを見る</button></div>'
        : '<button type="button" class="ps-main" onclick="ntSheet.add(' + p.id + ',' + p.id + ')">お試しをカートへ ' + yen(p.samplePrice) + '</button>') + '</div>';
  }

  var orig = renderProductSheet;
  window.renderProductSheet = renderProductSheet = function(p){
    orig(p);
    var lp = document.getElementById('sample-lp'); if(!lp) return;
    bar(p);
    if(!sell(p) || !PROFILE[p.id]) return;
    lp.classList.add('nt-has-bar');
    var blocks = lp.querySelector('.ps-blocks'); if(!blocks) return;
    /* 画面の中の「お試しをカートへ」も、閉じずに入れる動きにそろえる */
    var main = Array.prototype.filter.call(blocks.querySelectorAll('button'), function(b){ return /^お試しをカートへ/.test(b.textContent.trim()); })[0];
    if(main){ main.setAttribute('onclick', 'ntSheet.add(' + p.id + ',' + p.id + ')'); }
    blocks.insertAdjacentHTML('beforebegin', doneHtml(p));
    blocks.insertAdjacentHTML('afterend', compareHtml(p));
  };
  var origClose = closeSampleLP;
  window.closeSampleLP = closeSampleLP = function(){ added = {}; var b = document.getElementById('nt-bar'); if(b) b.style.display = 'none'; origClose(); };

  function current(id){ return PRODUCTS.find(function(x){ return x.id === id; }); }
  window.ntSheet = {
    add: function(id, sheetId){
      addSampleCart(id, id === sheetId ? 'sheet' : 'sheet_compare'); added[sheetId] = true;
      if(id !== sheetId) ev('nt_compare_add', { product_id: id, from_product: sheetId });
      var p = current(sheetId); if(p){ renderProductSheet(p); var d = document.getElementById('ntd'); if(d && id === sheetId) d.scrollIntoView({block:'center', behavior:'smooth'}); }
    },
    pair: function(sheetId, otherId){
      if(!inCart(sheetId)) addSampleCart(sheetId, 'sheet_pair'); addSampleCart(otherId, 'sheet_pair'); added[sheetId] = true;
      ev('nt_pair_add', { product_id: sheetId, with_product: otherId });
      var p = current(sheetId); if(p){ renderProductSheet(p); var d = document.getElementById('ntd'); if(d) d.scrollIntoView({block:'center', behavior:'smooth'}); }
    },
    see: function(id){ ev('nt_next_view', { product_id: id }); openProductSheet(id, 'sheet_compare'); },
    toCompare: function(){ var c = document.getElementById('ntc'); if(c) c.scrollIntoView({block:'start', behavior:'smooth'}); }
  };
})();
