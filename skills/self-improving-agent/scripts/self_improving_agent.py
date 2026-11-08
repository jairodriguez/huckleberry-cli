#!/usr/bin/env python3
"""
Self-Improving Agent - Expertise Gap Detector & Research Pipeline
Entry point for detecting knowledge gaps and triggering autonomous learning.
"""

import json
import os
import sys
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import hashlib

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

class ExpertiseGapDetector:
    """Detects when an agent lacks expertise on a topic."""
    
    def __init__(self, agent_name: str = "clawd"):
        self.agent_name = agent_name
        self.registry_path = PROJECT_ROOT / "memory" / "agent-expertise-registry.json"
        self.registry = self._load_registry()
        
    def _load_registry(self) -> Dict:
        """Load or create expertise registry."""
        if self.registry_path.exists():
            with open(self.registry_path) as f:
                return json.load(f)
        return {}
    
    def _save_registry(self):
        """Save expertise registry."""
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def _topic_slug(self, topic: str) -> str:
        """Convert topic to filesystem-safe slug."""
        return hashlib.md5(topic.lower().encode()).hexdigest()[:12]
    
    def check_expertise(self, topic: str) -> Dict[str, Any]:
        """
        Check if agent has expertise on topic.
        Returns dict with has_expertise, confidence, details.
        """
        slug = self._topic_slug(topic)
        agent_registry = self.registry.get(self.agent_name, {})
        topic_data = agent_registry.get(slug, {})
        
        confidence = topic_data.get("confidence", 0.0)
        has_expertise = confidence >= 0.7
        
        # Also check Inkstone for existing knowledge
        inkstone_check = self._check_inkstone(topic, slug)
        
        return {
            "topic": topic,
            "slug": slug,
            "has_expertise": has_expertise or inkstone_check["has_content"],
            "confidence": max(confidence, inkstone_check["confidence"]),
            "registry_data": topic_data,
            "inkstone_data": inkstone_check,
            "needs_research": not (has_expertise or inkstone_check["has_content"])
        }
    
    def _check_inkstone(self, topic: str, slug: str) -> Dict[str, Any]:
        """Check Inkstone for existing expertise content."""
        # This would call inkstone_memory_search in practice
        # For now, return placeholder
        namespace = f"/business/aiwithjai/agents/{self.agent_name}/expertise/{slug}"
        return {
            "has_content": False,  # Would be determined by actual search
            "confidence": 0.0,
            "namespace": namespace
        }
    
    def register_expertise(self, topic: str, confidence: float, notebook_id: str, 
                          source_count: int, topics_mastered: List[str]):
        """Register new expertise in registry."""
        slug = self._topic_slug(topic)
        
        if self.agent_name not in self.registry:
            self.registry[self.agent_name] = {}
            
        self.registry[self.agent_name][slug] = {
            "topic": topic,
            "confidence": confidence,
            "last_researched": datetime.now().isoformat(),
            "notebook_id": notebook_id,
            "source_count": source_count,
            "topics_mastered": topics_mastered
        }
        
        self._save_registry()
        return slug
    
    def get_expertise_status(self, topic: Optional[str] = None) -> Dict:
        """Get expertise status for topic or all topics."""
        agent_registry = self.registry.get(self.agent_name, {})
        
        if topic:
            slug = self._topic_slug(topic)
            return agent_registry.get(slug, {"topic": topic, "found": False})
        
        return {
            "agent": self.agent_name,
            "total_topics": len(agent_registry),
            "topics": list(agent_registry.values())
        }
    
    def find_best_agent(self, topic: str) -> Optional[Dict]:
        """Find the agent with highest expertise on topic."""
        slug = self._topic_slug(topic)
        best_agent = None
        best_confidence = 0.0
        
        for agent_name, topics in self.registry.items():
            if slug in topics:
                confidence = topics[slug].get("confidence", 0.0)
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_agent = {
                        "agent": agent_name,
                        "confidence": confidence,
                        "data": topics[slug]
                    }
        
        return best_agent


