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
    // Amazon Attribution タグ（チャネル別）
    // ※ Amazon Ads コンソールでタグ発行後にここに設定
    // タグ未設定の場合はUTMパラメータで代替トラッキング
    attributionTags: {
      website:   '', // 自社サイト内リンク（デフォルト）
      line:      '', // LINE配信からの流入
      tiktok:    '', // TikTok投稿からの流入
      instagram: '', // Instagram投稿からの流入
      blog:      '', // ブログ記事内リンク
      direct:    '', // 直接流入
      other:     ''  // その他
    },

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

        // GA4イベント送信
        Analytics.send(CONFIG.events.amazonClick, {
          event_category: 'outbound',
          event_label:    asin || href,
          channel:        channel,
          utm_source:     channelData.utm_source || '',
          utm_campaign:   channelData.utm_campaign || '',
          page_path:      page,
          link_url:       href,
          link_text:      link.textContent.trim().substring(0, 50)
        });

        // Attribution タグ付与
        const taggedUrl = this.addAttributionTag(href, channel);
        if (taggedUrl !== href) {
          e.preventDefault();
          window.open(taggedUrl, link.target || '_blank');
        }
      });
    },

    extractASIN(url) {
      const match = url.match(/\/dp\/([A-Z0-9]{10})/);
      return match ? match[1] : null;
    },

    /**
     * AmazonリンクにAttributionタグを付与
     * タグが設定されていない場合はUTMベースのref parameterを追加
     */
    addAttributionTag(url, channel) {
      try {
        const u = new URL(url);

        // Attribution タグがある場合はそれを使用
        const tag = CONFIG.attributionTags[channel] || CONFIG.attributionTags.website;
        if (tag) {
          u.searchParams.set('maas', tag);
          return u.toString();
        }

        // タグ未設定の場合: refパラメータでチャネルを記録
        // （Amazon Attribution API承認後に正式タグに置換）
        u.searchParams.set('ref', `clg_${channel}`);
        return u.toString();
      } catch(e) {
        return url;
      }
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
    AmazonTracker.init(channelData);

    // 5. 購入トラッキング
    PurchaseTracker.init(channelData);

    // 6. LINE遷移トラッキング
    LineTracker.init(channelData);

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
    config: CONFIG
  };

  // グローバルヘルパー: 流入元付きGA4イベント送信
  // shop.html内のga4Event等から呼び出し可能
  window.ga4EventWithSource = function(eventName, params) {
    Analytics.sendWithSource(eventName, params);
  };

})();
