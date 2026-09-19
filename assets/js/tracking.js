/**
 * COLLEGRANCE チャネル計測トラッキングシステム
 *
 * 機能:
 * 1. 流入チャネル自動判定（UTMパラメータ / リファラー）
 * 2. Amazonリンククリック計測（チャネル情報付き）
 * 3. GA4カスタムイベント送信
 * 4. 自社サイト購入時のチャネル記録
 * 5. Amazon Attributionタグ自動付与
 */

(function() {
  'use strict';

  // ============================================================
  // 設定
  // ============================================================
  const CONFIG = {
    // Amazonアソシエイト トラッキングID
    // ※ Amazon Attribution は日本(amazon.co.jp)では提供されていないため、
    //    「購入」の計測はアソシエイトのトラッキングIDで行う。
    //    「クリック」の計測はGA4側(linkUrl × sessionSource)で完結済み。
    // ⚠ 本人・家族・従業員・取引先がこのリンク経由で購入することは規約違反（参加要件6(u)）
    associateTag: 'collegrance-22',

    // ブランドストア参照元タグ（ストアインサイトで流入元別の売上・注文が見える）
    // ※ amazon.co.jp/collegrance など Stores 配下のURLにのみ付与可能
    //   タグの事前登録は不要（URLに ?channel= を付ければストアインサイトの
    //   「Top tags」に自動で集計される。訪問数が少ないタグは「その他のタグ」に集約）
    //   制約: 小文字 channel / 20文字以内 / 英数字・ダッシュ・アンダースコア・スペース
    //   正規URL: https://www.amazon.co.jp/stores/page/F9EFF672-A578-4332-A93B-CDE6DB8F22D0
    storeChannelEnabled: true,
    storeChannelTags: {
      website:   'site',
      threads:   'threads',
      line:      'line',
      instagram: 'instagram',
      tiktok:    'tiktok',
      blog:      'blog',
      direct:    'direct',
      other:     'other'
    },

    // アソシエイト開示表記（運営規約 第5項により必須）
    disclosureText: 'Amazonのアソシエイトとして、COLLEGRANCEは適格販売により収入を得ています。',

    // セッションストレージキー
    storageKey: 'clg_channel',
    sessionKey: 'clg_session',

    // GA4 イベント名
    events: {
      amazonClick:    'amazon_link_click',
      channelDetect:  'channel_detected',
      purchaseOwn:    'purchase_own_site',
    },

    // デバッグモード（コンソールにログ出力）
    debug: location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  };

  // ============================================================
  // チャネル判定
  // ============================================================
  const ChannelDetector = {
    /**
     * UTMパラメータまたはリファラーからチャネルを判定
     * 優先順位: UTM > リファラー > 保存済みセッション > direct
     */
    detect() {
      const params = new URLSearchParams(window.location.search);
      const utmSource  = (params.get('utm_source')  || '').toLowerCase();
      const utmMedium  = (params.get('utm_medium')  || '').toLowerCase();
      const utmCampaign = params.get('utm_campaign') || '';
      const referrer   = document.referrer.toLowerCase();

      let channel = 'direct';
      let detail  = '';

      // 1. UTMパラメータから判定
      if (utmSource) {
        if (utmSource.includes('threads')) {
          channel = 'threads';
        } else if (utmSource.includes('line')) {
          channel = 'line';
        } else if (utmSource.includes('tiktok') || utmSource.includes('tik_tok')) {
          channel = 'tiktok';
        } else if (utmSource.includes('instagram') || utmSource.includes('ig')) {
          channel = 'instagram';
        } else if (utmSource.includes('blog') || utmMedium.includes('blog') || utmMedium.includes('article')) {
          channel = 'blog';
        } else if (utmSource.includes('google')) {
          channel = 'google';
        } else if (utmSource.includes('twitter') || utmSource.includes('x.com')) {
          channel = 'twitter';
        } else {
          channel = 'other';
        }
        detail = `${utmSource}/${utmMedium}`;
      }
      // 2. リファラーから判定
      else if (referrer) {
        if (referrer.includes('threads.net')) {
          channel = 'threads';
        } else if (referrer.includes('line.me') || referrer.includes('liff.line.me') || referrer.includes('liff')) {
          channel = 'line';
        } else if (referrer.includes('tiktok.com')) {
          channel = 'tiktok';
        } else if (referrer.includes('instagram.com')) {
          channel = 'instagram';
        } else if (referrer.includes('amazon.co.jp') || referrer.includes('amazon.com')) {
          channel = 'amazon';
        } else if (referrer.includes('google.') || referrer.includes('bing.') || referrer.includes('yahoo.')) {
          channel = 'organic_search';
        } else if (referrer.includes('collegrance.com')) {
          // 同一サイト内遷移 → 既存セッションを維持
          const saved = this.getSaved();
          if (saved) return saved;
          channel = 'website';
        } else {
          channel = 'referral';
        }
        detail = referrer;
      }
      // 3. 保存済みセッションから復元
      else {
        const saved = this.getSaved();
        if (saved) return saved;
      }

      const result = {
        channel,
        detail,
        utm_source:   utmSource,
        utm_medium:   utmMedium,
        utm_campaign: utmCampaign,
        referrer:     document.referrer,
        landing_page: window.location.pathname,
        timestamp:    new Date().toISOString()
      };

      this.save(result);
      return result;
    },

    save(data) {
      try {
        sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify(data));
        // 簡易キーにも保存（他のスクリプトやGA4グローバルパラメータ用）
        sessionStorage.setItem('clg_source', data.channel || '');
        sessionStorage.setItem('clg_medium', data.utm_medium || '');
        sessionStorage.setItem('clg_campaign', data.utm_campaign || '');
        // チャネルはローカルストレージにも保存（Stripe決済後の復元用）
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({
          channel: data.channel,
          detail: data.detail,
          utm_campaign: data.utm_campaign,
          timestamp: data.timestamp
        }));
      } catch(e) { /* private browsing */ }
    },

    getSaved() {
      try {
        const raw = sessionStorage.getItem(CONFIG.sessionKey);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },

    getChannel() {
      const saved = this.getSaved();
      return saved ? saved.channel : 'direct';
    }
  };

  // ============================================================
  // GA4 イベント送信
  // ============================================================
  const Analytics = {
    send(eventName, params) {
      if (typeof gtag === 'function') {
        gtag('event', eventName, params);
      }
      if (CONFIG.debug) {
        console.log(`[CLG Track] ${eventName}`, params);
      }
    },

    /**
     * 流入元情報を自動付与してGA4イベントを送信
     * shop.html内のga4Event等からも利用可能
     */
    sendWithSource(eventName, params) {
      params = params || {};
      params.traffic_source = sessionStorage.getItem('clg_source') || 'unknown';
      params.traffic_medium = sessionStorage.getItem('clg_medium') || '';
      params.traffic_campaign = sessionStorage.getItem('clg_campaign') || '';
      this.send(eventName, params);
    },

    /**
     * GA4グローバルパラメータに流入元を設定
     * 全イベントに自動付与される
     */
    setGlobalSourceParams() {
      if (typeof gtag === 'function') {
        gtag('set', {
          'traffic_source': sessionStorage.getItem('clg_source') || 'unknown',
          'traffic_medium': sessionStorage.getItem('clg_medium') || '',
          'traffic_campaign': sessionStorage.getItem('clg_campaign') || ''
        });
        if (CONFIG.debug) {
          console.log('[CLG Track] GA4 global params set', {
            traffic_source: sessionStorage.getItem('clg_source'),
            traffic_medium: sessionStorage.getItem('clg_medium'),
            traffic_campaign: sessionStorage.getItem('clg_campaign')
          });
        }
      }
    }
  };

  // ============================================================
  // Amazon リンクトラッキング
  // ============================================================
  const AmazonTracker = {
    init(channelData) {
      // ページ内の全Amazonリンクを検出してトラッキング付与
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="amazon.co.jp"], a[href*="amzn."]');
        if (!link) return;

        const href = link.href;
        const asin = this.extractASIN(href);
        const channel = channelData.channel;
        const page = window.location.pathname;
        const placement = this.detectPlacement(link);

        // GA4イベント送信（traffic_source も自動付与する sendWithSource を使用）
        Analytics.sendWithSource(CONFIG.events.amazonClick, {
          event_category: 'outbound',
          event_label:    asin || href,
          channel:        channel,
          placement:      placement,
          asin:           asin || '',
          utm_source:     channelData.utm_source || '',
          utm_campaign:   channelData.utm_campaign || '',
          page_path:      page,
          link_url:       href,
          link_text:      link.textContent.trim().substring(0, 50)
        });

        // トラッキングパラメータ付与（商品=アソシエイトtag / ストア=参照元channel）
        const taggedUrl = this.addTrackingParams(href, channel);
        if (taggedUrl !== href) {
          e.preventDefault();
          // LINE内ブラウザ等で window.open がブロックされると無反応になるため、同一タブ遷移にフォールバック
          var w = null;
          try { w = window.open(taggedUrl, link.target || '_blank'); } catch (err) { w = null; }
          if (!w) { window.location.href = taggedUrl; }
        }
      });
    },

    /**
     * クリックされたリンクの「設置場所」を推定して返す
     * 優先順位: data-placement 属性 > 既知の意味的コンテナ > 最も近い祖先のid > セクションのclass
     * 148ページすべてで自動的に意味のある値が入るよう、id へのフォールバックを持たせている
     */
    detectPlacement(el) {
      try {
        const explicit = el.closest('[data-placement]');
        if (explicit) return (explicit.getAttribute('data-placement') || '').substring(0, 40);

        const known = [
          ['[data-diagnosis-result], #diagnosis-result, #diag-result, .diagnosis-result, #aiResult', 'diagnosis_result'],
          ['.modal, [role="dialog"], dialog', 'modal'],
          ['header, .site-header', 'header'],
          ['footer', 'footer']
        ];
        for (let i = 0; i < known.length; i++) {
          if (el.closest(known[i][0])) return known[i][1];
        }

        const withId = el.closest('[id]');
        if (withId && withId.id) return withId.id.substring(0, 40);

        const sec = el.closest('section, article, [class]');
        if (sec && typeof sec.className === 'string' && sec.className.trim()) {
          return sec.className.trim().split(/\s+/)[0].substring(0, 40);
        }
      } catch(e) { /* closest 非対応など */ }
      return 'other';
    },

    extractASIN(url) {
      const match = url.match(/\/dp\/([A-Z0-9]{10})/);
      return match ? match[1] : null;
    },

    /**
     * Amazonリンクにトラッキングパラメータを付与
     *   商品ページ(/dp/, /gp/product/) → アソシエイトの tag=
     *   ブランドストア(/collegrance, /stores/) → ストア参照元タグ channel=
     * ※ 旧実装の ref=clg_xxx は廃止。
     *    日本では Amazon Attribution が使えず ref= は一切計測されないうえ、
     *    Amazon内部の ref パラメータと衝突しうるため。
     */
    addTrackingParams(url, channel) {
      try {
        const u = new URL(url);
        if (!/(^|\.)amazon\.(co\.jp|com)$/.test(u.hostname)) return url;

        if (this.isStoreUrl(u)) {
          // ブランドストア: ストアインサイトの参照元タグ
          // http のままだと https へのリダイレクトを1回挟むため、クエリ欠落を避けて正規化する
          u.protocol = 'https:';
          if (CONFIG.storeChannelEnabled) {
            const ch = CONFIG.storeChannelTags[channel] || CONFIG.storeChannelTags.other;
            if (ch) u.searchParams.set('channel', ch);
          }
          return u.toString();
        }

        // 商品ページ: アソシエイトのトラッキングID
        if (CONFIG.associateTag) {
          u.searchParams.set('tag', CONFIG.associateTag);
        }
        return u.toString();
      } catch(e) {
        return url;
      }
    },

    /** Stores 配下のURLか（参照元タグを付けられるのはストアページのみ） */
    isStoreUrl(u) {
      const p = (u.pathname || '').toLowerCase();
      return p.indexOf('/stores/') === 0 || p === '/collegrance' || p.indexOf('/collegrance/') === 0;
    }
  };

  // ============================================================
  // ページ上のAmazonリンク自体をアソシエイトリンクに書き換える
  // ============================================================
  // クリック時の付与だけだと、長押し/右クリックの「新しいタブで開く」・中クリック・
  // リンクのコピーでは tag= が付かずに抜ける。href そのものを書き換えておくことで
  // どの開き方でも計測され、ページ上でもアソシエイトリンクとして見える状態にする。
  // 商品カードや診断結果など後から描画されるリンクは MutationObserver で拾う。
  const LinkRewriter = {
    SELECTOR: 'a[href*="amazon.co.jp"], a[href*="amazon.com"]',

    init(channelData) {
      const channel = channelData.channel;
      const self = this;
      const scan = function(root) {
        try {
          if (root.matches && root.matches(self.SELECTOR)) self.apply(root, channel);
          if (root.querySelectorAll) {
            const list = root.querySelectorAll(self.SELECTOR);
            for (let i = 0; i < list.length; i++) self.apply(list[i], channel);
          }
        } catch(e) { /* noop */ }
      };

      scan(document);

      if (typeof MutationObserver === 'function' && document.body) {
        new MutationObserver(function(muts) {
          for (let i = 0; i < muts.length; i++) {
            const m = muts[i];
            if (m.type === 'attributes') { scan(m.target); continue; }
            for (let j = 0; j < m.addedNodes.length; j++) {
              if (m.addedNodes[j].nodeType === 1) scan(m.addedNodes[j]);
            }
          }
        }).observe(document.body, {
          childList: true, subtree: true, attributes: true, attributeFilter: ['href']
        });
      }
    },

    apply(a, channel) {
      const current = a.href;
      const next = AmazonTracker.addTrackingParams(current, channel);
      // 変化が無ければ触らない（attributes 監視の再発火で無限ループしないための条件でもある）
      if (next && next !== current) a.setAttribute('href', next);
    }
  };

  // ============================================================
  // Amazonアソシエイト 開示表記（運営規約 第5項により必須）
  // ============================================================
  const Disclosure = {
    init() {
      if (!CONFIG.associateTag || !CONFIG.disclosureText) return;
      try {
        // 二重表示防止（JS挿入済み / HTML側に既に記載あり）
        if (document.querySelector('[data-clg-associate-disclosure]')) return;
        const bodyText = document.body ? (document.body.textContent || '') : '';
        if (bodyText.indexOf('適格販売により収入を得') !== -1) return;

        const el = document.createElement('div');
        el.setAttribute('data-clg-associate-disclosure', '1');
        el.textContent = CONFIG.disclosureText;
        // margin-bottom は下部固定バー（.sticky-cart 等）との緩衝。
        // body 側に padding-bottom が用意されているページでも余裕が薄いため上乗せする。
        el.style.cssText = 'padding:14px 16px;margin-bottom:16px;text-align:center;font-size:12px;'
          + 'line-height:1.7;color:#555;background:#f7f7f5;border-top:1px solid #e5e5e0;';

        const footer = document.querySelector('footer');
        if (footer && footer.parentNode) {
          footer.parentNode.insertBefore(el, footer.nextSibling);
        } else {
          document.body.appendChild(el);
        }
      } catch(e) { /* noop */ }
    }
  };

  // ============================================================
  // 自社サイト購入トラッキング
  // ============================================================
  const PurchaseTracker = {
    /**
     * Stripe Checkout 完了後に呼び出す
     * URLにsession_id=がある場合は購入完了ページ
     */
    init(channelData) {
      const params = new URLSearchParams(window.location.search);

      // Stripe checkout success の検出
      // members-catalog.html?ok=1 または session_id パラメータ
      if (params.get('ok') === '1' || params.get('session_id') || params.get('payment_status') === 'success') {
        const purchaseData = {
          channel:      channelData.channel,
          detail:       channelData.detail,
          utm_source:   channelData.utm_source,
          utm_campaign: channelData.utm_campaign,
          page:         window.location.pathname,
          timestamp:    new Date().toISOString(),
          session_id:   params.get('session_id') || ''
        };

        // GA4 purchase イベント
        Analytics.send(CONFIG.events.purchaseOwn, {
          event_category: 'conversion',
          event_label:    'own_site_purchase',
          channel:        purchaseData.channel,
          utm_source:     purchaseData.utm_source || '',
          utm_campaign:   purchaseData.utm_campaign || ''
        });

        // ローカルに保存（AMCアップロード用に蓄積）
        this.savePurchase(purchaseData);
      }
    },

    savePurchase(data) {
      try {
        const key = 'clg_purchases';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(data);
        // 最新100件まで保持
        if (existing.length > 100) existing.splice(0, existing.length - 100);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch(e) { /* quota exceeded */ }
    }
  };

  // ============================================================
  // LINE遷移トラッキング
  // ============================================================
  const LineTracker = {
    init(channelData) {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="lin.ee"], a[href*="line.me"], a[href*="liff.line.me"]');
        if (!link) return;

        Analytics.sendWithSource('click_line', {
          event_category: 'outbound',
          link_url:       link.href,
          page_path:      window.location.pathname
        });
      });
    }
  };

  // ============================================================
  // 初期化
  // ============================================================
  function init() {
    // 1. チャネル判定
    const channelData = ChannelDetector.detect();

    // 2. GA4グローバルパラメータに流入元を設定（全イベントに自動付与）
    Analytics.setGlobalSourceParams();

    // 3. チャネル検出イベント送信（初回訪問時のみ）
    if (!sessionStorage.getItem('clg_channel_sent')) {
      Analytics.send(CONFIG.events.channelDetect, {
        channel:      channelData.channel,
        utm_source:   channelData.utm_source || '',
        utm_medium:   channelData.utm_medium || '',
        utm_campaign: channelData.utm_campaign || '',
        landing_page: channelData.landing_page
      });
      sessionStorage.setItem('clg_channel_sent', '1');
    }

    // 4. Amazonリンクトラッキング
    //    href の書き換えが主、クリック時の付与は書き換えが間に合わなかった場合の保険
    LinkRewriter.init(channelData);
    AmazonTracker.init(channelData);

    // 5. 購入トラッキング
    PurchaseTracker.init(channelData);

    // 6. LINE遷移トラッキング
    LineTracker.init(channelData);

    // 7. アソシエイト開示表記の挿入（規約第5項）
    Disclosure.init();

    if (CONFIG.debug) {
      console.log('[CLG Track] Initialized', channelData);
    }
  }

  // DOM Ready で初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 外部からアクセス可能にする（Stripe完了コールバック等で使用）
  window.CLGTracking = {
    getChannel: () => ChannelDetector.getChannel(),
    getChannelData: () => ChannelDetector.getSaved(),
    trackPurchase: (data) => PurchaseTracker.savePurchase(data),
    // 検証用: リンク書き換え結果と設置場所の判定を外から確認できるようにする
    previewUrl: (url, channel) => AmazonTracker.addTrackingParams(url, channel || ChannelDetector.getChannel()),
    detectPlacement: (el) => AmazonTracker.detectPlacement(el),
    config: CONFIG
  };

  // グローバルヘルパー: 流入元付きGA4イベント送信
  // shop.html内のga4Event等から呼び出し可能
  window.ga4EventWithSource = function(eventName, params) {
    Analytics.sendWithSource(eventName, params);
  };

})();
