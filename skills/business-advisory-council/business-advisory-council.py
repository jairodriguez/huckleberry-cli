#!/usr/bin/env python3
"""
Business Advisory Council - Single Model Prototype

Usage:
    python3 business-advisory-council.py --brief "Pursue Steve Conley partnership for fabric sourcing?"
    python3 business-advisory-council.py --brief-file brief.json
    python3 business-advisory-council.py --interactive

Output:
    - JSON file with structured analysis
    - Human-readable report
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add openclaw installation to path
sys.path.insert(0, '/Users/clawdbot/openclaw-install/node_modules/openclaw/lib')

try:
    from openclaw import llm
except ImportError:
    print("Error: OpenClaw LLM module not found")
    sys.exit(1)

# Expert personas
EXPERTS = {
    "financial_analyst": {
        "name": "Financial Analyst",
        "role": "ROI, margins, cash flow analysis",
        "question": "Can we afford this? What's the ROI?",
        "output_format": "recommendation (proceed/defer/reject), financial_impact, risks, key_metrics"
    },
    "operations_lead": {
        "name": "Operations Lead",
        "role": "Execution, logistics, timeline feasibility",
        "question": "Can we actually do this?",
        "output_format": "feasibility (high/medium/low), timeline, blockers, resource_needs"
    },
    "marketing_strategist": {
        "name": "Marketing Strategist",
        "role": "Market fit, positioning, messaging",
        "question": "Will anyone buy this?",
        "output_format": "market_fit (strong/moderate/weak), positioning, target_audience, messaging_angles"
    },
    "risk_assessor": {
        "name": "Risk Assessor",
        "role": "Downside scenarios, failure modes",
        "question": "What could go wrong?",
        "output_format": "risk_level (low/medium/high), top_risks, mitigation_strategies, probability_of_failure"
    },
    "growth_hacker": {
        "name": "Growth Hacker",
        "role": "Scale, virality, leverage opportunities",
        "question": "How do we 10x this?",
        "output_format": "leverage_opportunities, viral_potential, scale_bottlenecks, 10x_ideas"
    }
}

DEFAULT_MODEL = "zai-custom/glm-4.7"

def load_brief(brief_text=None, brief_file=None):
    """Load decision brief from text or JSON file"""

    if brief_file:
        with open(brief_file, 'r') as f:
            brief_data = json.load(f)
            brief_data['source'] = f"file: {brief_file}"
            return brief_data

    if brief_text:
        return {
            "decision": brief_text,
            "context": "",
            "constraints": "",
            "success_criteria": "",
            "source": "command-line"
        }

    return None

def build_expert_prompt(expert_key, brief, model_id=DEFAULT_MODEL):
    """Build prompt for a single expert analysis"""

    expert = EXPERTS[expert_key]

    prompt = f"""You are the {expert['name']} on a Business Advisory Council.

**Your Role:** {expert['role']}
**Your Core Question:** {expert['question']}

**Decision Brief:**
- What we're deciding: {brief['decision']}
- Context: {brief.get('context', 'Not specified')}
- Constraints: {brief.get('constraints', 'Not specified')}
- Success criteria: {brief.get('success_criteria', 'Not specified')}

**Your Task:**
Provide your expert analysis focusing ONLY on your domain ({expert['role']}).

**Output Format (JSON):**
{{
    "expert": "{expert['name']}",
    "analysis": {{
        {get_output_format_fields(expert['output_format'])}
    }},
    "reasoning": "Brief explanation of your assessment",
    "confidence": "high|medium|low"
}}

**Be specific.** Use data when possible. Identify risks clearly.
"""

    return prompt

def get_output_format_fields(output_format):
    """Convert output format string to JSON fields"""
    fields = output_format.split(", ")
    return ",\n        ".join([f'"{f}": ""' for f in fields])

def analyze_decision_single_model(brief, model_id=DEFAULT_MODEL):
    """Run single-model analysis with all 5 expert personas"""

    # Build combined prompt
    prompt = f"""You are acting as 5 different experts on a Business Advisory Council.
Each expert will provide their analysis independently.

**Decision Brief:**
- What we're deciding: {brief['decision']}
- Context: {brief.get('context', 'Not specified')}
- Constraints: {brief.get('constraints', 'Not specified')}
- Success criteria: {brief.get('success_criteria', 'Not specified')}

**Experts to analyze:**
"""

    for key, expert in EXPERTS.items():
        prompt += f"""
{expert['name']} ({expert['role']}):
- Focus: {expert['question']}
"""

    prompt += """