class ResearchPipeline:
    """Executes the full research pipeline for a topic."""
    
    def __init__(self, agent_name: str = "clawd"):
        self.agent_name = agent_name
        self.detector = ExpertiseGapDetector(agent_name)
        
    def research_topic(self, topic: str, depth: str = "deep") -> Dict[str, Any]:
        """
        Execute full research pipeline for a topic.
        Returns research results and metadata.
        """
        print(f"🔬 Starting research pipeline for: {topic}")
        print(f"   Agent: {self.agent_name}")
        print(f"   Depth: {depth}")
        
        # Phase 1: YouTube Research
        print("\n📺 Phase 1: YouTube Deep Research")
        youtube_results = self._youtube_research(topic, depth)
        
        # Phase 2: NLM Curation
        print("\n📚 Phase 2: NLM Curation & Mindmap Generation")
        nlm_results = self._nlm_curation(topic, youtube_results, depth)
        
        # Phase 3: Intelligent Questioning
        print("\n❓ Phase 3: Intelligent Question Formulation & Answering")
        qa_results = self._intelligent_questions(topic, nlm_results)
        
        # Phase 4: Inkstone Persistence
        print("\n💾 Phase 4: Inkstone Persistence")
        persistence_results = self._persist_to_inkstone(
            topic, youtube_results, nlm_results, qa_results
        )
        
        # Phase 5: Registry Update
        print("\n📝 Phase 5: Expertise Registry Update")
        registry_result = self._update_registry(
            topic, nlm_results, qa_results, persistence_results
        )
        
        return {
            "topic": topic,
            "agent": self.agent_name,
            "timestamp": datetime.now().isoformat(),
            "youtube": youtube_results,
            "nlm": nlm_results,
            "qa": qa_results,
            "persistence": persistence_results,
            "registry": registry_result
        }
    
    def _youtube_research(self, topic: str, depth: str) -> Dict:
        """Research topic on YouTube using youtube-summarize and agent-reach."""
        max_videos = {"quick": 5, "standard": 10, "deep": 20}.get(depth, 10)
        
        results = {
            "videos_found": [],
            "transcripts": [],
            "key_points": [],
            "ideas": [],
            "experts_identified": []
        }
        
        # Search for videos (using agent-reach)
        try:
            # This would use agent-reach in practice
            # agent-reach search topic --platform youtube --limit max_videos
            print(f"   Searching YouTube for '{topic}' (max {max_videos} videos)...")
            
            # Placeholder - in real implementation, call agent-reach
            video_urls = self._get_video_urls_for_topic(topic, max_videos)
            
            for url in video_urls:
                video_data = self._analyze_video(url)
                results["videos_found"].append(video_data)
                
        except Exception as e:
            print(f"   ⚠️ YouTube research error: {e}")
            results["error"] = str(e)
        
        return results
    
    def _get_video_urls_for_topic(self, topic: str, max_videos: int) -> List[str]:
        """Get video URLs for topic (placeholder for agent-reach integration)."""
        # In real implementation, this calls agent-reach
        # For now, return empty list - would be populated by actual search
        return []
    
    def _analyze_video(self, url: str) -> Dict:
        """Analyze a single video using youtube-summarize."""
        # In real implementation, calls youtube-summarize script
        return {
            "url": url,
            "title": "Video Title",
            "key_points": [],
            "transcript": "",
            "ideas": []
        }
    
    def _nlm_curation(self, topic: str, youtube_results: Dict, depth: str) -> Dict:
        """Curate research in NotebookLM: deep research with cited-only import,
        relevance-scored pruning, mindmap generation."""
        results = {
            "notebook_id": None,
            "mindmap": None,
            "sources_added": [],
            "curation": {},
            "cross_notebook_insights": []
        }

        try:
            from nlm_curation import SourceCurator

            notebook_id = self._get_or_create_notebook(f"Agent Mastery: {topic}")
            results["notebook_id"] = notebook_id

            # Add our own YouTube sources first (provenance: we chose them)
            for video in youtube_results.get("videos_found", []):
                if self._add_source(notebook_id, video["url"]):
                    results["sources_added"].append({"type": "youtube", "url": video["url"]})

            # Deep research + cited-only import + relevance pruning.
            # mode fast for quick runs; deep takes 15-30+ min.
            mode = "fast" if depth in ("quick", "standard") else "deep"
            curator = SourceCurator(topic)
            research_steps = curator.deep_research(notebook_id, mode=mode)
            results["research"] = research_steps

            # Post-import curation: always score. Execute deletion only when
            # we have plenty of sources (curator protects a floor internally).
            curation = curator.curate(notebook_id, execute=True)
            results["curation"] = {
                k: curation.get(k) for k in
                ("total_sources", "kept", "pruned", "deleted", "executed")
            }

            # Generate mindmap from the curated source set
            results["mindmap"] = self._generate_mindmap(notebook_id, topic)

        except Exception as e:
            print(f"   ⚠️ NLM curation error: {e}")
            results["error"] = str(e)

        return results

    def _get_or_create_notebook(self, title: str) -> str:
        """Find existing notebook by exact title, else create it."""
        r = subprocess.run(
            ["notebooklm", "list", "--json"],
            capture_output=True, text=True, timeout=60,
        )
        if r.returncode == 0:
            try:
                for nb in json.loads(r.stdout).get("notebooks", []):
                    if nb.get("title") == title:
                        return nb["id"]
            except json.JSONDecodeError:
                pass
        r = subprocess.run(
            ["notebooklm", "create", title, "--json"],
            capture_output=True, text=True, timeout=60,
        )
        if r.returncode != 0:
            raise RuntimeError(f"notebook create failed: {r.stderr[:300]}")
        return json.loads(r.stdout)["notebook"]["id"]

    def _add_source(self, notebook_id: str, url: str) -> bool:
        r = subprocess.run(
            ["notebooklm", "source", "add", url, "-n", notebook_id, "--json"],
            capture_output=True, text=True, timeout=120,
        )
        return r.returncode == 0

    def _generate_mindmap(self, notebook_id: str, topic: str) -> str:
        """Generate a note-backed mindmap from curated sources, return JSON tree."""
        r = subprocess.run(
            ["notebooklm", "generate", "mind-map", "--kind", "note-backed",
             "-n", notebook_id, "--json"],
            capture_output=True, text=True, timeout=300,
        )
        if r.returncode != 0:
            print(f"   ⚠️ mind-map generation failed: {r.stderr[:200]}")
            return ""
        try:
            mind_map = json.loads(r.stdout).get("mind_map", {})
            return json.dumps(mind_map, indent=2)
        except json.JSONDecodeError:
            return ""

    def _cross_notebook_synthesis(self, topic: str, notebook_id: str) -> List[str]:
        """Run cross-notebook queries for related insights."""
        # nlm cross query --notebooks "id1,id2" --query "topic"
        return []
    
    def _intelligent_questions(self, topic: str, nlm_results: Dict) -> Dict:
        """Formulate and answer intelligent questions."""
        questions = self._formulate_questions(topic, nlm_results.get("mindmap", ""))
        qa_pairs = []
        
        notebook_id = nlm_results.get("notebook_id")
        
        for question in questions:
            print(f"   Q: {question[:80]}...")
            # In real implementation: notebooklm chat --notebook-id X --message "question"
            answer = self._answer_question(notebook_id, question)
            qa_pairs.append({
                "question": question,
                "answer": answer,
                "category": self._categorize_question(question)
            })
        
        return {
            "questions_formulated": len(questions),
            "qa_pairs": qa_pairs,
            "categories_covered": list(set(q["category"] for q in qa_pairs))
        }
    
    def _formulate_questions(self, topic: str, mindmap: str) -> List[str]:
        """Formulate intelligent questions based on topic and mindmap."""
        templates = [
            f"What are the first principles of {topic}?",
            f"What do the top 1% of practitioners do differently in {topic}?",
            f"What common wisdom about {topic} is wrong? What's the evidence?",
            f"Walk me through a production implementation of {topic} with error handling",
            f"What are the most common ways {topic} fails in production?",
            f"How has {topic} changed in the last 12 months? What's next?",
            f"How does {topic} integrate with modern AI agent stacks? Show real code.",
            f"What are the key metrics to measure success in {topic}?",
            f"What are the contrarian viewpoints on {topic} from recognized experts?",
            f"What's the minimum viable implementation of {topic} for a startup?",
            f"How do you scale {topic} from prototype to production?",
            f"What security considerations are unique to {topic}?",
            f"What are the cost implications of {topic} at different scales?",
            f"How do you test and validate {topic} implementations?",
            f"What regulatory or compliance issues affect {topic}?"
        ]
        
        return templates
    
    def _categorize_question(self, question: str) -> str:
        """Categorize question type."""
        q_lower = question.lower()
        if "first principles" in q_lower:
            return "foundational"
        elif "top 1%" in q_lower or "practitioners" in q_lower:
            return "expert_patterns"
        elif "common wisdom" in q_lower or "wrong" in q_lower:
            return "contrarian"
        elif "production implementation" in q_lower or "walk me through" in q_lower:
            return "implementation"
        elif "fail" in q_lower:
            return "failure_modes"
        elif "changed" in q_lower or "next" in q_lower:
            return "evolution"
        elif "integrate" in q_lower:
            return "integration"
        elif "metrics" in q_lower or "measure" in q_lower:
            return "metrics"
        elif "contrarian" in q_lower or "viewpoints" in q_lower:
            return "contrarian"
        elif "minimum viable" in q_lower:
            return "implementation"
        elif "scale" in q_lower:
            return "scaling"
        elif "security" in q_lower:
            return "security"
        elif "cost" in q_lower:
            return "cost"
        elif "test" in q_lower or "validate" in q_lower:
            return "testing"
        elif "regulatory" in q_lower or "compliance" in q_lower:
            return "compliance"
        return "general"
    
    def _answer_question(self, notebook_id: str, question: str) -> str:
        """Answer question via grounded NLM chat on the curated notebook."""
        if not notebook_id:
            return ""
        r = subprocess.run(
            ["notebooklm", "ask", question, "-n", notebook_id, "--json"],
            capture_output=True, text=True, timeout=180,
        )
        if r.returncode != 0:
            return ""
        try:
            return json.loads(r.stdout).get("answer", "")
        except json.JSONDecodeError:
            return ""
    
    def _persist_to_inkstone(self, topic: str, youtube_results: Dict, 
                            nlm_results: Dict, qa_results: Dict) -> Dict:
        """Persist all research to Inkstone memory."""
        slug = self.detector._topic_slug(topic)
        namespace_base = f"/business/aiwithjai/agents/{self.agent_name}/expertise/{slug}"
        
        results = {
            "mindmap_saved": False,
            "qa_pairs_saved": 0,
            "sources_saved": 0,
            "patterns_saved": 0,
            "errors": []
        }
        
        try:
            # Save mindmap
            mindmap_text = nlm_results.get("mindmap", "")
            if mindmap_text:
                self._inkstone_write(
                    text=mindmap_text,
                    namespace=f"{namespace_base}/mindmap",
                    knowledgeType="procedural",
                    tags=["mindmap", "mastery", slug],
                    confidence=0.95
                )
                results["mindmap_saved"] = True
            
            # Save Q&A pairs
            for qa in qa_results.get("qa_pairs", []):
                self._inkstone_write(
                    text=f"Q: {qa['question']}\n\nA: {qa['answer']}",
                    namespace=f"{namespace_base}/qa",
                    knowledgeType="factual",
                    tags=["qa", "expert-answer", slug, qa["category"]],
                    confidence=0.9
                )
                results["qa_pairs_saved"] += 1
            
            # Save sources metadata
            sources_text = json.dumps({
                "youtube": youtube_results.get("videos_found", []),
                "web": [s for s in nlm_results.get("sources_added", []) if s["type"] == "web"],
                "cross_notebook": nlm_results.get("cross_notebook_insights", [])
            }, indent=2)
            
            self._inkstone_write(
                text=sources_text,
                namespace=f"{namespace_base}/sources",
                knowledgeType="reference",
                tags=["sources", "bibliography", slug],
                confidence=1.0
            )
            results["sources_saved"] = len(youtube_results.get("videos_found", [])) + \
                                      len([s for s in nlm_results.get("sources_added", []) if s["type"] == "web"])
            
            # Extract and save implementation patterns
            patterns = self._extract_patterns(qa_results.get("qa_pairs", []))
            if patterns:
                self._inkstone_write(
                    text=patterns,
                    namespace=f"{namespace_base}/patterns",
                    knowledgeType="procedural",
                    tags=["patterns", "implementation", slug],
                    confidence=0.85
                )
                results["patterns_saved"] = 1
                
        except Exception as e:
            results["errors"].append(str(e))
            print(f"   ⚠️ Inkstone persistence error: {e}")
        
        return results
    
    def _inkstone_write(self, text: str, namespace: str, knowledgeType: str, 
                       tags: List[str], confidence: float):
        """Write to Inkstone (placeholder for actual MCP call)."""
        # In real implementation: inkstone_inkstone_memory_write(...)
        print(f"      💾 Saved to {namespace} ({len(text)} chars)")
    
    def _extract_patterns(self, qa_pairs: List[Dict]) -> str:
        """Extract implementation patterns from Q&A."""
        pattern_questions = [qa for qa in qa_pairs if qa["category"] in 
                           ["implementation", "scaling", "testing", "security"]]
        
        if not pattern_questions:
            return ""
        
        patterns = "# Implementation Patterns\n\n"
        for qa in pattern_questions:
            patterns += f"## {qa['category'].title()}\n"
            patterns += f"**Q:** {qa['question']}\n\n"
            patterns += f"**Key Insights:**\n{qa['answer'][:500]}...\n\n"
        
        return patterns
    
    def _update_registry(self, topic: str, nlm_results: Dict, 
                        qa_results: Dict, persistence_results: Dict) -> Dict:
        """Update expertise registry with new mastery."""
        source_count = persistence_results.get("sources_saved", 0)
        qa_count = persistence_results.get("qa_pairs_saved", 0)
        
        # Calculate confidence based on research completeness
        confidence = min(0.95, 0.5 + (source_count * 0.01) + (qa_count * 0.02))
        
        topics_mastered = qa_results.get("categories_covered", [])
        
        slug = self.detector.register_expertise(
            topic=topic,
            confidence=confidence,
            notebook_id=nlm_results.get("notebook_id", ""),
            source_count=source_count,
            topics_mastered=topics_mastered
        )
        
        return {
            "slug": slug,
            "confidence": confidence,
            "registered": True
        }


