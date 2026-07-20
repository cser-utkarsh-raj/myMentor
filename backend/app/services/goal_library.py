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
        "id": "tech-dev-01",
        "category": "Technology",
        "title": "Software Development",
        "description": "Master programming languages, design patterns, and software engineering fundamentals.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["Programming", "APIs", "Databases", "Version Control"],
        "expected_outcome": "Build functional, well-structured software applications.",
        "roadmap_preview": [
            "Module 1: Code Basics & Flow Control",
            "Module 2: Structured Data & Objects",
            "Module 3: Relational Databases",
            "Module 4: Application Projects"
        ]
    },
    {
        "id": "biz-mktg-01",
        "category": "Business",
        "title": "Business & Marketing",
        "description": "Learn core business principles, user growth, and digital branding strategies.",
        "estimated_duration": "2 months",
        "difficulty": "Beginner",
        "skills_covered": ["Product Strategy", "Growth Marketing", "Campaign Analytics"],
        "expected_outcome": "Design business plans and execute marketing campaigns.",
        "roadmap_preview": [
            "Module 1: Value Proposition",
            "Module 2: Growth Channels",
            "Module 3: Execution Plan"
        ]
    },
    {
        "id": "cre-design-01",
        "category": "Creative",
        "title": "Creative Design",
        "description": "Master visual design principles, color theory, layout editing, and digital design.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["UI Design", "Visual Arts", "Layout Editing"],
        "expected_outcome": "Build visual mockups and layout portfolios.",
        "roadmap_preview": [
            "Module 1: Composition & Color",
            "Module 2: Layout Design",
            "Module 3: Project Design"
        ]
    },
    {
        "id": "custom-01",
        "category": "Custom",
        "title": "Custom Goal",
        "description": "Define your own custom learning path (e.g. Cooking, Sports, Writing, etc.).",
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