**Your Task:**
Provide analysis for ALL 5 experts. Each expert should think independently from their own perspective.

**Output Format (JSON):**
{
    "experts": [
        {
            "name": "Financial Analyst",
            "recommendation": "proceed|defer|reject",
            "financial_impact": "",
            "risks": [],
            "key_metrics": {},
            "reasoning": "",
            "confidence": "high|medium|low"
        },
        {
            "name": "Operations Lead",
            "feasibility": "high|medium|low",
            "timeline": "",
            "blockers": [],
            "resource_needs": "",
            "reasoning": "",
            "confidence": "high|medium|low"
        },
        {
            "name": "Marketing Strategist",
            "market_fit": "strong|moderate|weak",
            "positioning": "",
            "target_audience": "",
            "messaging_angles": [],
            "reasoning": "",
            "confidence": "high|medium|low"
        },
        {
            "name": "Risk Assessor",
            "risk_level": "low|medium|high",
            "top_risks": [],
            "mitigation_strategies": [],
            "probability_of_failure": "low|medium|high",
            "reasoning": "",
            "confidence": "high|medium|low"
        },
        {
            "name": "Growth Hacker",
            "leverage_opportunities": [],
            "viral_potential": "low|medium|high",
            "scale_bottlenecks": [],
            "10x_ideas": [],
            "reasoning": "",
            "confidence": "high|medium|low"
        }
    ]
}

**Be specific.** Each expert should provide concrete analysis, not generic advice.
Identify consensus, conflicts, and blind spots.
"""

    # Call model
    print(f"🤖 Analyzing with {model_id}...")
    response = llm.complete(prompt, model=model_id)

    return response

def parse_analysis_response(response_text):
    """Parse JSON response from model"""

    try:
        # Try to find JSON in response
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            json_str = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            json_str = response_text[json_start:json_end].strip()
        else:
            json_str = response_text.strip()

        return json.loads(json_str)
    except Exception as e:
        print(f"⚠️  Failed to parse JSON response: {e}")
        return {"error": str(e), "raw_response": response_text}

def synthesize_analysis(experts_data):
    """Synthesize expert opinions into recommendation"""

    if "error" in experts_data:
        return {"synthesis": {"error": experts_data["error"]}}

    experts = experts_data.get("experts", [])

    # Count recommendations
    proceed_count = sum(1 for e in experts if e.get("recommendation") == "proceed")
    defer_count = sum(1 for e in experts if e.get("recommendation") == "defer")
    reject_count = sum(1 for e in experts if e.get("recommendation") == "reject")

    # Determine consensus
    total = len(experts)
    if proceed_count / total >= 0.6:
        consensus = "proceed"
    elif reject_count / total >= 0.6:
        consensus = "reject"
    else:
        consensus = "defer"

    # Extract top risks
    all_risks = []
    for e in experts:
        if "top_risks" in e:
            all_risks.extend(e["top_risks"])
        if "risks" in e:
            all_risks.extend(e["risks"])

    top_risks = all_risks[:5]

    # Extract leverage opportunities
    leverage = []
    for e in experts:
        if "leverage_opportunities" in e:
            leverage.extend(e["leverage_opportunities"])

    synthesis = {
        "consensus": consensus,
        "vote_summary": {"proceed": proceed_count, "defer": defer_count, "reject": reject_count},
        "top_risks": top_risks,
        "leverage_opportunities": leverage,
        "recommendation": {
            "action": consensus.upper(),
            "rationale": f"{proceed_count}/{total} experts recommend proceeding. {len(top_risks)} key risks identified.",
            "confidence": "high" if consensus in ["proceed", "reject"] else "medium"
        }
    }

    return synthesis

def generate_report(brief, experts_data, synthesis, output_dir=None):
    """Generate human-readable report"""

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report = f"""# Business Advisory Council Analysis

**Generated:** {timestamp}
**Decision:** {brief['decision']}

---

## Decision Brief

**What we're deciding:**
{brief['decision']}

**Context:**
{brief.get('context', 'Not specified')}

**Constraints:**
{brief.get('constraints', 'Not specified')}

**Success criteria:**
{brief.get('success_criteria', 'Not specified')}

---

## Expert Analysis

"""

    if "error" in experts_data:
        report += f"""
❌ **Error in analysis:**

{experts_data['error']}

