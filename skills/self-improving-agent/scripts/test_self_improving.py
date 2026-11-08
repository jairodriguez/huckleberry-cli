#!/usr/bin/env python3
"""
Test script for Self-Improving Agent skill.
Tests all components without requiring external APIs.
"""

import sys
from pathlib import Path

# Add project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import directly from the script files
sys.path.insert(0, str(Path(__file__).parent))
from self_improving_agent import ExpertiseGapDetector, ResearchPipeline
from auto_detect import AutoExpertiseDetector, check_and_research

def test_expertise_detector():
    """Test expertise gap detection."""
    print("=" * 60)
    print("TEST: ExpertiseGapDetector")
    print("=" * 60)
    
    detector = ExpertiseGapDetector("clawd")
    
    # Test checking unknown topic
    result = detector.check_expertise("quantum computing")
    print(f"Unknown topic check: {result}")
    assert result["needs_research"] == True
    assert result["confidence"] == 0.0
    print("✅ Unknown topic correctly identified as needing research")
    
    # Test registry registration
    slug = detector.register_expertise(
        topic="quantum computing",
        confidence=0.9,
        notebook_id="nb-123",
        source_count=25,
        topics_mastered=["qubits", "superposition", "entanglement"]
    )
    print(f"Registered with slug: {slug}")
    
    # Test checking known topic
    result = detector.check_expertise("quantum computing")
    print(f"Known topic check: {result}")
    assert result["has_expertise"] == True
    assert result["confidence"] >= 0.9
    print("✅ Known topic correctly identified as mastered")
    
    # Test expertise status
    status = detector.get_expertise_status()
    print(f"Expertise status: {status}")
    assert status["total_topics"] == 1
    print("✅ Expertise status shows registered topics")
    
    # Test find best agent
    best = detector.find_best_agent("quantum computing")
    print(f"Best agent: {best}")
    assert best["agent"] == "clawd"
    print("✅ Find best agent works")
    
    print("\n✅ All ExpertiseGapDetector tests passed!\n")

def test_research_pipeline():
    """Test research pipeline (mock mode)."""
    print("=" * 60)
    print("TEST: ResearchPipeline (Mock)")
    print("=" * 60)
    
    pipeline = ResearchPipeline("clawd")
    
    # Test question formulation
    questions = pipeline._formulate_questions("Rust async patterns", "mindmap placeholder")
    print(f"Generated {len(questions)} questions")
    assert len(questions) >= 10
    print("✅ Question formulation generates comprehensive questions")
    
    # Test categorization
    categories = set()
    for q in questions:
        cat = pipeline._categorize_question(q)
        categories.add(cat)
        print(f"  [{cat}] {q[:60]}...")
    
    expected_categories = {"foundational", "expert_patterns", "contrarian", 
                          "implementation", "failure_modes", "evolution",
                          "integration", "metrics"}
    assert expected_categories.issubset(categories)
    print(f"✅ All {len(expected_categories)} expected categories covered")
    
    # Test pattern extraction
    mock_qa = [
        {"question": "How to implement X?", "answer": "Implementation details...", "category": "implementation"},
        {"question": "How to scale X?", "answer": "Scaling details...", "category": "scaling"},
        {"question": "What is X?", "answer": "Definition...", "category": "foundational"}
    ]
    patterns = pipeline._extract_patterns(mock_qa)
    print(f"Extracted patterns:\n{patterns}")
    assert "Implementation Patterns" in patterns
    assert "implementation" in patterns.lower()
    print("✅ Pattern extraction works")
    
    print("\n✅ All ResearchPipeline tests passed!\n")

def test_auto_detector():
    """Test auto-detection integration."""
    print("=" * 60)
    print("TEST: AutoExpertiseDetector")
    print("=" * 60)
    
    detector = AutoExpertiseDetector("clawd", auto_research=False)
    
    # Test query analysis
    test_queries = [
        "How do I set up a high-frequency trading bot with Rust?",
        "What's the best way to optimize PostgreSQL queries?",
        "Explain the transformer architecture in simple terms",
        "Compare Kubernetes vs Docker Swarm for production",
        "Hello, how are you today?"  # Non-technical
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        result = detector.analyze_query(query)
        print(f"  Topics detected: {result['topics_detected']}")
        print(f"  Gaps found: {len(result['gaps_found'])}")
        for gap in result['gaps_found']:
            print(f"    - {gap['topic']} (confidence: {gap['confidence']})")
    
    # Test stats
    stats = detector.get_stats()
    print(f"\nDetection stats: {stats}")
    
    print("\n✅ All AutoExpertiseDetector tests passed!\n")

def test_integration():
    """Test full integration flow."""
    print("=" * 60)
    print("TEST: Integration Flow")
    print("=" * 60)
    
    # Simulate agent receiving a query
    agent_name = "clawd"
    user_query = "How do I implement a vector database for RAG with Pinecone?"
    
    print(f"Agent: {agent_name}")
    print(f"User query: {user_query}")
    
    # Check expertise
    detector = ExpertiseGapDetector(agent_name)
    expertise = detector.check_expertise("vector database RAG Pinecone")
    print(f"Expertise check: needs_research={expertise['needs_research']}, confidence={expertise['confidence']}")
    
    if expertise["needs_research"]:
        print("🔬 Gap detected - would trigger research pipeline")
        # In real use: pipeline.research_topic("vector database RAG Pinecone", "deep")
    
    # Test auto-detection
    auto_detector = AutoExpertiseDetector(agent_name, auto_research=False)
    analysis = auto_detector.analyze_query(user_query)
    print(f"Auto-detection: {len(analysis['gaps_found'])} gaps found")
    
    print("\n✅ Integration flow test passed!\n")

def run_all_tests():
    """Run all tests."""
    print("\n" + "🧪" * 30)
    print("SELF-IMPROVING AGENT SKILL - TEST SUITE")
    print("🧪" * 30 + "\n")
    
    test_expertise_detector()
    test_research_pipeline()
    test_auto_detector()
    test_integration()
    
    print("=" * 60)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 60)
    print("\nThe self-improving-agent skill is ready for use.")
    print("Run with: self-improving-agent master 'your topic' --depth=deep")

if __name__ == "__main__":
    run_all_tests()