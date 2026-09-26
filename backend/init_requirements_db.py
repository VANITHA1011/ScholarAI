import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re
from app.database import engine, SessionLocal, Base
from app.models import Scholarship, ScholarshipRequirement

Base.metadata.create_all(bind=engine)

def parse_income(val):
    if not val:
        return 9999999
    digits = re.sub(r'[^\d]', '', str(val))
    return int(digits) if digits else 9999999

def parse_min_marks(val):
    if not val:
        return None, None
    s = str(val).strip()
    pct_m = re.search(r'(\d+(?:\.\d+)?)\s*%', s)
    if pct_m:
        return float(pct_m.group(1)), "percentage"
    cgpa_m = re.search(r'\b([0-9](?:\.[0-9]+)?)\s*(?:cgpa|gpa)?\b', s, re.IGNORECASE)
    if cgpa_m:
        num = float(cgpa_m.group(1))
        if 1.0 <= num <= 10.0:
            return num, "cgpa"
    return None, None

def generate_requirements_for_scholarship(s):
    reqs = []
    
    # 1. Income
    max_inc = parse_income(s.max_family_income)
    if 0 < max_inc < 9999999:
        reqs.append({
            "requirement_type": "income",
            "operator": "<=",
            "required_value": str(max_inc),
            "description": f"Family annual income must be ≤ ₹{max_inc:,.0f}"
        })
        
    # 2. Gender
    gender_str = str(s.gender or "").strip().lower()
    cat_str = str(s.category or "").strip().lower()
    notes_str = str(s.notes or "").strip().lower()
    if gender_str in ("female", "girl", "girls", "women") or "girl" in cat_str or "girls" in cat_str or "women" in cat_str:
        reqs.append({
            "requirement_type": "gender",
            "operator": "=",
            "required_value": "Female",
            "description": "Applicant must be Female"
        })
    elif gender_str in ("male", "boy", "boys") or "boys" in cat_str:
        reqs.append({
            "requirement_type": "gender",
            "operator": "=",
            "required_value": "Male",
            "description": "Applicant must be Male"
        })

    # 3. State
    state_str = str(s.state or "").strip()
    if state_str and state_str.lower() not in ("all india", "any", "all", "india", "none", ""):
        reqs.append({
            "requirement_type": "state",
            "operator": "=",
            "required_value": state_str,
            "description": f"Applicant must be a resident of {state_str}"
        })

    # 4. Category & Quota
    if "minority" in cat_str or "muslim" in cat_str or "christian" in cat_str:
        reqs.append({
            "requirement_type": "minority",
            "operator": "=",
            "required_value": "true",
            "description": "Must belong to a notified Minority community (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)"
        })
    elif "disability" in cat_str or "pwd" in cat_str:
        reqs.append({
            "requirement_type": "disability",
            "operator": "=",
            "required_value": "true",
            "description": "Must have certified benchmark physical disability (≥40% PwD)"
        })
    elif cat_str in ("sc", "scheduled caste"):
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "SC",
            "description": "Must belong to Scheduled Caste (SC)"
        })
    elif cat_str in ("st", "scheduled tribe"):
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "ST",
            "description": "Must belong to Scheduled Tribe (ST)"
        })
    elif cat_str in ("sc/st", "sc/st/scc", "sc/st/scc"):
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "SC,ST,SCC",
            "description": "Must belong to SC or ST category"
        })
    elif cat_str in ("obc", "other backward class"):
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "OBC,BC,MBC,BCM,DNC",
            "description": "Must belong to OBC / Backward Classes"
        })
    elif "bc/mbc" in cat_str or "bc/mbc/dnc" in cat_str or "bc / mbc" in cat_str:
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "BC,MBC,BCM,DNC,OBC",
            "description": "Must belong to BC, MBC, or DNC category"
        })
    elif "sc/st/obc" in cat_str:
        reqs.append({
            "requirement_type": "category",
            "operator": "IN",
            "required_value": "SC,ST,OBC,BC,MBC,BCM,DNC,Minority",
            "description": "Must belong to SC, ST, OBC, or Minority category"
        })

    # 5. Academic threshold
    min_val, val_type = parse_min_marks(s.min_cgpa)
    if val_type == "percentage":
        reqs.append({
            "requirement_type": "percentage",
            "operator": ">=",
            "required_value": str(min_val),
            "description": f"Must have minimum {min_val:g}% in qualifying examination"
        })
    elif val_type == "cgpa":
        reqs.append({
            "requirement_type": "cgpa",
            "operator": ">=",
            "required_value": str(min_val),
            "description": f"Must have minimum {min_val} CGPA"
        })
    elif s.min_cgpa and any(term in s.min_cgpa.lower() for term in ["percentile", "jee", "top 1%", "aptitude", "selection test"]):
        reqs.append({
            "requirement_type": "academic_merit",
            "operator": "MERIT",
            "required_value": s.min_cgpa.strip(),
            "description": f"Merit criteria: {s.min_cgpa.strip()}"
        })

    # 6. Degree / Educational Level
    deg_str = str(s.degree or "").strip().lower()
    if "class 1–10" in deg_str or "class 1 to 10" in deg_str:
        reqs.append({
            "requirement_type": "school_level",
            "operator": "=",
            "required_value": "Class 1-10",
            "description": "Must be currently enrolled in School (Class 1 to 10)"
        })
    elif "class 9–12" in deg_str or "class 9 to 12" in deg_str or "class 11–12" in deg_str or "class 11 to 12" in deg_str:
        reqs.append({
            "requirement_type": "school_level",
            "operator": "IN",
            "required_value": "Class 9-12",
            "description": "Must be currently enrolled in High School (Class 9 to 12)"
        })
    elif "m.phil" in deg_str or "phd" in deg_str:
        reqs.append({
            "requirement_type": "degree",
            "operator": "IN",
            "required_value": "PhD,M.Phil,Doctoral",
            "description": "Must be enrolled in M.Phil or PhD program"
        })
    elif "pg (india/abroad)" in deg_str or "postgraduate" in deg_str or "pg (" in deg_str:
        reqs.append({
            "requirement_type": "degree",
            "operator": "IN",
            "required_value": "PG,Masters,Postgraduate,MBA,M.Tech,M.Sc",
            "description": "Must be enrolled in Postgraduate (PG) degree"
        })
    elif "b.tech (civil)" in deg_str or "construction" in deg_str:
        reqs.append({
            "requirement_type": "course_branch",
            "operator": "CONTAINS",
            "required_value": "Civil,Construction",
            "description": "Must be studying Civil or Construction Engineering"
        })
    elif "b.sc/m.sc (science)" in deg_str or "pure sciences" in deg_str:
        reqs.append({
            "requirement_type": "course_branch",
            "operator": "CONTAINS",
            "required_value": "Science,B.Sc,M.Sc,Physics,Chemistry,Maths,Biology",
            "description": "Must be studying Natural / Pure Sciences (B.Sc or Integrated M.Sc)"
        })
    elif any(term in deg_str for term in ["diploma/ug technical", "ug technical", "b.tech / b.e.", "b.tech", "ug engineering"]):
        reqs.append({
            "requirement_type": "degree",
            "operator": "IN",
            "required_value": "B.E.,B.Tech,Engineering,UG,Diploma,Technical",
            "description": "Must be enrolled in Under-Graduate (UG) Technical or Engineering Degree"
        })
    elif any(term in deg_str for term in ["ug (1st year onwards)", "1st year ug", "ug/diploma", "ug (all streams", "ug (engineering"]):
        reqs.append({
            "requirement_type": "degree",
            "operator": "IN",
            "required_value": "UG,Undergraduate,B.E.,B.Tech,B.Sc,B.Com,B.A.,Diploma",
            "description": "Must be enrolled in Undergraduate (UG) Degree program"
        })

    # 7. Special quota in notes
    if "govt/aided" in notes_str or "tamil-medium" in notes_str:
        reqs.append({
            "requirement_type": "govt_school_quota",
            "operator": "=",
            "required_value": "true",
            "description": "Must have studied Class 6–12 in Tamil Nadu Government or Aided School"
        })
    if "single girl child" in notes_str:
        reqs.append({
            "requirement_type": "single_girl_child",
            "operator": "=",
            "required_value": "true",
            "description": "Must be the single / only girl child of parents"
        })
    if "first-generation" in notes_str:
        reqs.append({
            "requirement_type": "first_graduate_priority",
            "operator": "=",
            "required_value": "true",
            "description": "Priority for First Generation Graduate in family"
        })

    return reqs

db = SessionLocal()
# Clear existing requirements and populate fresh
db.query(ScholarshipRequirement).delete()
db.commit()

schs = db.query(Scholarship).all()
total_created = 0
for s in schs:
    req_dicts = generate_requirements_for_scholarship(s)
    for rd in req_dicts:
        req_obj = ScholarshipRequirement(
            scholarship_id=s.s_no,
            requirement_type=rd["requirement_type"],
            operator=rd["operator"],
            required_value=rd["required_value"],
            description=rd["description"],
            source_url=s.official_url,
            is_mandatory=True
        )
        db.add(req_obj)
        total_created += 1

db.commit()

print(f"SUCCESS: Created {total_created} dynamic requirements across {len(schs)} scholarships in scholarship_requirements table!")
db.close()
