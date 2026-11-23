/* AI診断の待ち時間・結果・選び直し（2026-11-22 作り替え）
   index.html の中の古い同名の関数を、あとから読むこのファイルで置きかえる。
   質問の流れ（diagSetRepeater など）は index.html のものをそのまま使う。 */
(function(){
  var ROLE_LABEL = { closest: 'いちばん近い1本', similar: '同じ方向で、少しちがう1本', adventure: '少しだけ冒険の1本' };
  var BAR_LABEL = [['sweet', '甘さ'], ['fresh', '爽やかさ'], ['deep', '深み'], ['last', '持続']];
  var WAIT_LINES = ['あなたの答えを読んでいます', '{n}の香りと照らし合わせています', '3本にしぼっています'];
  var MAX_RETRY = 2;

  var shownIds = [];      /* これまでに見せた香り（選び直しで外す） */
  var retryCount = 0;
  var lastData = null;
  var waitTimers = [];
  var scentCount = 23;
  var askSeq = 0;         /* 聞くたびに番号を進め、古い返事は捨てる（待っている間に閉じて開き直した時のため） */
  var inFallback = false;

  function $(id){ return document.getElementById(id); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function yen(n){ return '¥' + Math.round(n).toLocaleString(); }
  function ev(name, params){ try { if(typeof ga4Event === 'function') ga4Event(name, params || {}); } catch(e){} }
  function productById(id){ return PRODUCTS.find(function(x){ return x.id === Number(id); }) || null; }

  /* ケースなしのお試しとして、もうカートに入っているか */
  function inCart(id){ try { return cart.some(function(c){ return c.sample && !c.caseId && c.id === Number(id); }); } catch(e){ return false; } }
  /* 3本のうち、これからカートに入れる分 */
  function toAdd(){
    if(!lastData) return [];
    return lastData.picks.map(function(x){ return productById(x.productId); }).filter(function(p){ return p && sampleSellable(p) && !inCart(p.id); });
  }

  /* お客さまの答えを、画面に出す短い言葉にする */
  function answerWord(key){
    var a = window.diagAnswers || {};
    var v = a[key];
    if(!v) return '';
    if(key === 'previousProduct'){
      var p = PRODUCTS.find(function(x){ return v.indexOf(x.name) !== -1; });
      return (p && p.nameJa) ? p.nameJa : v;
    }
    if(key === 'previousFeeling') return v.split(/[！、。]/)[0] === '大好き' ? '大好きだった' : (v.indexOf('違う系統') !== -1 ? '次はちがう系統を' : '好みではなかった');
    if(key === 'nextWish') return v.indexOf('フルボトル') !== -1 ? 'フルボトルがほしい' : (v.indexOf('小分け') !== -1 ? '別の香りを比べたい' : 'おまかせ');
    if(key === 'strength') return '強さは' + v;
    if(key === 'season') return v === 'オールシーズン' ? '一年中' : v;
    if(key === 'freeText') return v.replace(/\n/g, ' ').replace(/（.*の記事を読んで.*?）/, '').trim();
    return v;
  }
  function answerChips(){
    var a = window.diagAnswers || {};
    var keys = a.isRepeater ? ['previousProduct', 'previousFeeling', 'nextWish', 'strength', 'season', 'freeText']
                            : ['smell', 'impression', 'distance', 'freeText'];
    return keys.map(function(k){ return answerWord(k); }).filter(function(w){ return w && w.indexOf('わからない') === -1; });
  }

  /* ── 画面の切りかえ（古い showDiagStep を置きかえ：上までもどす・カートの帯を出し入れ） ── */
  window.showDiagStep = function(id, stepNum){
    document.querySelectorAll('.diag-step').forEach(function(s){ s.style.display = 'none'; });
    var el = $(id); if(el) el.style.display = 'block';
    if(typeof updateDiagProgress === 'function') updateDiagProgress(stepNum);
    var body = $('dg-body'); if(body) body.scrollTop = 0;
    var foot = $('dg-foot'); if(foot) foot.classList.toggle('on', id === 'diag-result');
    /* 読み上げとキーボードのために、切りかわった画面の見出しへ移る */
    try { var h = el && el.querySelector('h3, .dg-wait-t'); if(h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } } catch(e){}
  };
  var oldOpen = window.openDiagnosis;
  window.openDiagnosis = function(){
    askSeq++; shownIds = []; retryCount = 0; lastData = null; stopWait();
    try { $('diag-feedback').hidden = false; $('diag-line-save').hidden = false; } catch(e){}
    var foot = $('dg-foot'); if(foot) foot.classList.remove('on');
    oldOpen.apply(this, arguments);
    var body = $('dg-body'); if(body) body.scrollTop = 0;
  };
  var oldClose = window.closeDiagnosis;
  window.closeDiagnosis = function(){ askSeq++; stopWait(); oldClose.apply(this, arguments); };
  document.addEventListener('keydown', function(e){
    var m = $('diagnosis-modal');
    if(e.key === 'Escape' && m && m.style.display === 'block') closeDiagnosis();
  });

  /* ── 待っている間：答えを1つずつ並べ、香りの点を少しずつ消していく ── */
  function stopWait(){ waitTimers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); waitTimers = []; }
  function startWait(isRetry){
    stopWait();
    var t = $('dg-wait-t'), ans = $('dg-wait-ans'), dots = $('dg-dots'), n = $('dg-wait-n');
    try { if(typeof SAMPLE_CFG !== 'undefined' && SAMPLE_CFG && SAMPLE_CFG.items) scentCount = Object.keys(SAMPLE_CFG.items).filter(function(k){ return !SAMPLE_CFG.items[k].soldOut; }).length || 23; } catch(e){}
    t.textContent = isRetry ? 'いただいた声をもとに、選び直しています' : WAIT_LINES[0];
    ans.innerHTML = '';
    answerChips().forEach(function(w, i){
      waitTimers.push(setTimeout(function(){
        var c = document.createElement('span'); c.className = 'dg-chip'; c.textContent = w; ans.appendChild(c);
      }, 250 + i * 420));
    });
    dots.innerHTML = '';
    for(var i = 0; i < scentCount; i++) dots.appendChild(document.createElement('i'));
    n.textContent = scentCount + 'の香り';
    var step = 0;
    waitTimers.push(setInterval(function(){
      step++;
      if(step < WAIT_LINES.length && !isRetry){ t.textContent = WAIT_LINES[step].replace('{n}', scentCount); }
      /* 点を少しずつ薄くする。最後の6つは、結果が届くまで残す */
      var on = Array.prototype.filter.call(dots.children, function(d){ return !d.classList.contains('off'); });
      var cut = Math.min(Math.max(on.length - 6, 0), Math.ceil(scentCount / 4));
      for(var k = 0; k < cut; k++){
        var pick = on.splice(Math.floor(Math.random() * on.length), 1)[0];
        if(pick) pick.classList.add('off');
      }
      n.textContent = on.length + 'の香り';
    }, 1900));
  }
  /* 結果が届いたら、残った点を3つにして色をつける。少し見せてから結果へ */
  function finishWait(done){
    stopWait();
    var dots = $('dg-dots'), n = $('dg-wait-n'), t = $('dg-wait-t');
    var on = Array.prototype.filter.call(dots.children, function(d){ return !d.classList.contains('off'); });
    while(on.length > 3){ on.splice(Math.floor(Math.random() * on.length), 1)[0].classList.add('off'); }
    on.forEach(function(d){ d.classList.add('hit'); });
    if(n) n.textContent = '3本';
    if(t) t.textContent = '3本が決まりました';
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    waitTimers.push(setTimeout(done, still ? 0 : 950));
  }

  /* ── AIに聞く ── */
  async function ask(retry){
    var resp = await fetch('/.netlify/functions/ai-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retry ? { answers: diagAnswers, retry: retry } : { answers: diagAnswers })
    });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();
    if(!data || !Array.isArray(data.picks) || !data.picks.length) throw new Error('empty');
    return data;
  }

  window.submitDiagnosis = async function(){
    var freeEl = $(diagIsRepeater ? 'diag-free' : 'diag-free-new') || $('diag-free');
    diagAnswers.freeText = freeEl ? freeEl.value.trim() : '';
    if(!diagIsRepeater){
      ev('ai_diagnosis_answer', { session_id: diagSessionId, question: 'gender', answer: diagAnswers.gender || '未回答' });
      ev('ai_diagnosis_answer', { session_id: diagSessionId, question: 'age', answer: diagAnswers.age || '未回答' });
    }
    ev('ai_diagnosis_answer', { session_id: diagSessionId, question: 'freeText', answer: diagAnswers.freeText ? 'あり' : 'なし' });
    if(diagEntryCtx && DIAG_CTX_LABELS[diagEntryCtx]){
      var ctxNote = '（' + DIAG_CTX_LABELS[diagEntryCtx] + 'の記事を読んで診断に来られたお客様です。その系統への興味も考慮してください）';
      diagAnswers.freeText = diagAnswers.freeText ? diagAnswers.freeText + '\n' + ctxNote : ctxNote;
    }
    showDiagStep('diag-loading', diagTotalSteps);
    startWait(false);
    try {
      localStorage.setItem('clg_diag_session', JSON.stringify({ sessionId: diagSessionId, answers: diagAnswers, timestamp: new Date().toISOString() }));
    } catch(e){}
    var seq = ++askSeq;
    try {
      var data = await ask(null);
      if(seq !== askSeq) return;
      finishWait(function(){ if(seq === askSeq) showDiagResult(data); });
    } catch(e){
      if(seq !== askSeq) return;
      console.error('AI Diagnosis error:', e);
      stopWait();
      showDiagFallback();
    }
  };

  /* ── 結果 ── */
  function whyRows(pick){
    if(!pick.why || !pick.why.length) return '';
    return '<dl class="dg-why">' + pick.why.map(function(w){
      var word = answerWord(w.key);
      if(!word) return '';
      return '<div><dt>' + esc(word) + '</dt><dd>' + esc(w.point) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function bars(pick){
    if(!pick.profile) return '';
    return '<div class="dg-bars" aria-label="香りの性格">' + BAR_LABEL.map(function(b){
      var v = Number(pick.profile[b[0]]) || 0, cells = '';
      for(var i = 1; i <= 5; i++) cells += '<i' + (i <= v ? ' class="on"' : '') + '></i>';
      return '<div class="dg-bar" role="img" aria-label="' + b[1] + ' 5段階の' + v + '">' + b[1] + '<span>' + cells + '</span></div>';
    }).join('') + '</div>';
  }
  function cardHtml(pick, idx){
    var p = productById(pick.productId);
    if(!p) return '';
    var img = (typeof sampleImg === 'function' && sampleImg(p)) || p.img || '';
    return '<div class="dg-card' + (idx === 0 ? ' first' : '') + '">' +
      '<div class="dg-role">' + esc(ROLE_LABEL[pick.role] || '') + '</div>' +
      '<div class="dg-pd">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '') +
        '<div class="dg-pd-t"><div class="dg-pd-b">' + esc(p.brand) + '</div><div class="dg-pd-n">' + esc(p.nameJa || p.name) + '</div>' +
        (pick.line ? '<div class="dg-pd-l">' + esc(pick.line) + '</div>' : '') + '</div>' +
        '<div class="dg-pd-p">' + yen(p.samplePrice) + '<small>1.5mL</small></div></div>' +
      whyRows(pick) + bars(pick) +
      (pick.caution ? '<div class="dg-care"><b>合わないかもしれない点</b>' + esc(pick.caution) + '</div>' : '') +
      '<div class="dg-acts"><button type="button" onclick="diagAddOne(' + p.id + ',this)">この1本だけカートへ</button>' +
      '<button type="button" onclick="diagSeeProduct(' + p.id + ')">くわしく見る</button></div>' +
    '</div>';
  }
  function updateFoot(){
    if(!lastData) return;
    var foot = $('dg-foot'), ps = toAdd();
    var all = lastData.picks.length;
    if(!all){ if(foot) foot.classList.remove('on'); return; }
    var btn = $('dg-add-all');
    if(!ps.length){
      /* 3本ともカートに入っている */
      $('dg-sum-l').textContent = all + '本ともカートに入っています';
      $('dg-sum-was').textContent = ''; $('dg-sum-now').textContent = '';
      btn.textContent = 'カートを見る'; btn.disabled = false;
      return;
    }
    var have = (typeof sampleBottleCount === 'function') ? sampleBottleCount() : 0;
    var rate = (typeof sampleBundleRate === 'function') ? sampleBundleRate(have + ps.length) : 0;
    var was = ps.reduce(function(s, p){ return s + p.samplePrice; }, 0);
    var now = ps.reduce(function(s, p){ return s + Math.round(p.samplePrice * (1 - rate)); }, 0);
    $('dg-sum-l').textContent = ps.length + '本・送料無料' + (rate ? '・' + Math.round(rate * 100) + '%引き' : '');
    $('dg-sum-was').textContent = rate ? yen(was) : '';
    $('dg-sum-now').textContent = yen(now);
    btn.textContent = ps.length === all ? 'この' + all + '本をカートに入れる' : '残りの' + ps.length + '本もカートに入れる';
    btn.disabled = false;
  }

  window.showDiagResult = function(data){
    /* 買える香りだけにする */
    data.picks = (data.picks || []).filter(function(x){ var p = productById(x.productId); return p && p.inStock !== false && sampleSellable(p); });
    if(!data.picks.length){
      if(inFallback || data.source === 'local'){ showDiagEmpty(); return; }
      showDiagFallback(); return;
    }
    lastData = data;
    data.picks.forEach(function(x){ if(shownIds.indexOf(String(x.productId)) === -1) shownIds.push(String(x.productId)); });

    $('dg-res-h').textContent = data.headline || '答えに近い香りから、3本を選びました';
    $('dg-res-ans').innerHTML = answerChips().map(function(w){ return '<span class="dg-chip">' + esc(w) + '</span>'; }).join('');
    $('diag-result-list').innerHTML = data.picks.map(cardHtml).join('');

    /* フルボトルの案内は、前の香りのフルボトルがほしいと答えた方にだけ */
    var slot = $('dg-full-slot'); slot.innerHTML = '';
    var fb = data.fullbottleId ? productById(data.fullbottleId) : null;
    if(fb && fb.sellPrice > 0){
      slot.innerHTML = '<button type="button" class="dg-full" onclick="diagSeeProduct(' + fb.id + ',true)">前に試した ' + esc(fb.nameJa || fb.name) + ' のフルボトル（' + yen(fb.sellPrice) + '）を見る</button>';
    }

    /* LINE保存・計測用（前からの形） */
    var recs = data.picks.map(function(x, i){ var p = productById(x.productId); return { rank: i + 1, productId: p.id, name: p.name, brand: p.brand }; });
    window.diagLastRecs = recs;
    var recIds = recs.map(function(r){ return r.productId; });
    window.diagLastRecIds = recIds;
    $('diag-profile-type').textContent = '';
    $('diag-personal-msg').textContent = data.headline || '';
    resetDiagResultUI();
    showDiagStep('diag-result', diagTotalSteps);
    updateFoot();

    ev('ai_diagnosis_complete', {
      session_id: diagSessionId, recommendations: recIds.join(','), top_pick: recIds[0],
      answers_scent: diagAnswers.scentType || '', answers_impression: diagAnswers.impression || '',
      answers_gender: diagAnswers.gender || '', answers_age: diagAnswers.age || '', answers_season: diagAnswers.season || '',
      answers_smell: diagAnswers.smell || '', answers_distance: diagAnswers.distance || '',
      entry_source: diagEntrySource || 'site', entry_ctx: diagEntryCtx || '',
      result_source: data.source || '', retry: retryCount
    });
    try {
      localStorage.setItem('clg_diag_recs', JSON.stringify({ sessionId: diagSessionId, productIds: recIds, timestamp: new Date().toISOString() }));
    } catch(e){}
    submitDiagSave('');
  };

  /* 香りを1本も出せない時（商品データが読めていない等）。同じ処理をくり返さず、ここで止める */
  function showDiagEmpty(){
    stopWait(); lastData = null;
    $('dg-res-h').textContent = 'ただいま、香りをご提案できません';
    $('dg-res-ans').innerHTML = '';
    $('diag-result-list').innerHTML = '<p class="dg-sec-p">申し訳ありません。少し時間をおいて、もう一度お試しください。ショップでは、すべての香りをご覧いただけます。</p>';
    $('dg-full-slot').innerHTML = '';
    $('diag-feedback').hidden = true; $('diag-line-save').hidden = true;
    showDiagStep('diag-result', diagTotalSteps);
    var foot = $('dg-foot'); if(foot) foot.classList.remove('on');
    ev('diag_empty', { session_id: diagSessionId });
  }

  /* AIにつながらない時：答えた系統に近い、買える香りを3本 */
  window.showDiagFallback = function(){
    var typeMap = { 'シトラス・フレッシュ': 'citrus', 'フローラル': 'floral', 'ウッディ・スパイシー': 'woody', 'スイート・グルマン': 'sweet', 'ムスク・クリーン': 'floral', 'ティー・グリーン': 'citrus' };
    var tag = typeMap[diagAnswers.scentType] || '';
    var prev = String(diagAnswers.previousProduct || '');
    var base = [];
    try {
      base = PRODUCTS.filter(function(p){
        return p.inStock !== false && sampleSellable(p) && shownIds.indexOf(String(p.id)) === -1 && !(prev && prev.indexOf(p.name) !== -1);
      });
    } catch(e){}
    var hit = base.filter(function(p){ return tag && p.tags && p.tags.indexOf(tag) !== -1; });
    var rest = base.filter(function(p){ return hit.indexOf(p) === -1; });
    var three = hit.concat(rest).slice(0, 3);
    if(!three.length){ showDiagEmpty(); return; }
    var roles = ['closest', 'similar', 'adventure'];
    inFallback = true;
    try {
      showDiagResult({
        headline: '答えに近い系統から、3本を選びました',
        source: 'local',
        picks: three.map(function(p, i){ return { role: roles[i], productId: String(p.id), why: [], caution: '' }; })
      });
    } finally { inFallback = false; }
  };

  /* ── カート ── */
  window.diagAddAll = function(){
    if(!lastData) return;
    var ids = toAdd().map(function(p){ return p.id; });
    ev('diag_add_all', { session_id: diagSessionId, items: ids.join(','), retry: retryCount });
    ids.forEach(function(id){ try { addSampleCart(id, 'diagnosis_all'); } catch(e){} });
    closeDiagnosis();
    try { openCart(); } catch(e){}
  };
  window.diagAddOne = function(id, btn){
    ev('diag_add_one', { session_id: diagSessionId, item_id: id });
    if(!inCart(id)){ try { addSampleCart(id, 'diagnosis'); } catch(e){} }
    if(btn){ btn.textContent = 'カートに入れました'; btn.classList.add('added'); btn.disabled = true; }
    updateFoot();
  };
  window.diagSeeProduct = function(id, full){
    ev('diag_see_product', { session_id: diagSessionId, item_id: id, fullbottle: full ? 'yes' : 'no' });
    closeDiagnosis();
    try { openProductSheet(id, 'diagnosis'); } catch(e){}
  };

  /* ── しっくりきたか → ちがう時は理由を聞いて、その場で選び直す ── */
  window.resetDiagResultUI = function(){
    try { setDiagLineButton('https://lin.ee/BTytLdX', '0', '準備中…'); } catch(e){}
    window.diagFeedbackRating = '';
    $('diag-feedback-q').hidden = false;
    $('diag-feedback-btns').hidden = false;
    $('diag-feedback-btns').style.display = '';
    $('diag-feedback-reasons').hidden = true;
    $('diag-feedback-thanks').hidden = true;
    $('dg-retry-note').textContent = retryCount >= MAX_RETRY ? '教えていただいた内容は、これからの選び方に生かします。' : '選ぶと、3本を選び直します。';
  };
  window.sendDiagFeedback = function(rating){
    window.diagFeedbackRating = rating;
    ev('diagnosis_feedback', {
      session_id: diagSessionId || '', rating: rating, top_pick: (window.diagLastRecIds || [])[0] || '',
      recommendations: (window.diagLastRecIds || []).join(','), entry_source: diagEntrySource || 'site', entry_ctx: diagEntryCtx || '', retry: retryCount
    });
    try { if(/(^|\.)collegrance\.com$/.test(location.hostname)) postDiagFeedback(rating, ''); } catch(e){}
    $('diag-feedback-q').hidden = true;
    $('diag-feedback-btns').hidden = true;
    if(rating === 'good'){ $('diag-feedback-thanks').hidden = false; }
    else { $('diag-feedback-reasons').hidden = false; }
  };
  window.sendDiagFeedbackReason = async function(reason){
    ev('diagnosis_feedback_reason', { session_id: diagSessionId || '', rating: window.diagFeedbackRating || '', answer: reason, top_pick: (window.diagLastRecIds || [])[0] || '', retry: retryCount });
    try { if(/(^|\.)collegrance\.com$/.test(location.hostname)) postDiagFeedback(window.diagFeedbackRating, reason); } catch(e){}
    if(retryCount >= MAX_RETRY || reason === 'その他'){
      $('diag-feedback-reasons').hidden = true;
      $('diag-feedback-thanks').hidden = false;
      return;
    }
    retryCount++;
    ev('diag_retry', { session_id: diagSessionId, reason: reason, retry: retryCount });
    showDiagStep('diag-loading', diagTotalSteps);
    startWait(true);
    var seq = ++askSeq;
    try {
      var data = await ask({ reason: reason, excludeIds: shownIds.slice(-9) });
      if(seq !== askSeq) return;
      finishWait(function(){ if(seq === askSeq) showDiagResult(data); });
    } catch(e){
      if(seq !== askSeq) return;
      console.error('AI Diagnosis retry error:', e);
      stopWait();
      showDiagFallback();
    }
  };

  /* ── LINEに残す（クーポンは付けない。Worker への保存は前と同じ） ── */
  window.submitDiagSave = async function(){
    var recs = window.diagLastRecs;
    if(!recs || !recs.length) return;
    /* 本番のサイト以外（手元の確認など）では、保存の記録を作らない */
    if(!/(^|\.)collegrance\.com$/.test(location.hostname)){ try { setDiagLineButton('https://lin.ee/BTytLdX', 'fallback', '（確認用の画面のため、保存は動きません）'); } catch(e){} return; }
    var fallbackNote = '友だち追加はできます（結果の自動送付は、いま一時的にご利用いただけません）';
    try {
      var payload = recs.slice(0, 3).map(function(r){ return { id: Number(r.productId), name: r.name || '', brand: r.brand || '' }; });
      var top = payload[0], tp = productById(top.id);
      var res = await fetch('https://line-crm-worker.shinomiya-keito.workers.dev/api/diagnosis/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: diagSessionId || '', answers: diagAnswers, recommendations: payload,
          top_pick: { id: top.id, name: top.name, brand: top.brand, asin: (tp && tp.amazonAsin) ? tp.amazonAsin : '' },
          coupon_code: ''
        })
      });
      var data = await res.json();
      if(data && data.success && data.data && data.data.save_code){
        window.diagSaveCode = data.data.save_code;
        setDiagLineButton('https://line-crm-worker.shinomiya-keito.workers.dev/diagnosis/save?sid=' + encodeURIComponent(diagSessionId || ''), '1', 'タップするとLINEが開きます（友だち追加のあと、結果がトークに届きます）');
      } else {
        setDiagLineButton('https://lin.ee/BTytLdX', 'fallback', fallbackNote);
      }
    } catch(e){
      console.error('diag save submit error:', e);
      try { setDiagLineButton('https://lin.ee/BTytLdX', 'fallback', fallbackNote); } catch(e2){}
    }
  };
})();
