#!/usr/bin/env python3
"""
Initialize Agent Expertise Registry
Creates the registry file with proper structure.
"""

import json
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
REGISTRY_PATH = PROJECT_ROOT / "memory" / "agent-expertise-registry.json"

# Default registry structure
DEFAULT_REGISTRY = {
    "version": "1.0",
    "created": datetime.now().isoformat(),
    "last_updated": datetime.now().isoformat(),
    "agents": {
        "clawd": {},
        "harper": {},
        "plan": {},
        "build": {},
        "skye": {},
        "rai": {},
        "paco": {},
        "thinker": {},
        "hr": {},
        "leads": {}
    },
    "global_index": {}  # topic_slug -> {best_agent, confidence, all_agents}
}

def init_registry():
    """Initialize or verify registry exists."""
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    if REGISTRY_PATH.exists():
        print(f"✅ Registry already exists at {REGISTRY_PATH}")
        with open(REGISTRY_PATH) as f:
            registry = json.load(f)
        print(f"   Version: {registry.get('version', 'unknown')}")
        print(f"   Agents: {len(registry.get('agents', {}))}")
        total_topics = sum(len(topics) for topics in registry.get('agents', {}).values())
        print(f"   Total mastered topics: {total_topics}")
        return registry
    
    # Create new registry
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(DEFAULT_REGISTRY, f, indent=2)
    
    print(f"✅ Created new expertise registry at {REGISTRY_PATH}")
    return DEFAULT_REGISTRY

def rebuild_global_index(registry: dict) -> dict:
    """Rebuild global topic index from agent data."""
    global_index = {}
    
    for agent_name, topics in registry.get("agents", {}).items():
        for slug, topic_data in topics.items():
            topic_name = topic_data.get("topic", slug)
            confidence = topic_data.get("confidence", 0.0)
            
            if slug not in global_index:
                global_index[slug] = {
                    "topic": topic_name,
                    "best_agent": agent_name,
                    "best_confidence": confidence,
                    "all_agents": {agent_name: confidence}
                }
            else:
                global_index[slug]["all_agents"][agent_name] = confidence
                if confidence > global_index[slug]["best_confidence"]:
                    global_index[slug]["best_agent"] = agent_name
                    global_index[slug]["best_confidence"] = confidence
    
    registry["global_index"] = global_index
    registry["last_updated"] = datetime.now().isoformat()
    
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)
    
    print(f"✅ Rebuilt global index: {len(global_index)} topics indexed")
    return registry

if __name__ == "__main__":
    registry = init_registry()
    registry = rebuild_global_index(registry)
    print("\n📊 Registry initialized and ready for use!")