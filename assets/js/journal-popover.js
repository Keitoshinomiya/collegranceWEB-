/* =========================================================================
   関連ジャーナル記事の動線（A-5 / A-8）
   実装 2026-05-01
   - 商品カードに data-product-id（=スラッグ） または data-product-slug が
     ついていれば、articles.js の journalArticles から relatedProducts を
     逆引きしてカード末尾（.p-body 内）に記事リンクを挿入する。
   - 1記事 → 直接遷移する英日二段見出し
   - 2記事以上 → カード内ポップオーバー（タップ／クリックで開閉）
   - 対応ページ：index.html (.product-card)、product-list.html (.product-card-simple)
   ========================================================================= */
(function initJournalPopover() {
    if (typeof window === 'undefined') return;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildSingle(article) {
        return (
            '<a class="journal-trigger" href="' + escapeHtml(article.link) + '">' +
                '<span class="en">Read the Story</span>' +
                '<span class="ja">この香りについての記事</span>' +
            '</a>'
        );
    }

    // ポップオーバー内サムネ用に Unsplash 画像 URL を小さく（w=120 q=70）置換する。
    // ローカル画像はそのまま返す。
    function thumbUrl(url) {
        if (!url) return '';
        if (/images\.unsplash\.com/.test(url)) {
            var u = url;
            u = u.replace(/([?&])w=\d+/, '$1w=120');
            u = u.replace(/([?&])q=\d+/, '$1q=70');
            return u;
        }
        return url;
    }

    function buildPopover(articles) {
        var items = articles.map(function (a) {
            var initials = (a.category || 'JOURNAL').slice(0, 3).toUpperCase();
            var thumb = a.image
                ? '<img src="' + escapeHtml(thumbUrl(a.image)) + '" loading="lazy" decoding="async" alt="">'
                : escapeHtml(initials);
            return (
                '<li>' +
                    '<a href="' + escapeHtml(a.link) + '">' +
                        '<span class="pop-thumb" aria-hidden="true">' + thumb + '</span>' +
                        '<span class="pop-meta">' +
                            '<span class="pop-cat">' + escapeHtml(a.category || 'Journal') + '</span>' +
                            '<span class="pop-name">' + escapeHtml(a.title) + '</span>' +
                        '</span>' +
                        '<span class="pop-arrow" aria-hidden="true">→</span>' +
                    '</a>' +
                '</li>'
            );
        }).join('');

        return (
            '<a class="journal-trigger" href="#" data-popover-toggle>' +
                '<span class="en">Read the Stories ' +
                    '<span class="count">(' + articles.length + ')</span>' +
                    '<span class="arrow" aria-hidden="true">▾</span>' +
                '</span>' +
                '<span class="ja">この香りに関する記事</span>' +
            '</a>' +
            '<div class="journal-popover" role="dialog" aria-label="関連記事">' +
                '<div class="pop-head">' +
                    '<span class="pop-title">Related Stories · 関連記事</span>' +
                    '<button type="button" class="pop-close" data-popover-close aria-label="閉じる">×</button>' +
                '</div>' +
                '<ul>' + items + '</ul>' +
            '</div>'
        );
    }

    function attachJournalLinks() {
        var articles = window.journalArticles;
        if (!articles || !articles.length) return;

        // 商品ID → 関連記事の逆引きマップ
        var byProduct = {};
        articles.forEach(function (a) {
            if (!a.relatedProducts || !a.relatedProducts.length) return;
            a.relatedProducts.forEach(function (pid) {
                if (!byProduct[pid]) byProduct[pid] = [];
                byProduct[pid].push(a);
            });
        });

        // 対象カード：product-list.html の .product-card-simple と
        //              index.html の .product-card[data-product-slug] 両対応
        var cards = document.querySelectorAll(
            '.product-card-simple[data-product-id], .product-card[data-product-slug]'
        );
        cards.forEach(function (card) {
            // 既に挿入済みなら何もしない（再走査時のためのガード）
            if (card.querySelector('.journal-stamp')) return;

            // スラッグの取得：data-product-slug を優先、なければ data-product-id
            var pid = card.getAttribute('data-product-slug')
                   || card.getAttribute('data-product-id');
            var matched = byProduct[pid];
            if (!matched || matched.length === 0) return;

            // 日付降順で最新順に
            matched = matched.slice().sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
            });

            var stamp = document.createElement('div');
            stamp.className = 'journal-stamp';
            if (matched.length === 1) {
                stamp.innerHTML = buildSingle(matched[0]);
            } else {
                stamp.classList.add('has-popover');
                stamp.innerHTML = buildPopover(matched);
            }
            // .p-body があれば内側、なければカード末尾に追加
            var target = card.querySelector('.p-body') || card;
            target.appendChild(stamp);
        });
    }

    // 親カードを取得（両クラス対応）
    function closestCard(el) {
        return el.closest('.product-card-simple, .product-card');
    }

    // body クラスを更新（モバイル時のバックドロップ用）
    function syncBodyClass() {
        var anyOpen = !!document.querySelector('.journal-stamp.open');
        document.body.classList.toggle('journal-popover-open', anyOpen);
    }

    // ポップオーバーをすべて閉じる
    function closeAllPopovers() {
        document.querySelectorAll('.journal-stamp.open').forEach(function (s) {
            s.classList.remove('open');
            var c = closestCard(s);
            if (c) c.classList.remove('journal-open');
        });
        syncBodyClass();
    }

    // ===== グローバルイベント（1度だけ登録） =====
    document.addEventListener('click', function (e) {
        var toggle = e.target.closest('[data-popover-toggle]');
        var close = e.target.closest('[data-popover-close]');
        if (toggle) {
            e.preventDefault();
            var stamp = toggle.closest('.journal-stamp');
            if (!stamp) return;
            var card = closestCard(stamp);
            var isOpen = stamp.classList.contains('open');
            closeAllPopovers();
            if (!isOpen) {
                stamp.classList.add('open');
                if (card) card.classList.add('journal-open');
                syncBodyClass();
            }
            return;
        }
        if (close) {
            e.stopPropagation();
            var stamp2 = close.closest('.journal-stamp');
            if (stamp2) {
                stamp2.classList.remove('open');
                var card2 = closestCard(stamp2);
                if (card2) card2.classList.remove('journal-open');
                syncBodyClass();
            }
            return;
        }
        // 外側クリックで閉じる（ポップオーバー内・トリガー以外）
        if (!e.target.closest('.journal-stamp') && !e.target.closest('[data-popover-toggle]')) {
            closeAllPopovers();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllPopovers();
    });

    // index.html はカードを JS で動的レンダリングするため、#grid の child 追加を監視。
    function watchGrid() {
        var grid = document.getElementById('grid');
        if (!grid) return;
        var observer = new MutationObserver(function () {
            attachJournalLinks();
        });
        observer.observe(grid, { childList: true });
    }

    function init() {
        attachJournalLinks();
        watchGrid();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
