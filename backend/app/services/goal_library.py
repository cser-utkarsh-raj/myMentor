from typing import List, Dict, Any

GOAL_CATEGORIES = [
    "Technology",
    "Business",
    "Creative",
    "Academics",
    "Health",
    "Languages"
]

GOAL_LIBRARY = [
    {
        "id": "tech-backend-01",
        "category": "Technology",
        "title": "Backend Developer",
        "description": "Master server-side architecture, APIs, and databases.",
        "estimated_duration": "4 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "expected_outcome": "Build scalable, production-ready backend systems.",
        "roadmap_preview": [
            "Module 1: Programming Fundamentals",
            "Module 2: Databases & SQL",
            "Module 3: API Design (REST/GraphQL)",
            "Module 4: System Architecture"
        ]
    },
    {
        "id": "tech-ai-01",
        "category": "Technology",
        "title": "AI & Machine Learning",
        "description": "Learn to build, train, and deploy AI models.",
        "estimated_duration": "6 months",
        "difficulty": "Advanced",
        "skills_covered": ["Python", "PyTorch", "Transformers", "Data Science"],
        "expected_outcome": "Deploy LLMs and machine learning pipelines.",
        "roadmap_preview": [
            "Module 1: Math & Statistics",
            "Module 2: Machine Learning Algorithms",
            "Module 3: Deep Learning",
            "Module 4: LLMs & Fine-Tuning"
        ]
    },
    {
        "id": "biz-startup-01",
        "category": "Business",
        "title": "Startup Founder",
        "description": "From idea validation to fundraising and product launch.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["Product Management", "Marketing", "Finance", "Leadership"],
        "expected_outcome": "Launch a validated MVP and acquire first customers.",
        "roadmap_preview": [
            "Module 1: Idea Validation",
            "Module 2: Building the MVP",
            "Module 3: Go-to-Market Strategy",
            "Module 4: Fundraising"
        ]
    },
    {
        "id": "cre-film-01",
        "category": "Creative",
        "title": "Film Making",
        "description": "Master the art of storytelling, cinematography, and editing.",
        "estimated_duration": "5 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Screenwriting", "Camera Operation", "Lighting", "Premiere Pro"],
        "expected_outcome": "Direct and edit a professional short film.",
        "roadmap_preview": [
            "Module 1: Pre-production",
            "Module 2: Cinematography",
            "Module 3: Directing",
            "Module 4: Post-production"
        ]
    },
    {
        "id": "custom-01",
        "category": "Custom",
        "title": "Custom Goal",
        "description": "Define your own learning path.",
        "estimated_duration": "Variable",
        "difficulty": "Variable",
        "skills_covered": [],
        "expected_outcome": "Achieve your specific target.",
        "roadmap_preview": []
    }
]

def get_categorized_goals() -> Dict[str, List[Dict[str, Any]]]:
    """Returns the goal library organized by category."""
    categorized = {category: [] for category in GOAL_CATEGORIES}
    categorized["Custom"] = []
    
    for goal in GOAL_LIBRARY:
        cat = goal["category"]
        if cat in categorized:
            categorized[cat].append(goal)
            
    return {k: v for k, v in categorized.items() if v} # filter empty categories
