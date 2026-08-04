#!/usr/bin/env python3
"""
COLLEGRANCE 在庫自動同期スクリプト（2026-08-04 作成）

メイクアップ社の価格リストメール（Gmail）を毎日チェックし、
新しいリストが届いていたら在庫・原価・売価を自動同期して本番デプロイする。

処理フロー:
  1. Gmail: yamamoto@makeup-inc.com の最新添付xlsxを取得（処理済みならスキップ）
  2. products.json 更新: inStock（在庫数>0）・cost（単価）を卸コード完全一致で反映
  3. 値付けルール適用: (売価-1500)×(1/1.1-3.6%-10%) ≧ cost+1100 を割る在庫商品を自動値上げ
     ※ PRICE_OVERRIDES（レイジー等の手動据置）は対象外
  4. catalog_full.json 同期（AI診断カタログ: 在庫なし削除・価格同期）
  5. 記事カード価格同期（article-*.html の pci-price）
  6. check-prices.py 検証 → エラーがあればpushせずSlack警告
  7. git commit + push（Netlify自動デプロイ）
  8. Slack #collegrance に結果レポート

実行: MacBook Air LaunchAgent com.keito.collegrance-stock-sync（毎日10:15）
手動: cd ~/GitHub/collegranceWEB- && python3 daily-stock-sync.py [--dry-run] [--file 価格リスト.xlsx]
"""
from __future__ import annotations
import os, sys, json, math, re, glob, pickle, base64, subprocess, tempfile, datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)

PRODUCTS_JSON = 'products.json'
CATALOG_JSON = 'catalog_full.json'
TOKEN_FILE = 'gmail_token.pickle'
STATE_FILE = '.stock_sync_state.json'
SENDER = 'yamamoto@makeup-inc.com'
SLACK_CHANNEL = 'C091LDC8MKN'

# === 値付けルール（2026-07-25 決定。check-prices.py と揃えること） ===
SHIP_COST = 1100
COUPON = 1500
FLOOR_RATE = 1 / 1.10 - 0.036 - 0.10
PRICE_OVERRIDES = {
    1: 14500,  # レイジーサンデーモーニング: Amazon実売に合わせる（2026-07-25 四宮決定）
}

DRY_RUN = '--dry-run' in sys.argv


def log(msg):
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def slack(text):
    token = ''
    cred = os.path.expanduser('~/.credentials/slack_bot.env')
    if os.path.exists(cred):
        for line in open(cred):
            m = re.match(r'^SLACK_BOT_TOKEN=["\']?([^"\']+)', line.strip())
            if m:
                token = m.group(1)
                break
    if not token:
        log(f"[Slack未送信] {text}")
        return
    import requests
    requests.post('https://slack.com/api/chat.postMessage',
                  json={'channel': SLACK_CHANNEL, 'text': text},
                  headers={'Authorization': f'Bearer {token}'}, timeout=15)


def get_latest_pricelist():
    """Gmailから最新の価格リストxlsxを取得。(message_id, xlsx_path, subject) or None"""
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = pickle.load(open(TOKEN_FILE, 'rb'))
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        pickle.dump(creds, open(TOKEN_FILE, 'wb'))
    svc = build('gmail', 'v1', credentials=creds)

    res = svc.users().messages().list(
        userId='me', q=f'from:{SENDER} has:attachment filename:xlsx',
        maxResults=5).execute()
    for m in res.get('messages', []):
        msg = svc.users().messages().get(userId='me', id=m['id']).execute()
        headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
        subject = headers.get('Subject', '')
        if '価格リスト' not in subject and '在庫' not in subject:
            continue
        for part in msg['payload'].get('parts', []):
            fn = part.get('filename', '')
            if not fn.endswith('.xlsx'):
                continue
            att_id = part['body'].get('attachmentId')
            if not att_id:
                continue
            att = svc.users().messages().attachments().get(
                userId='me', messageId=m['id'], id=att_id).execute()
            data = base64.urlsafe_b64decode(att['data'])
            path = os.path.join(tempfile.gettempdir(), fn)
            with open(path, 'wb') as f:
                f.write(data)
            return m['id'], path, subject
    return None


