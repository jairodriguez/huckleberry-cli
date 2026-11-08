#!/usr/bin/env python3
"""
Auto-Detection Integration for Agents
Automatically detects expertise gaps and triggers research pipeline.
Can be imported and used by any agent.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from self_improving_agent import ExpertiseGapDetector, ResearchPipeline

class AutoExpertiseDetector:
    """
    Automatic expertise gap detection for agents.
    Integrates with agent's natural language processing to detect
    when the agent is about to give a generic/low-confidence answer.
    """
    
    def __init__(self, agent_name: str = "clawd", auto_research: bool = True):
        self.agent_name = agent_name
        self.auto_research = auto_research
        self.detector = ExpertiseGapDetector(agent_name)
        self.pipeline = ResearchPipeline(agent_name)
        self.detection_log = PROJECT_ROOT / "memory" / "auto-detection-log.json"
        self._load_log()
    
    def _load_log(self):
        """Load detection log."""
        if self.detection_log.exists():
            with open(self.detection_log) as f:
                self.log = json.load(f)
        else:
            self.log = {"detections": [], "research_triggered": 0, "skipped": 0}
    
    def _save_log(self):
        """Save detection log."""
        self.detection_log.parent.mkdir(parents=True, exist_ok=True)
        with open(self.detection_log, 'w') as f:
            json.dump(self.log, f, indent=2)
    
    def analyze_query(self, user_query: str) -> Dict[str, Any]:
        """
        Analyze a user query to detect potential expertise gaps.
        Returns analysis with recommended action.
        """
        # Extract potential topics from query
        topics = self._extract_topics(user_query)
        
        results = {
            "query": user_query,
            "topics_detected": topics,
            "gaps_found": [],
            "recommendations": []
        }
        
        for topic in topics:
            expertise = self.detector.check_expertise(topic)
            
            if expertise["needs_research"]:
                gap_info = {
                    "topic": topic,
                    "confidence": expertise["confidence"],
                    "reason": "No existing expertise in registry or Inkstone"
                }
                results["gaps_found"].append(gap_info)
                
                if self.auto_research:
                    results["recommendations"].append({
                        "action": "trigger_research",
                        "topic": topic,
                        "priority": "high" if expertise["confidence"] < 0.3 else "medium"
                    })
                else:
                    results["recommendations"].append({
                        "action": "flag_for_manual_research",
                        "topic": topic,
                        "priority": "medium"
                    })
        
        # Log detection
        self.log["detections"].append({
            "timestamp": str(Path(__file__).stat().st_mtime),  # placeholder
            "query": user_query,
            "topics": topics,
            "gaps": len(results["gaps_found"])
        })
        self._save_log()
        
        return results
    
    def _extract_topics(self, query: str) -> List[str]:
        """Extract potential expertise topics from query."""
        # This is a simplified version - in practice would use NLP
        # For now, look for technical keywords and "how to" patterns
        
        topics = []
        query_lower = query.lower()
        
        # Common patterns that indicate expertise need
        patterns = [
            ("how to", "implementation"),
            ("best way to", "best practices"),
            ("what is", "definition"),
            ("explain", "explanation"),
            ("compare", "comparison"),
            ("vs", "comparison"),
            ("alternative", "alternatives"),
            ("tutorial", "tutorial"),
            ("guide", "guide"),
            ("setup", "setup"),
            ("configure", "configuration"),
            ("optimize", "optimization"),
            ("debug", "debugging"),
            ("troubleshoot", "troubleshooting"),
            ("architecture", "architecture"),
            ("design pattern", "design patterns"),
            ("framework", "framework"),
            ("library", "library"),
            ("api", "API"),
            ("integration", "integration"),
        ]
        
        # Technical domains to watch for
        domains = [
            "machine learning", "deep learning", "neural network", "llm", "transformer",
            "vector database", "embedding", "rag", "fine-tuning", "prompt engineering",
            "kubernetes", "docker", "microservices", "distributed systems",
            "rust", "golang", "typescript", "python", "javascript",
            "react", "next.js", "vue", "svelte",
            "postgresql", "mongodb", "redis", "elasticsearch",
            "graphql", "rest api", "grpc", "websocket",
            "ci/cd", "github actions", "terraform", "ansible",
            "monitoring", "observability", "prometheus", "grafana",
            "security", "authentication", "authorization", "oauth", "jwt",
            "blockchain", "smart contract", "web3", "defi",
            "quantum computing", "cryptography",
            "computer vision", "nlp", "speech recognition",
            "reinforcement learning", "gan", "diffusion model",
            "agent", "multi-agent", "langchain", "autogen", "crewai",
            "notebooklm", "gemini", "claude", "gpt", "openai",
            "youtube", "video generation", "image generation",
            "remotion", "ffmpeg", "video editing",
            "google ads", "facebook ads", "seo", "sem",
            "conversion rate optimization", "cro", "ab testing",
            "email marketing", "copywriting", "content marketing",
            "sales funnel", "lead generation", "crm",
            "zoho", "hubspot", "salesforce", "pipedrive",
        ]
        
        # Check for domain mentions
        for domain in domains:
            if domain in query_lower:
                topics.append(domain)
        
        # Check for pattern + domain combinations
        for pattern, pattern_type in patterns:
            if pattern in query_lower:
                # Find what comes after the pattern
                idx = query_lower.index(pattern)
                after = query_lower[idx + len(pattern):].strip()
                # Extract first few words as potential topic
                words = after.split()[:5]
                if words:
                    potential_topic = " ".join(words).rstrip("?.,!")
                    if len(potential_topic) > 3:
                        topics.append(potential_topic)
        
        # Deduplicate and filter
        unique_topics = []
        for topic in topics:
            topic = topic.strip().lower()
            if topic and len(topic) > 3 and topic not in unique_topics:
                unique_topics.append(topic)
        
        return unique_topics[:10]  # Limit to top 10
    
    def auto_research_if_needed(self, user_query: str) -> Optional[Dict]:
        """
        Automatically trigger research if expertise gap detected.
        Returns research result if triggered, None otherwise.
        """
        analysis = self.analyze_query(user_query)
        
        if not analysis["gaps_found"]:
            return None
        
        # Trigger research for highest priority gap
        high_priority = [r for r in analysis["recommendations"] 
                        if r.get("priority") == "high" and r["action"] == "trigger_research"]
        
        if high_priority:
            topic = high_priority[0]["topic"]
            print(f"🔬 Auto-triggering research for: {topic}")
            self.log["research_triggered"] += 1
            self._save_log()
            return self.pipeline.research_topic(topic, depth="standard")
        
        medium_priority = [r for r in analysis["recommendations"] 
                          if r.get("priority") == "medium" and r["action"] == "trigger_research"]
        
        if medium_priority and self.auto_research:
            topic = medium_priority[0]["topic"]
            print(f"🔬 Auto-triggering research for: {topic}")
            self.log["research_triggered"] += 1
            self._save_log()
            return self.pipeline.research_topic(topic, depth="quick")
        
        self.log["skipped"] += 1
        self._save_log()
        return None
    
    def get_expert_answer(self, topic: str, question: str) -> Optional[str]:
        """
        Get expert answer from agent's mastered knowledge.
        Searches Inkstone for existing Q&A on topic.
        """
        # In real implementation, would search Inkstone
        # For now, return None to indicate not found
        return None
    
    def get_stats(self) -> Dict:
        """Get detection statistics."""
        return {
            "total_detections": len(self.log.get("detections", [])),
            "research_triggered": self.log.get("research_triggered", 0),
            "skipped": self.log.get("skipped", 0),
            "agent": self.agent_name
        }


# Convenience function for quick integration
def check_and_research(agent_name: str, user_query: str, auto: bool = True) -> Dict:
    """
    Quick function to check expertise and optionally trigger research.
    Use in agent pre-processing.
    """
    detector = AutoExpertiseDetector(agent_name, auto_research=auto)
    return detector.analyze_query(user_query)


if __name__ == "__main__":
    # Test the auto-detector
    import argparse
    
    parser = argparse.ArgumentParser(description="Test auto-detection")
    parser.add_argument("query", help="User query to analyze")
    parser.add_argument("--agent", default="clawd", help="Agent name")
    parser.add_argument("--auto", action="store_true", help="Auto-trigger research")
    
    args = parser.parse_args()
    
    detector = AutoExpertiseDetector(args.agent, auto_research=args.auto)
    result = detector.analyze_query(args.query)
    
    print(json.dumps(result, indent=2))
    
    if args.auto and result["gaps_found"]:
        print("\n🔬 Triggering research...")
        research_result = detector.auto_research_if_needed(args.query)
        if research_result:
            print("✅ Research completed")
        else:
            print("⏭️ Research skipped")