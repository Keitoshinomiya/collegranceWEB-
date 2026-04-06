#!/usr/bin/env python3
"""
商品価格の3重チェック — 在庫更新後に必ず実行
  python check-prices.py
"""
import json, math, re
from collections import defaultdict

MARGIN = 1.25
TAX = 1.10

with open('products.json') as f:
    products = json.load(f)

instock = [x for x in products if x.get('inStock') != False]
errors = []

# CHECK 1: sellPrice = cost × 1.25 × 1.10 (10円切上)
for x in instock:
    expected = math.ceil(x['cost'] * MARGIN * TAX / 10) * 10
    if x['sellPrice'] != expected:
        errors.append(f"[計算] id={x['id']} {x['brand']} {x['name']} cost=¥{x['cost']} 計算=¥{expected} 実際=¥{x['sellPrice']}")

# CHECK 2: 同一商品の大サイズが小サイズより安くないか
groups = defaultdict(list)
for x in instock:
    base = x['name'].split(' (')[0].split(' 【')[0].replace('NEW','').replace('旧 ','').strip()
    groups[(x['brand'], base)].append(x)

for key, items in groups.items():
    if len(items) < 2: continue
    def get_ml(item):
        m = re.search(r'(\d+)', item['size'])
        return int(m.group(1)) if m else 0
    sorted_items = sorted(items, key=get_ml)
    for i in range(len(sorted_items) - 1):
        a, b = sorted_items[i], sorted_items[i+1]
        if get_ml(b) > get_ml(a) > 0 and b['sellPrice'] < a['sellPrice']:
            errors.append(f"[サイズ逆転] {a['brand']} {a['name']} {a['size']}=¥{a['sellPrice']} > {b['size']}=¥{b['sellPrice']}")

# CHECK 3: 異常価格（¥1,000未満 or ¥60,000超）
for x in instock:
    if x['sellPrice'] < 1000:
        errors.append(f"[安すぎ] id={x['id']} {x['brand']} {x['name']} ¥{x['sellPrice']}")
    if x['sellPrice'] > 60000:
        errors.append(f"[高すぎ] id={x['id']} {x['brand']} {x['name']} ¥{x['sellPrice']}")

# CHECK 4: concentration(濃度)が全商品にあるか
for x in instock:
    if not x.get('concentration'):
        errors.append(f"[濃度なし] id={x['id']} {x['brand']} {x['name']}")

# CHECK 5: 同一商品・同サイズで価格が違わないか
for key, items in groups.items():
    for i in range(len(items)):
        for j in range(i+1, len(items)):
            a, b = items[i], items[j]
            if a['size'].lower().replace('ml','') == b['size'].lower().replace('ml','') and a.get('concentration','') == b.get('concentration','') and a['sellPrice'] != b['sellPrice']:
                errors.append(f"[同サイズ同濃度で価格不一致] id={a['id']} vs id={b['id']} {a['brand']} {a['name'][:20]} {a['size']} ¥{a['sellPrice']} vs ¥{b['sellPrice']}")

# Result
print(f"=== 価格チェック（{len(instock)}商品） ===\n")
if errors:
    for e in errors:
        print(f"  ✗ {e}")
    print(f"\n{len(errors)}件のエラー")
else:
    print("  ✓ 全チェック合格（計算・サイズ整合・価格範囲・濃度・重複）")