def parse_xlsx(path):
    """xlsx → {商品コード: (在庫数, 単価 or None)}"""
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    hdr = None
    result = {}
    for row in ws.iter_rows(values_only=True):
        if hdr is None:
            hdr = row
            idx = {n: i for i, n in enumerate(row) if n}
            if '商品コード' not in idx or '在庫数' not in idx:
                hdr = None
                continue
            continue
        code = row[idx['商品コード']]
        if not code:
            continue
        stock = row[idx['在庫数']]
        stock = int(stock) if isinstance(stock, (int, float)) else 0
        tanka = row[idx.get('単価（税抜）', -1)] if '単価（税抜）' in idx else None
        tanka = int(tanka) if isinstance(tanka, (int, float)) else None
        result[str(code).strip()] = (stock, tanka)
    return result


def floor_price(cost):
    """ルール充足に必要な最低売価（10円切上）"""
    return math.ceil(((cost + SHIP_COST) / FLOOR_RATE + COUPON) / 10) * 10


def main():
    # --file 指定でローカルxlsxを直接処理（手動リカバリ用）
    if '--file' in sys.argv:
        xlsx = sys.argv[sys.argv.index('--file') + 1]
        msg_id, subject = f'manual:{os.path.basename(xlsx)}', os.path.basename(xlsx)
    else:
        got = get_latest_pricelist()
        if not got:
            log('価格リストメールが見つかりません')
            return
        msg_id, xlsx, subject = got

    state = json.load(open(STATE_FILE)) if os.path.exists(STATE_FILE) else {}
    if state.get('last_message_id') == msg_id:
        log(f'処理済み ({subject}) — スキップ')
        return
    log(f'新しいリストを処理: {subject}')

    wholesale = parse_xlsx(xlsx)
    log(f'卸リスト {len(wholesale)}件')
    if len(wholesale) < 100:  # 壊れたファイル対策
        slack(f'⚠️ 在庫同期: 卸リストの件数が異常に少ない（{len(wholesale)}件）ため中止。ファイルを確認してください: {subject}')
        return

    products = json.load(open(PRODUCTS_JSON))
    stock_off, stock_on, cost_upd, repriced, missing = [], [], 0, [], []

    for p in products:
        if p.get('source') != 'wholesale':
            continue
        code = (p.get('wholesaleCode') or '').strip()
        name = f"{p.get('brand','')} {p.get('nameJa') or p.get('name')} {p.get('size','')}"
        if code not in wholesale:
            if p.get('inStock'):
                p['inStock'] = False
                stock_off.append(name + '（リスト外）')
            missing.append(code)
            continue
        stock, tanka = wholesale[code]
        if tanka is not None and tanka != p.get('cost'):
            p['cost'] = tanka
            cost_upd += 1
        new_in = stock > 0
        if p.get('inStock') and not new_in:
            p['inStock'] = False
            stock_off.append(name)
        elif not p.get('inStock') and new_in:
            p['inStock'] = True
            stock_on.append(name)

    # 値付けルール適用（在庫ありのみ・手動据置は除外）
    for p in products:
        if not p.get('inStock'):
            continue
        sell, cost = p.get('sellPrice'), p.get('cost')
        if not sell or not cost:
            continue
        if p['id'] in PRICE_OVERRIDES:
            continue
        if (sell - COUPON) * FLOOR_RATE < cost + SHIP_COST:
            new = floor_price(cost)
            repriced.append(f"{p.get('brand','')} {p.get('nameJa') or p.get('name')} {p.get('size','')} ¥{sell:,}→¥{new:,}")
            p['sellPrice'] = new

    changed = bool(stock_off or stock_on or cost_upd or repriced)
    if not changed:
        log('変更なし')
        if not DRY_RUN:
            json.dump({'last_message_id': msg_id, 'processed_at': datetime.datetime.now().isoformat()},
                      open(STATE_FILE, 'w'))
        return

    if DRY_RUN:
        log(f'[dry-run] 在庫OFF{len(stock_off)} ON{len(stock_on)} 原価{cost_upd} 値上げ{len(repriced)}')
        for r in repriced:
            log('  ' + r)
        return

    json.dump(products, open(PRODUCTS_JSON, 'w'), ensure_ascii=False, indent=2)

    # catalog_full.json 同期
    catalog = json.load(open(CATALOG_JSON))
    pmap = {p['id']: p for p in products}
    instock_ids = set(p['id'] for p in products if p.get('inStock') != False)
    before = len(catalog)
    catalog = [c for c in catalog if not c.get('productsJsonId') or c['productsJsonId'] in instock_ids]
    cat_removed = before - len(catalog)
    cat_ids = set(c.get('productsJsonId') for c in catalog if c.get('productsJsonId'))
    cat_added = 0
    for p in products:
        if p.get('inStock') == False or p['id'] in cat_ids:
            continue
        catalog.append({
            'code': f'P_{p["id"]}', 'brand': p['brand'], 'brandEn': p['brand'],
            'name': p.get('nameJa', p['name']), 'nameEn': p['name'],
            'spec': p.get('concentration', ''), 'size': p['size'], 'gender': '',
            'cost': p['cost'], 'sellPrice': p['sellPrice'],
            'notes': p.get('notes', ''), 'description': '',
            'existsInProductsJson': True, 'productsJsonId': p['id'],
        })
        cat_added += 1
    for c in catalog:
        pid = c.get('productsJsonId')
        if pid in pmap:
            c['sellPrice'] = pmap[pid]['sellPrice']
            c['cost'] = pmap[pid].get('cost')
    json.dump(catalog, open(CATALOG_JSON, 'w'), ensure_ascii=False, indent=2)

    # 記事カード価格同期
    price_map = {p['id']: p['sellPrice'] for p in products if p.get('sellPrice')}
    pat = re.compile(r'(<div class="pci-price">フルボトル ¥)([\d,]+)'
                     r'((?:[^<]|<(?!/div>))*</div>\s*<div class="pci-btns">\s*<a href="/\?product=(\d+)")')
    art_updates = 0
    for f in glob.glob('article-*.html'):
        html = open(f).read()
        n = [0]

        def repl(m):
            pid = int(m.group(4))
            if pid in price_map:
                newp = f'{price_map[pid]:,}'
                if m.group(2) != newp:
                    n[0] += 1
                    return m.group(1) + newp + m.group(3)
            return m.group(0)

        out = pat.sub(repl, html)
        if n[0]:
            open(f, 'w').write(out)
            art_updates += n[0]

    # 検証
    check = subprocess.run(['python3', 'check-prices.py'], capture_output=True, text=True, timeout=120)
    has_error = '❌ エラー' in check.stdout and 'エラーなし' not in check.stdout

    if has_error:
        err_tail = check.stdout[-800:]
        slack(f'🚨 在庫同期（{subject}）: 価格チェックにエラーがあるためデプロイを中止しました。手動確認が必要です。\n```{err_tail}```')
        subprocess.run(['git', 'checkout', '--', PRODUCTS_JSON, CATALOG_JSON] + glob.glob('article-*.html'))
        return

    # デプロイ
    subprocess.run(['git', 'add', PRODUCTS_JSON, CATALOG_JSON] + glob.glob('article-*.html'), check=True)
    body = (f'在庫自動同期: {subject}\n\n'
            f'- 在庫切れ{len(stock_off)}件 / 入荷{len(stock_on)}件 / 原価更新{cost_upd}件 / ルール値上げ{len(repriced)}件\n\n'
            f'Auto-generated by daily-stock-sync.py')
    subprocess.run(['git', 'commit', '-m', body], check=True)
    push = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)
    if push.returncode != 0:
        slack(f'🚨 在庫同期: git pushに失敗しました。\n```{push.stderr[-400:]}```')
        return

    json.dump({'last_message_id': msg_id, 'processed_at': datetime.datetime.now().isoformat()},
              open(STATE_FILE, 'w'))

    lines = [f'📦 在庫自動同期 完了（{subject}）',
             f'・在庫切れ: {len(stock_off)}件 / 入荷: {len(stock_on)}件',
             f'・原価更新: {cost_upd}件 / カタログ: -{cat_removed}/+{cat_added} / 記事: {art_updates}カ所']
    if repriced:
        lines.append(f'・値付けルール自動値上げ: {len(repriced)}件')
        lines += ['　- ' + r for r in repriced[:10]]
        if len(repriced) > 10:
            lines.append(f'　…ほか{len(repriced) - 10}件')
    if stock_on:
        lines.append('・入荷: ' + ' / '.join(stock_on[:5]) + ('…' if len(stock_on) > 5 else ''))
    slack('\n'.join(lines))
    log('完了')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        slack(f'🚨 在庫自動同期がエラーで停止しました: {e}')
        sys.exit(1)
