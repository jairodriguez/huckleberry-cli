#!/usr/bin/env python3
"""
NLM Source Curation
Deep research finds web pages + documents, but pulls irrelevant stuff.
This module curates: cited-only import + relevance scoring + deletion of
below-threshold sources.

CLI:
  python3 nlm_curation.py curate --topic "..." --notebook <id> [--execute]
  python3 nlm_curation.py research --topic "..." --notebook <id> [--mode fast|deep] [--execute]
"""

import json
import re
import subprocess
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse

# Domain reputation: positive = authoritative, negative = aggregator/spam-prone
DOMAIN_SCORES = {
    # Strongly authoritative
    "arxiv.org": 1.0, "github.com": 0.9, "docs.python.org": 0.9,
    "developer.mozilla.org": 0.9, "stackoverflow.com": 0.7,
    "nature.com": 1.0, "sciencedirect.com": 0.9, "ieee.org": 0.9,
    "acm.org": 0.9, "springer.com": 0.8, "mit.edu": 0.9, "stanford.edu": 0.9,
    "google.com": 0.6, "openai.com": 0.8, "anthropic.com": 0.8,
    "deepmind.google": 0.8, "huggingface.co": 0.8, "aws.amazon.com": 0.8,
    "learn.microsoft.com": 0.8, "cloud.google.com": 0.8,
    "rust-lang.org": 0.9, "golang.org": 0.9, "python.org": 0.9,
    "postgrespro.com": 0.7, "postgresql.org": 0.9, "redis.io": 0.8,
    "kubernetes.io": 0.9, "docker.com": 0.8,
    # Neutral / content platforms
    "medium.com": 0.2, "substack.com": 0.3, "dev.to": 0.3,
    "freecodecamp.org": 0.4, "geeksforgeeks.org": 0.2,
    "towardsdatascience.com": 0.3, "realpython.com": 0.6,
    # Aggregators / low signal for deep expertise
    "pinterest.com": -0.8, "quora.com": -0.4, "reddit.com": 0.1,
    "linkedin.com": 0.0, "facebook.com": -0.6, "twitter.com": 0.0,
    "x.com": 0.0, "youtube.com": 0.2, "tiktok.com": -0.6,
    "wikipedia.org": 0.4,
}

# Title tokens that signal listicle/SEO-spam rather than expertise
SPAM_TITLE_PATTERNS = [
    r"\btop \d+\b", r"\bbest \d+\b", r"\b\d+ (tips|tricks|hacks|tools)\b",
    r"\byou won'?t believe\b", r"\bultimate guide\b", r"\bcomplete guide\b",
    r"\bcourse\b.*\b(only|free|discount)\b", r"\bcoupon\b", r"\bdeal\b",
    r"\bdownload (now|free)\b", r"\blogin\b", r"\bsign ?up\b",
]

STOPWORDS = {
    "the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "with",
    "how", "what", "why", "is", "are", "do", "does", "best", "way", "vs",
    "using", "use", "get", "your", "my",
}