**Raw response:**
```
{experts_data.get('raw_response', 'N/A')}
```
"""
    else:
        for expert in experts_data.get("experts", []):
            name = expert.get("name", "Unknown")
            report += f"\n### {name}\n\n"

            for key, value in expert.items():
                if key not in ["name", "reasoning", "confidence"]:
                    if isinstance(value, list):
                        report += f"**{key}:**\n"
                        for item in value:
                            report += f"- {item}\n"
                    else:
                        report += f"**{key}:** {value}\n"
                    report += "\n"

            if "reasoning" in expert:
                report += f"**Reasoning:** {expert['reasoning']}\n\n"
            if "confidence" in expert:
                report += f"**Confidence:** {expert['confidence']}\n\n"
            report += "---\n\n"

        if synthesis:
            report += """
## Synthesis

**Consensus:**
"""

            syn = synthesis.get("synthesis", {})
            if syn:
                report += f"\n**{syn['consensus'].upper()}**\n\n"
                report += f"Vote summary: {syn['vote_summary']['proceed']} proceed, {syn['vote_summary']['defer']} defer, {syn['vote_summary']['reject']} reject\n\n"

                if syn.get('top_risks'):
                    report += "**Top risks:**\n"
                    for risk in syn['top_risks']:
                        report += f"- {risk}\n"
                    report += "\n"

                if syn.get('leverage_opportunities'):
                    report += "**Leverage opportunities:**\n"
                    for opp in syn['leverage_opportunities']:
                        report += f"- {opp}\n"
                    report += "\n"

                rec = syn.get('recommendation', {})
                if rec:
                    report += f"""**Recommendation:**

**{rec['action']}**

{rec['rationale']}

**Confidence:** {rec['confidence']}
"""

    report += """

---
*Generated by Business Advisory Council Prototype*
"""

    return report

def save_results(brief, experts_data, synthesis, report, output_dir=None):
    """Save results to JSON and text files"""

    if output_dir is None:
        output_dir = Path.cwd() / "output" / "business-advisory-council"

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"decision_{timestamp}"

    # Save JSON
    json_file = output_dir / f"{base_name}.json"
    result = {
        "brief": brief,
        "timestamp": datetime.now().isoformat(),
        "experts_analysis": experts_data,
        "synthesis": synthesis
    }

    with open(json_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"✅ JSON saved: {json_file}")

    # Save report
    report_file = output_dir / f"{base_name}.md"
    with open(report_file, 'w') as f:
        f.write(report)

    print(f"✅ Report saved: {report_file}")

    return json_file, report_file

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Business Advisory Council Analysis")
    parser.add_argument("--brief", help="Decision brief text")
    parser.add_argument("--brief-file", help="Decision brief JSON file")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model to use")
    parser.add_argument("--output-dir", help="Output directory for results")
    parser.add_argument("--context", help="Additional context")
    parser.add_argument("--constraints", help="Constraints")
    parser.add_argument("--success-criteria", help="Success criteria")

    args = parser.parse_args()

    # Load brief
    brief = load_brief(args.brief, args.brief_file)
    if not brief:
        print("Error: No brief provided. Use --brief or --brief-file")
        parser.print_help()
        sys.exit(1)

    # Add optional fields
    if args.context:
        brief['context'] = args.context
    if args.constraints:
        brief['constraints'] = args.constraints
    if args.success_criteria:
        brief['success_criteria'] = args.success_criteria

    print(f"📋 Decision Brief:")
    print(f"   Decision: {brief['decision']}")
    print(f"   Context: {brief.get('context', 'N/A')}")
    print(f"   Constraints: {brief.get('constraints', 'N/A')}")
    print(f"   Success criteria: {brief.get('success_criteria', 'N/A')}")
    print()

    # Run analysis
    response = analyze_decision_single_model(brief, args.model)

    # Parse response
    experts_data = parse_analysis_response(response)

    # Synthesize
    synthesis = synthesize_analysis(experts_data)

    # Generate report
    report = generate_report(brief, experts_data, synthesis, args.output_dir)

    # Save results
    json_file, report_file = save_results(brief, experts_data, synthesis, report, args.output_dir)

    print()
    print("📊 Analysis complete!")
    print(f"   Report: {report_file}")
    print(f"   Data: {json_file}")

    # Print quick summary
    if synthesis and "synthesis" in synthesis:
        syn = synthesis['synthesis']
        if "recommendation" in syn:
            print()
            print(f"   🎯 Recommendation: {syn['recommendation']['action']}")
            print(f"   📈 Confidence: {syn['recommendation']['confidence']}")

if __name__ == "__main__":
    main()
