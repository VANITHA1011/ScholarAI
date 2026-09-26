"""
Script to repair corrupted encoding (Mojibake) in MySQL scholarships table:
Replaces corrupted sequences like 'â‚¹' -> '₹' and 'â€“' -> '-'
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

REPLACEMENTS = [
    ("â‚¹", "₹"),
    ("â€“", " - "),
    ("â€”", " - "),
    ("‰¥", "≥ "),
    ("â‰¥", "≥ "),
    ("â€", ""),
    ("â‚¬", ""),
    ("â", ""),
    ("Â", ""),
    ("  -  ", " - "),
    ("≥  ", "≥ ")
]

def fix_encoding():
    db = SessionLocal()
    schs = db.query(models.Scholarship).all()
    print(f"Total scholarships in database: {len(schs)}")

    fixed_count = 0
    for s in schs:
        modified = False
        for col in ["amount", "deadline", "max_family_income", "min_cgpa", "scholarship_name", "provider", "notes", "degree", "category", "state", "gender"]:
            val = getattr(s, col, None)
            if isinstance(val, str):
                orig = val
                cleaned = val
                for bad, good in REPLACEMENTS:
                    cleaned = cleaned.replace(bad, good)
                cleaned = " ".join(cleaned.split()) # clean extra spaces
                if cleaned != orig:
                    setattr(s, col, cleaned)
                    modified = True
                    print(f"  [Row #{s.s_no} - {col}] Before: '{orig}' --> After: '{cleaned}'")
        if modified:
            fixed_count += 1

    db.commit()
    print(f"\n[SUCCESS] Successfully cleaned and corrected characters for {fixed_count} scholarships!")
    db.close()

if __name__ == "__main__":
    fix_encoding()