def main():
    parser = argparse.ArgumentParser(
        description="Self-Improving Agent - Autonomous Expertise Building"
    )
    parser.add_argument("command", choices=["check", "research", "master", "status", "expertise", "find-expert"],
                       help="Command to execute")
    parser.add_argument("topic", nargs="?", help="Topic to research or check")
    parser.add_argument("--agent", default="clawd", help="Agent name")
    parser.add_argument("--depth", choices=["quick", "standard", "deep"], default="deep",
                       help="Research depth")
    parser.add_argument("--format", choices=["json", "markdown"], default="json",
                       help="Output format")
    
    args = parser.parse_args()
    
    detector = ExpertiseGapDetector(args.agent)
    pipeline = ResearchPipeline(args.agent)
    
    if args.command == "check":
        if not args.topic:
            print("Error: topic required for check command")
            sys.exit(1)
        result = detector.check_expertise(args.topic)
        print(json.dumps(result, indent=2) if args.format == "json" else result)
        
    elif args.command == "research":
        if not args.topic:
            print("Error: topic required for research command")
            sys.exit(1)
        result = pipeline.research_topic(args.topic, args.depth)
        print(json.dumps(result, indent=2) if args.format == "json" else result)
        
    elif args.command == "master":
        if not args.topic:
            print("Error: topic required for master command")
            sys.exit(1)
        # Master = research + persist
        result = pipeline.research_topic(args.topic, args.depth)
        print(json.dumps(result, indent=2) if args.format == "json" else result)
        
    elif args.command == "status":
        result = detector.get_expertise_status(args.topic)
        print(json.dumps(result, indent=2) if args.format == "json" else result)
        
    elif args.command == "expertise":
        result = detector.get_expertise_status()
        print(json.dumps(result, indent=2) if args.format == "json" else result)
        
    elif args.command == "find-expert":
        if not args.topic:
            print("Error: topic required for find-expert command")
            sys.exit(1)
        result = detector.find_best_agent(args.topic)
        print(json.dumps(result, indent=2) if args.format == "json" else result)


if __name__ == "__main__":
    main()