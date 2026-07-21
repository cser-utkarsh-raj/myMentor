from typing import List, Dict, Any

GOAL_CATEGORIES = [
    "Technology",
    "Business",
    "Creative",
    "Cybersecurity",
    "Finance",
    "Languages"
]

GOAL_LIBRARY = [
    {
        "id": "custom-01",
        "category": "Custom",
        "title": "Custom Goal",
        "description": "Define your own customized learning path (e.g. Farming, Music, Cooking, Writing).",
        "estimated_duration": "Variable",
        "difficulty": "Variable",
        "skills_covered": ["Personal Mastery", "Tailored Topics"],
        "expected_outcome": "Achieve your specific target with custom AI mentoring.",
        "roadmap_preview": [
            "Module 1: Tailored Core Foundations",
            "Module 2: Practical Drills & Application",
            "Module 3: Mastery Capstone Project"
        ]
    },
    {
        "id": "tech-fullstack-01",
        "category": "Technology",
        "title": "Full-Stack Software Engineer",
        "description": "Master complete web development: modern React UI, Node/Python REST APIs, relational databases, and Cloud deployment.",
        "estimated_duration": "3 months",
        "difficulty": "Intermediate",
        "skills_covered": ["React", "Node.js", "Python", "SQL", "Docker", "REST APIs"],
        "expected_outcome": "Build and deploy production-ready full-stack applications.",
        "roadmap_preview": [
            "Track 1: Modern Frontend UI Engineering (React & Tailwind)",
            "Track 2: Scalable Backend API Architecture & Databases",
            "Track 3: DevOps, Authentication & Cloud Deployment"
        ]
    },
    {
        "id": "tech-dev-01",
        "category": "Technology",
        "title": "Backend Engineering & API Design",
        "description": "Deep dive into server-side development, database query optimization, system design, and microservices architecture.",
        "estimated_duration": "3 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Python", "FastAPI", "PostgreSQL", "System Design", "Docker"],
        "expected_outcome": "Design high-throughput, secure backend microservices.",
        "roadmap_preview": [
            "Track 1: Advanced Server Language & OOP Mechanics",
            "Track 2: Relational Schema Design & Query Optimization",
            "Track 3: System Design, Caching & Distributed Systems"
        ]
    },
    {
        "id": "tech-ai-01",
        "category": "Technology",
        "title": "AI & Machine Learning Engineer",
        "description": "Learn statistical modeling, neural networks, PyTorch, model evaluation, and LLM fine-tuning.",
        "estimated_duration": "4 months",
        "difficulty": "Advanced",
        "skills_covered": ["Python", "NumPy", "Pandas", "Scikit-Learn", "PyTorch", "LLMs"],
        "expected_outcome": "Train, evaluate, and deploy machine learning and LLM models.",
        "roadmap_preview": [
            "Track 1: Data Manipulation & Exploratory Analysis",
            "Track 2: Supervised & Unsupervised Machine Learning",
            "Track 3: Deep Neural Networks & LLM Integration"
        ]
    },
    {
        "id": "tech-ds-01",
        "category": "Technology",
        "title": "Data Science & Analytics",
        "description": "Master exploratory data analysis, statistical modeling, data visualization, and predictive analytics.",
        "estimated_duration": "3 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Python", "SQL", "Pandas", "Matplotlib", "Statistics", "PowerBI"],
        "expected_outcome": "Transform raw datasets into actionable business intelligence dashboards.",
        "roadmap_preview": [
            "Track 1: SQL Data Extraction & Wrangling",
            "Track 2: Exploratory Data Analysis & Visualization",
            "Track 3: Statistical Hypothesis Testing & Machine Learning Models"
        ]
    },
    {
        "id": "tech-devops-01",
        "category": "Technology",
        "title": "DevOps & Cloud Infrastructure",
        "description": "Master containerization, CI/CD automated pipelines, Infrastructure as Code, and AWS cloud management.",
        "estimated_duration": "3 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Docker", "Kubernetes", "AWS", "Terraform", "GitHub Actions"],
        "expected_outcome": "Automate cloud deployment pipelines and manage scalable Kubernetes infrastructure.",
        "roadmap_preview": [
            "Track 1: Linux Administration & Containerization (Docker)",
            "Track 2: Cloud Systems (AWS) & Infrastructure as Code (Terraform)",
            "Track 3: CI/CD Pipelines & Kubernetes Orchestration"
        ]
    },
    {
        "id": "sec-cyber-01",
        "category": "Cybersecurity",
        "title": "Cybersecurity & Ethical Hacking",
        "description": "Understand computer networking, web application vulnerability exploitation, penetration testing, and security defense.",
        "estimated_duration": "4 months",
        "difficulty": "Intermediate",
        "skills_covered": ["Networking", "Wireshark", "OWASP Top 10", "Burp Suite", "Penetration Testing"],
        "expected_outcome": "Audit application security, identify exploits, and secure enterprise networks.",
        "roadmap_preview": [
            "Track 1: Computer Networking & Traffic Analysis",
            "Track 2: Web Application Security & OWASP Penetration Testing",
            "Track 3: Network Defense, Hardening & Incident Response"
        ]
    },
    {
        "id": "cre-uiux-01",
        "category": "Creative",
        "title": "UI/UX Design & Product Aesthetics",
        "description": "Master user experience research, visual hierarchy, Figma prototyping, component systems, and design tokens.",
        "estimated_duration": "2 months",
        "difficulty": "Beginner",
        "skills_covered": ["Figma", "User Research", "Wireframing", "Design Systems", "Prototyping"],
        "expected_outcome": "Deliver high-fidelity interactive design prototypes and visual design systems.",
        "roadmap_preview": [
            "Track 1: UX Research & User Journey Mapping",
            "Track 2: Visual Layout, Typography & Color Systems",
            "Track 3: Figma Interactive Component Systems & Micro-Interactions"
        ]
    },
    {
        "id": "biz-prod-01",
        "category": "Business",
        "title": "Product Management & Growth Strategy",
        "description": "Learn product visioning, user feedback loops, Agile sprint execution, prioritization frameworks, and growth metrics.",
        "estimated_duration": "2 months",
        "difficulty": "Beginner",
        "skills_covered": ["Product Strategy", "Agile/Scrum", "A/B Testing", "Growth Metrics"],
        "expected_outcome": "Lead cross-functional product squads from discovery to market launch.",
        "roadmap_preview": [
            "Track 1: Product Discovery & User Needs Validation",
            "Track 2: Agile Execution, User Stories & Feature Prioritization",
            "Track 3: Product Analytics, Funnel Optimization & Growth Strategy"
        ]
    },
    {
        "id": "fin-invest-01",
        "category": "Finance",
        "title": "Financial Literacy & Investment Strategy",
        "description": "Understand financial accounting, company valuation models, asset allocation, stock analysis, and personal wealth planning.",
        "estimated_duration": "2 months",
        "difficulty": "Beginner",
        "skills_covered": ["Financial Statements", "Valuation", "Asset Allocation", "Portfolio Risk"],
        "expected_outcome": "Perform fundamental company analysis and build diversified investment portfolios.",
        "roadmap_preview": [
            "Track 1: Financial Statements & Cash Flow Analysis",
            "Track 2: Fundamental Valuation & Asset Classes",
            "Track 3: Portfolio Construction, Risk Management & Wealth Strategy"
        ]
    },
    {
        "id": "biz-mktg-01",
        "category": "Business",
        "title": "Digital Marketing & Brand Strategy",
        "description": "Learn search engine optimization (SEO), paid ad acquisition, viral content strategy, and customer retention funnels.",
        "estimated_duration": "2 months",
        "difficulty": "Beginner",
        "skills_covered": ["SEO", "Google/Meta Ads", "Content Marketing", "Funnel Analytics"],
        "expected_outcome": "Build scalable customer acquisition funnels and brand presence.",
        "roadmap_preview": [
            "Track 1: SEO, Keyword Research & Organic Content Strategy",
            "Track 2: Paid Acquisition Channels & Ad Campaign Optimization",
            "Track 3: Conversion Rate Optimization & Retention Funnels"
        ]
    },
    {
        "id": "lang-spanish-01",
        "category": "Languages",
        "title": "Spanish Language Conversational Mastery",
        "description": "Establish core Spanish vocabulary, grammar patterns, active listening, and practical speech fluency.",
        "estimated_duration": "3 months",
        "difficulty": "Beginner",
        "skills_covered": ["Phonetics", "Verb Conjugation", "Vocabulary Drills", "Conversation"],
        "expected_outcome": "Converse fluently in everyday personal and professional scenarios.",
        "roadmap_preview": [
            "Track 1: Phonetics, Essential Vocabulary & Daily Phrases",
            "Track 2: Grammar Foundations & Verb Tense Mechanics",
            "Track 3: Conversational Immersion & Listening Drills"
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
            
    return {k: v for k, v in categorized.items() if v}
