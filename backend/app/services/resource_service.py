import os
import json
from app.core.logger import logger
from typing import Dict, List, Any

class ResourceService:
    @staticmethod
    def get_all_resources() -> Dict[str, List[Dict[str, Any]]]:
        """
        Loads and returns all built-in question resource libraries from JSON files.
        """
        logger.info("Loading built-in resource library items.")
        resource_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources")
        
        resource_files = {
            "dsa_must_75": "must75.json",
            "dsa_blind_75": "blind75.json",
            "python_interview_40": "python40.json",
            "sql_25": "sql25.json",
            "java_core": "java.json"
        }
        
        library = {}
        
        for key, filename in resource_files.items():
            file_path = os.path.join(resource_dir, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        library[key] = json.load(f)
                except Exception as e:
                    logger.error(f"Error reading resource file {file_path}: {e}")
                    library[key] = []
            else:
                logger.warning(f"Resource library file not found: {file_path}")
                library[key] = []
                
        return library
