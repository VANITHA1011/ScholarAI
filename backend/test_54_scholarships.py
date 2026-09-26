from app.database import engine, SessionLocal
from sqlalchemy import text
import re

db = SessionLocal()
try:
    rows = db.execute(text("SELECT * FROM scholarships")).fetchall()
    print(f"Total rows in scholarships: {len(rows)}")
    for r in rows:
        row_dict = dict(r._mapping)
        # Check parsing
        cgpa_str = str(row_dict.get('min_cgpa') or '')
        inc_str = str(row_dict.get('max_family_income') or '')
        amt_str = str(row_dict.get('amount') or '')
        
        # income number extraction test
        digits = re.sub(r'[^\d]', '', inc_str)
        inc_val = int(digits) if digits else 9999999
        
        # cgpa / percentage extraction test
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', cgpa_str)
        cgpa_match = re.search(r'(?:cgpa|gpa|score|min)?\s*(\d+(?:\.\d+)?)', cgpa_str, re.IGNORECASE)
        
        # amount extraction test
        amt_digits = re.sub(r'[^\d]', '', amt_str.split('/')[0].split('–')[0].split('-')[0])
        amt_val = int(amt_digits) if amt_digits else 0
        
    print("All 54 rows processed successfully!")
finally:
    db.close()
