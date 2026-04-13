#!/usr/bin/env python3
"""
COLLEGRANCE GA4 SNSレポート
  python3 sns-report.py --daily     # 日次レポート
  python3 sns-report.py --weekly    # 週次レポート
  python3 sns-report.py --monthly   # 月次レポート
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests

# ---------------------------------------------------------------------------
# GA4 Data API（パッケージがなくても落ちないように）
# ---------------------------------------------------------------------------
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Filter,
        FilterExpression,
        Metric,
        OrderBy,
        RunReportRequest,
    )
    GA4_AVAILABLE = True
except ImportError:
    GA4_AVAILABLE = False

# ---------------------------------------------------------------------------
# .env 読み込み（既存スクリプトと同じパターン）
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(SCRIPT_DIR, '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN', '')
SLACK_CHANNEL = 'C091LDC8MKN'

# GA4 設定
GA4_PROPERTY_ID = '375320029'
SERVICE_ACCOUNT_PATH = os.path.join(SCRIPT_DIR, 'ga4-service-account.json')
PROPERTY = f'properties/{GA4_PROPERTY_ID}'

# ---------------------------------------------------------------------------
# GA4 クライアント初期化
# ---------------------------------------------------------------------------
ga4_client: Optional[Any] = None
ga4_error: Optional[str] = None

if not GA4_AVAILABLE:
    ga4_error = 'google-analytics-data パッケージ未インストール'
elif not os.path.exists(SERVICE_ACCOUNT_PATH):
    ga4_error = 'GA4サービスアカウントJSON未設定'
else:
    try:
        ga4_client = BetaAnalyticsDataClient.from_service_account_json(SERVICE_ACCOUNT_PATH)
    except Exception as e:
        ga4_error = f'GA4クライアント初期化エラー: {e}'

# ---------------------------------------------------------------------------
# ユーティリティ
# ---------------------------------------------------------------------------

def _date_str(d: datetime) -> str:
    """YYYY-MM-DD"""
    return d.strftime('%Y-%m-%d')


def _run_report(
    date_ranges: List[Any],
    dimensions: List[str],
    metrics: List[str],
    dimension_filter: Optional[Any] = None,
    order_bys: Optional[List[Any]] = None,
    limit: int = 0,
) -> Optional[Any]:
    """GA4 Data API でレポートを取得。失敗時は None。"""
    if ga4_client is None:
        return None
    try:
        req = RunReportRequest(
            property=PROPERTY,
            date_ranges=date_ranges,
            dimensions=[Dimension(name=d) for d in dimensions],
            metrics=[Metric(name=m) for m in metrics],
            dimension_filter=dimension_filter,
            order_bys=order_bys or [],
            limit=limit if limit > 0 else 0,
        )
        return ga4_client.run_report(req)
    except Exception as e:
        print(f'[GA4 API エラー] {e}', file=sys.stderr)
        return None


def _rows_to_dict(response: Any) -> List[Dict[str, str]]:
    """GA4 レスポンスを [{dim0: val, dim1: val, metric0: val, ...}, ...] に変換"""
    if response is None:
        return []
    rows = []
    dim_headers = [h.name for h in response.dimension_headers]
    met_headers = [h.name for h in response.metric_headers]
    for row in response.rows:
        d: Dict[str, str] = {}
        for i, dv in enumerate(row.dimension_values):
            d[dim_headers[i]] = dv.value
        for i, mv in enumerate(row.metric_values):
            d[met_headers[i]] = mv.value
        rows.append(d)
    return rows


def _safe_int(val: str) -> int:
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


def _safe_float(val: str) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _pct_change(current: int, previous: int) -> str:
    if previous == 0:
        return '+∞%' if current > 0 else '±0%'
    change = (current - previous) / previous * 100
    sign = '+' if change >= 0 else ''
    return f'{sign}{change:.0f}%'


def _format_number(n: int) -> str:
    return f'{n:,}'


def _format_yen(n: int) -> str:
    return f'¥{n:,}'


# ---------------------------------------------------------------------------
# ソース分類
# ---------------------------------------------------------------------------

SOURCE_MAP = {
    'Threads': ['threads.net', 'l.threads.net'],
    'Instagram': ['instagram', 'l.instagram.com', 'ig', 'instagram.com'],
    'Google (自然検索)': ['google'],
    'Amazon': ['amazon', 'amazon.co.jp'],
    'LINE': ['line', 'line.me', 'liff.line.me'],
    'Direct': ['(direct)', '(none)'],
}


def _classify_source(source: str, medium: str) -> str:
    source_lower = source.lower()
    medium_lower = medium.lower()
    for label, keywords in SOURCE_MAP.items():
        for kw in keywords:
            if kw in source_lower:
                # Google は organic のみ
                if label == 'Google (自然検索)' and medium_lower not in ('organic', '(none)', ''):
                    continue
                return label
    if source_lower in ('(direct)', '(not set)') and medium_lower in ('(none)', '(not set)', ''):
        return 'Direct'
    return 'その他'


# ---------------------------------------------------------------------------
# ダミーデータ（GA4 未接続時のフォールバック）
# ---------------------------------------------------------------------------

def _dummy_source_sessions() -> Dict[str, int]:
    return {
        'Threads': 0,
        'Instagram': 0,
        'Google (自然検索)': 0,
        'Amazon': 0,
        'LINE': 0,
        'Direct': 0,
        'その他': 0,
    }


def _dummy_actions() -> Dict[str, int]:
    return {
        'ai_diagnosis_start': 0,
        'ai_diagnosis_complete': 0,
        'amazon_click': 0,
        'add_to_cart': 0,
        'purchase': 0,
        'purchase_revenue': 0,
    }


# ---------------------------------------------------------------------------
# データ取得関数
# ---------------------------------------------------------------------------

def _get_source_sessions(start: str, end: str) -> Dict[str, int]:
    """流入元別セッション数を取得"""
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)] if GA4_AVAILABLE else [],
        dimensions=['sessionSource', 'sessionMedium'],
        metrics=['sessions'],
    )
    rows = _rows_to_dict(resp)
    if not rows:
        return _dummy_source_sessions()

    result: Dict[str, int] = {}
    for row in rows:
        label = _classify_source(row.get('sessionSource', ''), row.get('sessionMedium', ''))
        result[label] = result.get(label, 0) + _safe_int(row.get('sessions', '0'))
    # 定義順でソート
    ordered: Dict[str, int] = {}
    for key in SOURCE_MAP:
        ordered[key] = result.get(key, 0)
    if 'その他' in result:
        ordered['その他'] = result['その他']
    return ordered


def _get_event_count(start: str, end: str, event_name: str) -> int:
    """特定イベントの発生回数"""
    if not GA4_AVAILABLE:
        return 0
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=['eventName'],
        metrics=['eventCount'],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name='eventName',
                string_filter=Filter.StringFilter(value=event_name),
            )
        ),
    )
    rows = _rows_to_dict(resp)
    for row in rows:
        if row.get('eventName') == event_name:
            return _safe_int(row.get('eventCount', '0'))
    return 0


def _get_actions(start: str, end: str) -> Dict[str, int]:
    """主要アクションの数値を取得"""
    events = [
        'ai_diagnosis_start',
        'ai_diagnosis_complete',
        'amazon_click',
        'add_to_cart',
        'purchase',
    ]
    if not GA4_AVAILABLE or ga4_client is None:
        return _dummy_actions()

    result: Dict[str, int] = {}
    # 一括取得
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=['eventName'],
        metrics=['eventCount'],
    )
    rows = _rows_to_dict(resp)
    event_map: Dict[str, int] = {}
    for row in rows:
        event_map[row.get('eventName', '')] = _safe_int(row.get('eventCount', '0'))

    for ev in events:
        result[ev] = event_map.get(ev, 0)

    # 購入金額（eコマース purchase_revenue）
    rev_resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[],
        metrics=['purchaseRevenue'],
    )
    rev_rows = _rows_to_dict(rev_resp)
    result['purchase_revenue'] = _safe_int(rev_rows[0].get('purchaseRevenue', '0')) if rev_rows else 0

    return result


def _get_top_pages(start: str, end: str, limit: int = 3) -> List[Tuple[str, int]]:
    """ページビューTOP N"""
    if not GA4_AVAILABLE:
        return []
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=['pageTitle'],
        metrics=['screenPageViews'],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name='screenPageViews'), desc=True)],
        limit=limit + 5,  # トップページ等を除外するために多めに取得
    )
    rows = _rows_to_dict(resp)
    results: List[Tuple[str, int]] = []
    skip_titles = {'(not set)', 'COLLEGRANCE', 'collegrance', ''}
    for row in rows:
        title = row.get('pageTitle', '')
        if title in skip_titles or title.lower().startswith('collegrance |'):
            # トップページスキップ（記事のみ抽出）
            pass
        # 記事ページのみ（shop/supportは除く）
        results.append((title, _safe_int(row.get('screenPageViews', '0'))))
        if len(results) >= limit:
            break
    return results


def _get_total_sessions(start: str, end: str) -> int:
    if not GA4_AVAILABLE:
        return 0
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[],
        metrics=['sessions'],
    )
    rows = _rows_to_dict(resp)
    return _safe_int(rows[0].get('sessions', '0')) if rows else 0


def _get_total_users(start: str, end: str) -> int:
    if not GA4_AVAILABLE:
        return 0
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[],
        metrics=['activeUsers'],
    )
    rows = _rows_to_dict(resp)
    return _safe_int(rows[0].get('activeUsers', '0')) if rows else 0


def _get_source_event_count(start: str, end: str, source_keywords: List[str], event_name: str) -> int:
    """特定ソースからの特定イベント数"""
    if not GA4_AVAILABLE:
        return 0
    # ソース別イベント取得
    resp = _run_report(
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=['sessionSource', 'eventName'],
        metrics=['eventCount'],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name='eventName',
                string_filter=Filter.StringFilter(value=event_name),
            )
        ),
    )
    rows = _rows_to_dict(resp)
    total = 0
    for row in rows:
        src = row.get('sessionSource', '').lower()
        if any(kw in src for kw in source_keywords):
            total += _safe_int(row.get('eventCount', '0'))
    return total


# ---------------------------------------------------------------------------
# レポート生成
# ---------------------------------------------------------------------------

def _build_daily_report() -> str:
    """日次レポート"""
    yesterday = datetime.now() - timedelta(days=1)
    day_before = yesterday - timedelta(days=1)
    date_label = yesterday.strftime('%Y-%m-%d')
    start = _date_str(yesterday)
    end = _date_str(yesterday)
    prev_start = _date_str(day_before)
    prev_end = _date_str(day_before)

    # データ取得
    sources = _get_source_sessions(start, end)
    prev_sources = _get_source_sessions(prev_start, prev_end)
    actions = _get_actions(start, end)
    top_pages = _get_top_pages(start, end, limit=3)

    # 完了率
    diag_start = actions.get('ai_diagnosis_start', 0)
    diag_complete = actions.get('ai_diagnosis_complete', 0)
    completion_rate = f'{diag_complete / diag_start * 100:.0f}%' if diag_start > 0 else '-'

    lines = [
        f'📊 COLLEGRANCE 日次レポート（{date_label}）',
        '',
    ]

    if ga4_error:
        lines.append(f'⚠️ {ga4_error}（ダミーデータ表示）')
        lines.append('')

    # 流入元別セッション
    lines.append('■ 流入元別セッション')
    for label, count in sources.items():
        prev = prev_sources.get(label, 0)
        change = _pct_change(count, prev)
        lines.append(f'  {label}: {count} ({change})')
    lines.append('')

    # 主要アクション
    lines.append('■ 主要アクション')
    lines.append(f'  AI診断開始: {actions.get("ai_diagnosis_start", 0)}回')
    lines.append(f'  AI診断完了: {actions.get("ai_diagnosis_complete", 0)}回（完了率 {completion_rate}）')
    lines.append(f'  Amazon遷移: {actions.get("amazon_click", 0)}回')
    lines.append(f'  カート追加: {actions.get("add_to_cart", 0)}回')
    lines.append(f'  購入: {actions.get("purchase", 0)}件（{_format_yen(actions.get("purchase_revenue", 0))}）')
    lines.append('')

    # 人気記事TOP3
    lines.append('■ 人気記事TOP3')
    if top_pages:
        for i, (title, pv) in enumerate(top_pages, 1):
            lines.append(f'  {i}. {title} - {pv} PV')
    else:
        lines.append('  データなし')

    return '\n'.join(lines)


def _build_weekly_report() -> str:
    """週次レポート"""
    today = datetime.now()
    end_date = today - timedelta(days=1)
    start_date = end_date - timedelta(days=6)
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=6)

    start = _date_str(start_date)
    end = _date_str(end_date)
    p_start = _date_str(prev_start)
    p_end = _date_str(prev_end)

    date_label = f'{start_date.strftime("%m/%d")}〜{end_date.strftime("%m/%d")}'

    # データ取得
    total_sessions = _get_total_sessions(start, end)
    prev_total = _get_total_sessions(p_start, p_end)
    sources = _get_source_sessions(start, end)
    prev_sources = _get_source_sessions(p_start, p_end)
    actions = _get_actions(start, end)
    total_users = _get_total_users(start, end)

    # SNS→診断完了
    threads_complete = _get_source_event_count(start, end, ['threads'], 'ai_diagnosis_complete')
    ig_complete = _get_source_event_count(start, end, ['instagram'], 'ai_diagnosis_complete')

    # ファネル計算
    diag_start = actions.get('ai_diagnosis_start', 0)
    diag_complete = actions.get('ai_diagnosis_complete', 0)
    amazon_click = actions.get('amazon_click', 0)
    add_to_cart = actions.get('add_to_cart', 0)

    visit_to_diag = f'{diag_start / total_sessions * 100:.1f}%' if total_sessions > 0 else '-'
    diag_to_complete = f'{diag_complete / diag_start * 100:.1f}%' if diag_start > 0 else '-'
    complete_to_amazon = f'{amazon_click / diag_complete * 100:.1f}%' if diag_complete > 0 else '-'
    complete_to_cart = f'{add_to_cart / diag_complete * 100:.1f}%' if diag_complete > 0 else '-'

    lines = [
        f'📈 COLLEGRANCE 週次レポート（{date_label}）',
        '',
    ]

    if ga4_error:
        lines.append(f'⚠️ {ga4_error}（ダミーデータ表示）')
        lines.append('')

    # 流入サマリー
    lines.append('■ 流入サマリー（前週比）')
    lines.append(f'  総セッション: {_format_number(total_sessions)} ({_pct_change(total_sessions, prev_total)})')
    for label in ['Threads', 'Instagram', 'Google (自然検索)']:
        cur = sources.get(label, 0)
        prev = prev_sources.get(label, 0)
        lines.append(f'  {label}経由: {cur} ({_pct_change(cur, prev)})')
    lines.append('')

    # ファネル分析
    lines.append('■ ファネル分析')
    lines.append(f'  サイト訪問 → AI診断開始: {visit_to_diag}')
    lines.append(f'  AI診断開始 → 診断完了: {diag_to_complete}')
    lines.append(f'  診断完了 → Amazon遷移: {complete_to_amazon}')
    lines.append(f'  診断完了 → カート追加: {complete_to_cart}')
    lines.append('')

    # SNS施策の効果
    lines.append('■ SNS施策の効果')
    lines.append(f'  Threads→診断完了: {threads_complete}件')
    lines.append(f'  Instagram→診断完了: {ig_complete}件')
    lines.append('')

    # アクション提案
    lines.append('■ 来週のアクション提案')
    suggestions = _generate_weekly_suggestions(sources, prev_sources, actions, total_sessions)
    for s in suggestions:
        lines.append(f'  ・{s}')

    return '\n'.join(lines)


def _build_monthly_report() -> str:
    """月次レポート"""
    today = datetime.now()
    end_date = today - timedelta(days=1)
    start_date = end_date - timedelta(days=29)
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=29)

    start = _date_str(start_date)
    end = _date_str(end_date)
    p_start = _date_str(prev_start)
    p_end = _date_str(prev_end)

    month_label = f'{end_date.strftime("%Y年%m月")}'

    # データ取得
    total_sessions = _get_total_sessions(start, end)
    prev_total = _get_total_sessions(p_start, p_end)
    total_users = _get_total_users(start, end)
    prev_users = _get_total_users(p_start, p_end)
    sources = _get_source_sessions(start, end)
    prev_sources = _get_source_sessions(p_start, p_end)
    actions = _get_actions(start, end)
    prev_actions = _get_actions(p_start, p_end)
    top_pages = _get_top_pages(start, end, limit=10)

    diag_complete = actions.get('ai_diagnosis_complete', 0)
    prev_diag_complete = prev_actions.get('ai_diagnosis_complete', 0)
    purchases = actions.get('purchase', 0)
    prev_purchases = prev_actions.get('purchase', 0)
    revenue = actions.get('purchase_revenue', 0)
    prev_revenue = prev_actions.get('purchase_revenue', 0)

    lines = [
        f'📋 COLLEGRANCE 月次レポート（{month_label}）',
        '',
    ]

    if ga4_error:
        lines.append(f'⚠️ {ga4_error}（ダミーデータ表示）')
        lines.append('')

    # 全体サマリー
    lines.append('■ 全体サマリー')
    lines.append(f'  総セッション: {_format_number(total_sessions)} (前月比 {_pct_change(total_sessions, prev_total)})')
    lines.append(f'  ユニークユーザー: {_format_number(total_users)} (前月比 {_pct_change(total_users, prev_users)})')
    lines.append(f'  AI診断完了: {_format_number(diag_complete)}件 (前月比 {_pct_change(diag_complete, prev_diag_complete)})')
    lines.append(f'  購入: {_format_number(purchases)}件（{_format_yen(revenue)}）(前月比 {_pct_change(purchases, prev_purchases)})')
    lines.append('')

    # チャネル別パフォーマンス
    lines.append('■ チャネル別パフォーマンス')
    lines.append(f'  {"チャネル":<18} {"セッション":>8} {"前月比":>8}')
    lines.append(f'  {"-" * 36}')
    for label in list(SOURCE_MAP.keys()) + ['その他']:
        cur = sources.get(label, 0)
        prev = prev_sources.get(label, 0)
        if cur == 0 and prev == 0:
            continue
        lines.append(f'  {label:<18} {cur:>8} {_pct_change(cur, prev):>8}')
    lines.append('')

    # 記事パフォーマンスTOP10
    lines.append('■ 記事パフォーマンスTOP10')
    if top_pages:
        for i, (title, pv) in enumerate(top_pages, 1):
            # タイトルが長い場合は切り詰め
            display_title = title[:40] + '...' if len(title) > 40 else title
            lines.append(f'  {i:>2}. {display_title} - {pv} PV')
    else:
        lines.append('  データなし')
    lines.append('')

    # 週ごと推移
    lines.append('■ 月間トレンド（週ごと）')
    for week_num in range(4):
        w_end = end_date - timedelta(days=week_num * 7)
        w_start = w_end - timedelta(days=6)
        if w_start < start_date:
            w_start = start_date
        w_sessions = _get_total_sessions(_date_str(w_start), _date_str(w_end))
        lines.append(f'  {w_start.strftime("%m/%d")}〜{w_end.strftime("%m/%d")}: {w_sessions} sessions')
    lines.append('')

    # 改善ポイント
    lines.append('■ 来月の改善ポイント')
    suggestions = _generate_monthly_suggestions(sources, prev_sources, actions, prev_actions, total_sessions)
    for s in suggestions:
        lines.append(f'  ・{s}')

    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# アクション提案ロジック
# ---------------------------------------------------------------------------

def _generate_weekly_suggestions(
    sources: Dict[str, int],
    prev_sources: Dict[str, int],
    actions: Dict[str, int],
    total_sessions: int,
) -> List[str]:
    suggestions: List[str] = []

    threads = sources.get('Threads', 0)
    prev_threads = prev_sources.get('Threads', 0)
    ig = sources.get('Instagram', 0)
    prev_ig = prev_sources.get('Instagram', 0)

    if threads > prev_threads and threads > 0:
        suggestions.append('Threads流入が伸びている。投稿頻度を維持し、診断リンクを入れた投稿を増やす')
    elif threads <= prev_threads:
        suggestions.append('Threads流入が停滞。新しい投稿フォーマット（Before/After、香りレビュー）を試す')

    if ig < prev_ig:
        suggestions.append('Instagram流入が減少。ストーリーズやリール投稿で診断への導線を強化する')

    diag_start = actions.get('ai_diagnosis_start', 0)
    diag_complete = actions.get('ai_diagnosis_complete', 0)
    if diag_start > 0 and diag_complete / diag_start < 0.5:
        suggestions.append('診断完了率が50%未満。質問数の削減やUX改善を検討')

    if total_sessions > 0 and diag_start / total_sessions < 0.1:
        suggestions.append('診断開始率が低い。CTAボタンの配置・文言を見直す')

    if not suggestions:
        suggestions.append('各チャネルの流入バランスを確認し、弱いチャネルのテコ入れを検討')

    return suggestions


def _generate_monthly_suggestions(
    sources: Dict[str, int],
    prev_sources: Dict[str, int],
    actions: Dict[str, int],
    prev_actions: Dict[str, int],
    total_sessions: int,
) -> List[str]:
    suggestions: List[str] = []

    google = sources.get('Google (自然検索)', 0)
    prev_google = prev_sources.get('Google (自然検索)', 0)
    if google < prev_google:
        suggestions.append('検索流入が前月比減少。SEO記事の追加やリライトを検討')
    elif google > prev_google * 1.2:
        suggestions.append('検索流入が伸びている。効果的なキーワードを分析して記事を拡充する')

    purchases = actions.get('purchase', 0)
    prev_purchases = prev_actions.get('purchase', 0)
    if purchases < prev_purchases:
        suggestions.append('購入件数が減少。カート放棄率の確認とリタゲ施策の導入を検討')

    diag_complete = actions.get('ai_diagnosis_complete', 0)
    if diag_complete > 0 and purchases > 0:
        cvr = purchases / diag_complete * 100
        if cvr < 5:
            suggestions.append(f'診断→購入CVRが{cvr:.1f}%。推薦精度向上やフルボトルCTAの改善を検討')

    total_sns = sources.get('Threads', 0) + sources.get('Instagram', 0)
    if total_sessions > 0 and total_sns / total_sessions > 0.5:
        suggestions.append('SNS依存度が高い。検索・LINE経由の流入チャネルを育てる')

    if not suggestions:
        suggestions.append('全体的に安定推移。新チャネル（TikTok、LINE配信）のテストを検討')

    return suggestions


# ---------------------------------------------------------------------------
# Slack 送信
# ---------------------------------------------------------------------------

def send_to_slack(text: str) -> bool:
    """Slackにテキストメッセージを送信"""
    if not SLACK_BOT_TOKEN:
        print('[Slack] SLACK_BOT_TOKEN が設定されていません', file=sys.stderr)
        return False
    resp = requests.post(
        'https://slack.com/api/chat.postMessage',
        json={
            'channel': SLACK_CHANNEL,
            'text': text,
        },
        headers={
            'Authorization': f'Bearer {SLACK_BOT_TOKEN}',
            'Content-Type': 'application/json',
        },
    )
    data = resp.json()
    if data.get('ok'):
        print(f'[Slack] 送信成功: {SLACK_CHANNEL}')
        return True
    else:
        print(f'[Slack] 送信失敗: {data.get("error", "unknown")}', file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# メイン
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description='COLLEGRANCE GA4 SNSレポート')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--daily', action='store_true', help='日次レポート')
    group.add_argument('--weekly', action='store_true', help='週次レポート')
    group.add_argument('--monthly', action='store_true', help='月次レポート')
    parser.add_argument('--dry-run', action='store_true', help='Slack送信せずに標準出力のみ')
    args = parser.parse_args()

    if args.daily:
        report = _build_daily_report()
    elif args.weekly:
        report = _build_weekly_report()
    elif args.monthly:
        report = _build_monthly_report()
    else:
        print('--daily, --weekly, --monthly のいずれかを指定してください')
        sys.exit(1)

    # 常に標準出力に表示
    print(report)
    print()

    # Slack送信
    if not args.dry_run:
        send_to_slack(report)
    else:
        print('[dry-run] Slack送信をスキップしました')


if __name__ == '__main__':
    main()