def tokenize(text: str) -> set:
    words = re.findall(r"[a-z0-9+#.]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


class SourceCurator:
    """Scores NLM sources for relevance and prunes the irrelevant ones."""

    def __init__(self, topic: str, threshold: float = 0.35, min_sources: int = 5):
        self.topic = topic
        self.threshold = threshold
        self.min_sources = min_sources  # never prune below this many sources
        self.topic_tokens = tokenize(topic)
        self.report: List[Dict] = []

    def score_source(self, title: str, url: str) -> Dict:
        reasons = []
        score = 0.0

        # 1. Domain reputation
        domain = urlparse(url).netloc.lower().removeprefix("www.") if url else ""
        domain_score = 0.0
        for dom, s in DOMAIN_SCORES.items():
            if domain == dom or domain.endswith("." + dom):
                domain_score = s
                break
        score += domain_score
        if domain_score > 0:
            reasons.append(f"domain:{domain}(+{domain_score})")
        elif domain_score < 0:
            reasons.append(f"domain:{domain}({domain_score})")

        # 2. Topic-token overlap with title
        title_tokens = tokenize(title)
        if self.topic_tokens:
            overlap = len(title_tokens & self.topic_tokens) / len(self.topic_tokens)
            score += overlap * 1.2
            if overlap > 0:
                reasons.append(f"topic-overlap:{overlap:.2f}")

        # 3. Spam/listicle penalty
        title_lower = title.lower()
        for pat in SPAM_TITLE_PATTERNS:
            if re.search(pat, title_lower):
                score -= 0.5
                reasons.append(f"spam-pattern:{pat}")
                break

        return {"score": round(score, 2), "reasons": reasons, "domain": domain}

    def curate(self, notebook_id: str, execute: bool = False) -> Dict:
        """Score all sources in notebook; optionally delete below threshold."""
        sources = self._list_sources(notebook_id)
        if not sources:
            return {"error": "no sources found", "notebook_id": notebook_id}

        keep, prune = [], []
        for src in sources:
            title = src.get("title", "") or ""
            url = src.get("url", "") or ""
            scored = self.score_source(title, url)
            entry = {
                "id": src.get("id"),
                "title": title[:80],
                "url": url,
                **scored,
            }
            if scored["score"] >= self.threshold:
                keep.append(entry)
            else:
                prune.append(entry)

        # Protect floor: if pruning would drop below min_sources, keep the best
        if len(keep) < self.min_sources and prune:
            prune.sort(key=lambda e: e["score"], reverse=True)
            rescue = self.min_sources - len(keep)
            keep.extend(prune[:rescue])
            prune = prune[rescue:]

        deleted = []
        if execute and prune:
            for entry in prune:
                ok = self._delete_source(notebook_id, entry["id"])
                if ok:
                    deleted.append(entry["id"])

        result = {
            "notebook_id": notebook_id,
            "topic": self.topic,
            "threshold": self.threshold,
            "total_sources": len(sources),
            "kept": len(keep),
            "pruned": len(prune),
            "deleted": deleted if execute else [],
            "executed": execute,
            "keep": keep,
            "prune": prune,
            "timestamp": datetime.now().isoformat(),
        }
        self._save_report(result)
        return result

    def deep_research(self, notebook_id: str, mode: str = "fast",
                      timeout: int = 1800) -> Dict:
        """
        Run NLM deep research with cited-only import (first curation filter),
        then post-import relevance curation.
        """
        steps = {}

        # Step 1: start research (non-blocking)
        r = subprocess.run(
            ["notebooklm", "source", "add-research", self.topic,
             "--mode", mode, "--no-wait", "--json", "-n", notebook_id],
            capture_output=True, text=True, timeout=120,
        )
        if r.returncode != 0:
            return {"error": f"add-research failed: {r.stderr[:500]}", **steps}
        steps["research_started"] = True

        # Step 2: wait + import cited-only (import-time curation)
        r = subprocess.run(
            ["notebooklm", "research", "wait", "-n", notebook_id,
             "--import-all", "--cited-only", "--timeout", str(timeout), "--json"],
            capture_output=True, text=True, timeout=timeout + 120,
        )
        steps["research_wait_rc"] = r.returncode
        try:
            steps["research_output"] = json.loads(r.stdout) if r.stdout.strip() else {}
        except json.JSONDecodeError:
            steps["research_output"] = {"raw": r.stdout[:500]}

        return steps

    def _list_sources(self, notebook_id: str) -> List[Dict]:
        r = subprocess.run(
            ["notebooklm", "source", "list", "-n", notebook_id, "--json"],
            capture_output=True, text=True, timeout=60,
        )
        if r.returncode != 0:
            return []
        try:
            return json.loads(r.stdout).get("sources", [])
        except json.JSONDecodeError:
            return []

    def _delete_source(self, notebook_id: str, source_id: str) -> bool:
        r = subprocess.run(
            ["notebooklm", "source", "delete", source_id,
             "-n", notebook_id, "--yes", "--json"],
            capture_output=True, text=True, timeout=60,
        )
        return r.returncode == 0

    def _save_report(self, result: Dict):
        report_dir = Path.home() / "clawd" / "memory" / "curation-reports"
        report_dir.mkdir(parents=True, exist_ok=True)
        slug = re.sub(r"[^a-z0-9]+", "-", self.topic.lower())[:40].strip("-")
        path = report_dir / f"{datetime.now().date()}-{slug}.json"
        with open(path, "w") as f:
            json.dump(result, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="NLM source curation")
    sub = parser.add_subparsers(dest="command", required=True)

    p_cur = sub.add_parser("curate", help="Score + prune existing sources")
    p_cur.add_argument("--topic", required=True)
    p_cur.add_argument("--notebook", required=True)
    p_cur.add_argument("--execute", action="store_true",
                       help="Actually delete below-threshold sources (default: report only)")
    p_cur.add_argument("--threshold", type=float, default=0.35)

    p_res = sub.add_parser("research", help="Deep research + cited-only import + curate")
    p_res.add_argument("--topic", required=True)
    p_res.add_argument("--notebook", required=True)
    p_res.add_argument("--mode", choices=["fast", "deep"], default="deep")
    p_res.add_argument("--execute", action="store_true")
    p_res.add_argument("--timeout", type=int, default=1800)

    args = parser.parse_args()
    curator = SourceCurator(args.topic, threshold=args.threshold)

    if args.command == "curate":
        result = curator.curate(args.notebook, execute=args.execute)
    else:
        result = curator.deep_research(args.notebook, mode=args.mode,
                                       timeout=args.timeout)
        curation = curator.curate(args.notebook, execute=args.execute)
        result["curation"] = {k: curation[k] for k in
                              ("total_sources", "kept", "pruned", "executed")}

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()