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
        "id": "custom-01",
        "category": "Custom",
        "title": "Custom Goal",
        "description": "Define your own learning path (e.g. Cooking, Sports, Writing, etc.).",
        "estimated_duration": "Variable",
        "difficulty": "Variable",
        "skills_covered": [],
        "expected_outcome": "Achieve your specific target.",
        "roadmap_preview": []
    },
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
        "id": "tech-ai-01",
        "category": "Technology",
        "title": "AI & Machine Learning",
        "description": "Learn python scripting and machine learning model foundations.",
        "estimated_duration": "4 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Python", "Numpy", "Pandas", "Scikit-Learn"],
        "expected_outcome": "Build data models and analytics predictors.",
        "roadmap_preview": [
            "Module 1: Python programming",
            "Module 2: Advanced OOP",
            "Module 3: Machine learning intro"
        ]
    },
    {
        "id": "tech-ds-01",
        "category": "Technology",
        "title": "Data Science",
        "description": "Understand core linear algebra, pandas, numpy, and data visualizers.",
        "estimated_duration": "4 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Python", "Data Analysis", "Matplotlib", "Model evaluation"],
        "expected_outcome": "Execute advanced data cleaning and predictive modeling.",
        "roadmap_preview": [
            "Module 1: Array Operations",
            "Module 2: Visualization grids",
            "Module 3: Model Metrics"
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
        "description": "Master visual design principles, typography, component styling, and digital graphics.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["Vite", "React components", "CSS layouts"],
        "expected_outcome": "Build visual mockups and layout portfolios.",
        "roadmap_preview": [
            "Module 1: Setup & JSX Basics",
            "Module 2: Components & Props",
            "Module 3: Hooks & State"
        ]
    },
    {
        "id": "lang-learn-01",
        "category": "Languages",
        "title": "Language Learning",
        "description": "Establish vocabulary, speech rhythm, and conversation habits.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["Speech practice", "Sentence patterns", "Conversation drills"],
        "expected_outcome": "Speak confidently in general discussions.",
        "roadmap_preview": [
            "Module 1: Phonetics",
            "Module 2: Sentence Structure",
            "Module 3: Conversational exercises"
        ]
    }
]

def get_categorized_goals() -> Dict[str, List[Dict[str, Any]]]:
    """Returns the goal library organized by category, putting Custom Goal at the very top."""
    categorized = {"Custom": []}
    for category in GOAL_CATEGORIES:
        categorized[category] = []
        
    for goal in GOAL_LIBRARY:
        cat = goal["category"]
        if cat in categorized:
            categorized[cat].append(goal)
            
    return {k: v for k, v in categorized.items() if v} # filter empty categories
