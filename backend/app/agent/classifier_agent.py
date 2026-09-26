import re

class DocumentClassificationAgent:
    """
    Agent: Document Classification Agent
    Purpose: Classifies the uploaded file based on rule-based keyword patterns.
    """
    def __init__(self):
        # Specific keywords and layout patterns for classification mapping
        self.rules = {
            "aadhaar": [
                "government of india", "unique identification", 
                "aadhaar", "enrollment no", "enrolment no"
            ],
            "income": [
                "income certificate", "annual income", "revenue department", 
                "tahsildar", "tashildar", "family income"
            ],
            "community": [
                "community certificate", "scheduled caste", "backward class", 
                "most backward class", "mbc", "obc", "caste certificate"
            ],
            "tenth": [
                "secondary school leaving", "sslc", "ssl certificate", "class x", "class 10"
            ],
            "twelfth": [
                "higher secondary", "hsc", "h.s.c", "class xii", "class 12"
            ],
            "college": [
                "statement of grades", "grades", "provisional certificate", 
                "consolidated mark", "semester", "cgpa", "sgpa", "transcript", 
                "grade point", "sona college", "student id card", "identity card", "roll number", "roll no", "valid uptol", "student identity card"
            ],
            "disability": [
                "certificate of disability", "disability", "disabilities",
                "medical board", "rights of persons with disabilities",
                "udid", "locomotor disability", "permanent disability assessment",
                "benchmark disability"
            ],
            "sportsQuota": [
                "sports development authority", "sports certificate", "merit certificate",
                "sports quota", "national championship", "state championship",
                "inter-university", "gold medalist", "athletics", "tournament"
            ],
            "firstGraduate": [
                "first graduate certificate", "first generation graduate",
                "no graduate in family", "tahsildar", "first graduate",
                "first-graduate", "degree in family"
            ],
            "ncc": [
                "national cadet corps", "ncc", "directorate general ncc",
                "cadet", "c certificate", "b certificate", "battalion", "suo"
            ],
            "nss": [
                "national service scheme", "nss", "special camping programme",
                "nss volunteer", "nss merit certificate", "240 hours"
            ],
            "minority": [
                "minority certificate", "religious minority", "linguistic minority",
                "minority community", "national commission for minorities"
            ]
        }

    def classify(self, text: str) -> str:
        text_lower = text.lower()
        scores = {}

        for doc_type, keywords in self.rules.items():
            matches = 0
            for kw in keywords:
                if kw in text_lower:
                    matches += 1
            scores[doc_type] = matches

        # Find the type with highest matches
        best_type, max_score = max(scores.items(), key=lambda x: x[1])

        # Require at least 1 keyword match to classify; otherwise Unknown
        if max_score > 0:
            return best_type
        return "Unknown"
