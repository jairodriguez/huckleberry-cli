#!/usr/bin/env python3
"""Content Repost Scanner: Reads analytics snapshots and identifies repost candidates."""
import json
import sys
import os
from datetime import datetime, timedelta

def load_snapshot(path):
    with open(path) as f:
        return json.load(f)

def calc_weighted_engagement(post):
    return post.get('likes', 0) + 2 * post.get('replies', 0) + 2 * post.get('reposts', 0)

def classify_evergreen(post):
    tag = post.get('pain_angle', post.get('tag', '')).lower()
    trending_tags = {'market_signal', 'market_news'}
    evergreen_tags = {
        'tool_overload', 'manual_loops', 'founder_router', 'unfinished_workflow',
        'proof_test', 'context_bloat', 'template_confusion', 'expensive_mistake',
        'vertical_law', 'vertical_real_estate', 'agent_lifestyle', 'contrarian',
        'pain_pill', 'first_person',
    }
    if tag in trending_tags:
        return False
    if tag in evergreen_tags:
        return True
    return 'evergreen' in tag

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--business', required=True, help='Brand slug')
    parser.add_argument('--snapshot', help='Path to analytics snapshot JSON')
    parser.add_argument('--output', help='Output queue file path')
    args = parser.parse_args()

    business = args.business
    base = f'businesses/{business}'

    snapshot_path = args.snapshot or f'{base}/analytics/snapshots/latest-x-metrics.json'
    if not os.path.exists(snapshot_path):
        print(f'No snapshot found at {snapshot_path}')
        sys.exit(0)

    snapshot = load_snapshot(snapshot_path)
    posts = snapshot if isinstance(snapshot, list) else snapshot.get('posts', [])

    if not posts:
        print('No posts in snapshot')
        return

    engagements = [calc_weighted_engagement(p) for p in posts]
    median = sorted(engagements)[len(engagements) // 2] if engagements else 0

    candidates = []
    for post in posts:
        ew = calc_weighted_engagement(post)
        ratio = ew / median if median > 0 else 0
        if not classify_evergreen(post):
            continue
        post_date = post.get('date', post.get('created_at', ''))
        if post_date:
            try:
                pd = datetime.fromisoformat(post_date.replace('Z', '+00:00'))
                days_ago = (datetime.now().astimezone() - pd).days
            except:
                days_ago = 999
        else:
            days_ago = 999

        candidates.append({
            'url': post.get('url', ''),
            'platform': post.get('platform', 'X'),
            'pain': post.get('pain_angle', post.get('tag', 'unknown')),
            'pattern': post.get('hook_pattern', 'unknown'),
            'engagement': ew,
            'ratio': round(ratio, 1),
            'age_days': days_ago,
            'eligible_after': days_ago,
        })

    candidates.sort(key=lambda c: c['engagement'], reverse=True)

    tier1 = [c for c in candidates if c['ratio'] >= 3]
    tier2 = [c for c in candidates if c['ratio'] >= 2 and c not in tier1]
    tier3 = [c for c in candidates if c['ratio'] >= 1.5 and c not in tier1 and c not in tier2]

    output_lines = [f'# Repost Queue — {business}', '']
    output_lines.append(f'> Last updated: {datetime.now().strftime("%Y-%m-%d")}')
    output_lines.append(f'> Median engagement: {median}')
    output_lines.append('')

    if tier1:
        output_lines.append('## Tier 1 — Bangers (≥ 3x median)')
        output_lines.append('| URL | Platform | Pain | Pattern | Engagement | Ratio | Age (days) | Eligible | Status |')
        output_lines.append('|---|---|---|---:|---:|---:|---|---|')
        for c in tier1:
            eligible_on = (datetime.now() + timedelta(days=max(0, 30 - c['age_days']))).strftime('%Y-%m-%d')
            output_lines.append(f"| {c['url']} | {c['platform']} | {c['pain']} | {c['pattern']} | {c['engagement']} | {c['ratio']}x | {c['age_days']} | {eligible_on} | queued |")
        output_lines.append('')

    if tier2:
        output_lines.append('## Tier 2 — Solid (≥ 2x median)')
        output_lines.append('| URL | Platform | Pain | Pattern | Engagement | Ratio | Age (days) | Eligible | Status |')
        output_lines.append('|---|---|---|---:|---:|---:|---|---|')
        for c in tier2:
            output_lines.append(f"| {c['url']} | {c['platform']} | {c['pain']} | {c['pattern']} | {c['engagement']} | {c['ratio']}x | {c['age_days']} | — | queued |")
        output_lines.append('')

    if tier3:
        output_lines.append('## Tier 3 — Cross-Platform Candidates (≥ 1.5x median)')
        output_lines.append('| URL | Platform | Pain | Pattern | Engagement | Ratio | Adapt For | Status |')
        output_lines.append('|---|---|---|---:|---:|---|---|')
        for c in tier3:
            alt_platform = 'LinkedIn' if c['platform'] == 'X' else 'X'
            output_lines.append(f"| {c['url']} | {c['platform']} | {c['pain']} | {c['pattern']} | {c['engagement']} | {c['ratio']}x | {alt_platform} | candidate |")
        output_lines.append('')

    output = '\n'.join(output_lines)

    output_path = args.output or f'{base}/analytics/repost-queue.md'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(output)

    print(f'Repost queue written to {output_path}')
    print(f'Tier 1 (bangers): {len(tier1)}')
    print(f'Tier 2 (solid): {len(tier2)}')
    print(f'Tier 3 (cross-platform): {len(tier3)}')

if __name__ == '__main__':
    main()