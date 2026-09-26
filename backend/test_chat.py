from app.database import SessionLocal
from app import models, schemas
import json
import urllib.request
import urllib.error
import os

db = SessionLocal()
user = db.query(models.User).filter(models.User.fullName.like("%Vanitha%")).first()
if user:
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
    docs = db.query(models.Document).filter(models.Document.user_id == user.id).all()
    uploaded_docs_list = [d.document_type for d in docs]
    uploaded_docs_str = ", ".join(uploaded_docs_list) if uploaded_docs_list else "None"
    
    student_profile_text = f"""Name: {user.fullName or 'N/A'}
CGPA: {profile.cgpa if profile.cgpa is not None else 'N/A'}
Annual Income: {f'₹{profile.annualIncome:,.2f}' if profile.annualIncome is not None else 'N/A'}
Category: {profile.category or 'N/A'}
Gender: {profile.gender or 'N/A'}
State: {profile.state or 'N/A'}
Degree: {profile.degree or 'N/A'}
College: {profile.college or 'N/A'}
Uploaded Documents: {uploaded_docs_str}"""

    from app.agent.matching_agent import ScholarshipMatchingAgent
    matching_agent = ScholarshipMatchingAgent(db)
    matches = matching_agent.match_scholarships(user.id)
    
    eligible_list = []
    rejected_list = []
    deadlines_list = []
    
    for m in matches:
        name = m["scholarship_name"]
        amt = m["amount"]
        dl = m["deadline"]
        pct = m["match_percentage"]
        reasons_clean = [r for r in m["reasons"] if "❌" in r]
        reasons_str = ", ".join(reasons_clean) if reasons_clean else "Meets criteria"
        
        deadlines_list.append(f"{name}: {dl}")
        
        if m["status"] in ("Eligible", "Partially Eligible"):
            eligible_list.append(
                f"- Name: {name}\n  Amount: ₹{amt:,}\n  Deadline: {dl}\n  Match Percentage: {pct}%\n  Recommendation Score: {pct}/100"
            )
        else:
            rejected_list.append(f"{name} (Reason: {reasons_str})")
            
    eligible_sch_text = "\n".join(eligible_list) if eligible_list else "None"
    rejected_sch_text = "\n".join(rejected_list) if rejected_list else "None"
    deadlines_text = "\n".join(deadlines_list) if deadlines_list else "None"
    profile_strength_text = f"{profile.completionScore}%" if profile.completionScore is not None else "N/A"
    
    user_question = "Which scholarship is best?"
    
    system_prompt = f"""You are ScholarAI.

You are an intelligent scholarship advisor.

Speak naturally like a real human counselor.

Use the student's profile and scholarship database below.

Student Profile:
{student_profile_text}

Eligible Scholarships:
{eligible_sch_text}

Rejected Scholarships:
{rejected_sch_text}

Current Deadlines:
{deadlines_text}

Profile Strength:
{profile_strength_text}

User Question:
{user_question}

Formatting and Style Rules:
1. Always answer in a clean, user-friendly format.
2. Never output raw markdown symbols like ###, **, or markdown bullet syntax (like * or -). If you want to make bullet points, use plain emojis or simple unicode symbols like •, ✔, 🏆.
3. Do NOT use bolding syntax (e.g. do not write **Word** or __Word__).
4. Do NOT use markdown heading syntax (e.g. do not write #, ##, or ###).
5. Use short headings (as plain text) and numbered points.
6. Keep sentences short.
7. Highlight scholarship names (e.g., using emojis like 🏆, 🥇).
8. Always mention the scholarship amount, deadline, and eligibility.
9. Give personalized advice based on the student's profile.
10. If documents are missing, list them clearly.
11. If comparing multiple scholarships, show a clean structured comparison without markdown tables or symbols.
12. Never repeat information unnecessarily.
13. Do NOT start your response with "Based on the provided profile" or similar repetitive phrases.
14. Keep answers under 300 words unless the user requests more details.

Behavior Rules:
- If the question is about scholarships, answer ONLY using the provided database information.
- If the question is general (example: What is AI?, Explain DBMS, What is Java?), answer using your own general knowledge.
- Never greet the user in every response.
- Never answer with the same fixed message.
- If asked "Which scholarship is best?", compare all eligible scholarships.
- If asked "Why am I not eligible?", explain the exact failed criteria.
- If asked "How can I improve my profile?", suggest improvements based on missing documents, CGPA, income limits and profile completeness.
- If asked "What documents are required?", list required documents.
- If asked "Which deadline is nearest?", sort scholarships by deadline.
"""
    print("--- Constructed System Prompt ---")
    print(system_prompt)
    print("---------------------------------")
    
    api_key = os.environ.get("GEMINI_API_KEY", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}"
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": system_prompt
                    }
                ]
            }
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    import ssl
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, timeout=15, context=context) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print("Response from Gemini API:")
            print(res_data["candidates"][0]["content"]["parts"][0]["text"])
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        print(e.read().decode("utf-8"))
    except Exception as e:
        print(f"Error calling Gemini: {e}")
db.close()
