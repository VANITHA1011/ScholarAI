import os, sys
sys.path.insert(0, os.path.abspath('.'))
from app.database import SessionLocal
from app import models
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

db = SessionLocal()
try:
    agent = GoogleScholarshipVerificationAgent(db)
    sch = db.query(models.Scholarship).first()
    print("Testing RPA launch for:", sch.scholarship_name)
    history, sources = agent.run_browser_rpa_searches([
        {"label": "TEST SEARCH", "query": f'"{sch.scholarship_name}" eligibility criteria 2026'}
    ])
    print("Search History:", history)
    print("Sources Extracted:", len(sources))
finally:
    db.close()
