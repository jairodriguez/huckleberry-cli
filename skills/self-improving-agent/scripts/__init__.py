"""
Self-Improving Agent Package
Provides autonomous expertise building for AI agents.
"""

from .self_improving_agent import ExpertiseGapDetector, ResearchPipeline
from .auto_detect import AutoExpertiseDetector, check_and_research

__all__ = [
    "ExpertiseGapDetector",
    "ResearchPipeline", 
    "AutoExpertiseDetector",
    "check_and_research"
]

__version__ = "1.0.0"