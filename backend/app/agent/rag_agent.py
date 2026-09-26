import os
from dotenv import load_dotenv
load_dotenv()
import re
import json
import urllib.request
import urllib.parse
from datetime import date, datetime
from typing import List, Dict
from sqlalchemy.orm import Session
from .. import models, crud

# ─────────────────────────────────────────────
# Knowledge Base Document Corpus
# ─────────────────────────────────────────────
KNOWLEDGE_BASE = [
    {
        "id": "kb_nsp",
        "title": "National Scholarship Portal (NSP) — Merit Scholarship",
        "url": "https://scholarships.gov.in",
        "content": """
        The NSP Merit Scholarship offers up to ₹50,000 annually for undergraduate and postgraduate students from low-income families across India.
        Eligibility Requirements:
        - Minimum CGPA: 8.0 (or 80% equivalent in board exams).
        - Family Annual Income limit: ₹2,00,000 per annum (verified by Revenue Dept. Tahsildar certificate).
        - Required Documents: Aadhaar Card, Income Certificate, College Bonafide Certificate, 10th & 12th Marksheets.
        - Applicable Categories: General, BC, MBC, SC, ST across all Indian states.
        - Submission Deadline: August 31 annually.
        - No active arrears allowed for renewal.
        """
    },
    {
        "id": "kb_pragati",
        "title": "AICTE Pragati Scholarship for Girls",
        "url": "https://www.aicte-india.org/bureaus/rifd/pragati",
        "content": """
        The AICTE Pragati Scholarship provides ₹50,000 per annum for female students in Technical Degree or Diploma courses at AICTE-approved institutions.
        Eligibility Requirements:
        - Must be a Female student (mandatory gender criterion).
        - Admitted to 1st or 2nd year of UG degree/diploma (AICTE approved course).
        - Maximum 2 female children per family eligible.
        - Family Annual Income limit: ₹8,00,000 per annum.
        - Required Documents: College Admission Letter, Aadhaar, Income Certificate, Bank Passbook, Institution Bonafide.
        - Application Window: Opens annually in August/September.
        """
    },
    {
        "id": "kb_postmatric",
        "title": "Post-Matric Scholarship & First Generation Graduate Scheme",
        "url": "https://scholarships.gov.in/public/schemeData",
        "content": """
        Post-Matric Scholarship covers 100% tuition fees and maintenance allowance for SC/ST, BC/MBC, and First Generation Graduate students.
        Eligibility Requirements:
        - Category: SC/ST/OBC/MBC/Minority verified via official Community Certificate.
        - First Graduate status certified by Tahsildar Revenue Department.
        - Family Annual Income limits: ₹2,50,000 for SC/ST; ₹2,00,000 for BC/MBC.
        - No active arrears for annual renewal. Minimum 75% attendance required.
        - Required Documents: Community Certificate, Income Certificate, First Graduate Certificate, Marksheets.
        """
    },
    {
        "id": "kb_verification",
        "title": "ScholarAI Document Verification & OCR Engine",
        "url": None,
        "content": """
        Uploaded PDF & Image documents are processed via automated OCR (Optical Character Recognition) powered by Tesseract.
        How Verification Works:
        1. Text Extraction: Extracts text from Aadhaar, Income, Community, and Marksheet uploads.
        2. Field Matching: Parses Name, DOB, Gender, Income, Category, and CGPA using pattern recognition.
        3. Cross-Audit: Compares parsed values against Student Profile to catch name, income, or mark discrepancies.
        4. Status outcomes: Verified, Mismatch, Pending.
        """
    },
    {
        "id": "kb_financial_aid_faq",
        "title": "General Scholarship Policies & Rules FAQ",
        "url": "https://scholarships.gov.in",
        "content": """
        General Higher Education Scholarship Rules:
        - Merit-cum-Means: Scholarships awarded based on academic performance combined with family income limits.
        - Multiple Scholarships: Government schemes prohibit holding two government tuition scholarships simultaneously.
        - First Graduate Certificate: Issued by Revenue Department (Tahsildar) certifying no family member has completed a degree.
        - Renewal Criteria: Annual renewal requires maintaining minimum 75% attendance and clearing exams without arrears.
        """
    },
    {
        "id": "kb_eligibility_rules",
        "title": "Official Scholarship Eligibility Rulebook",
        "url": "https://scholarships.gov.in",
        "content": """
        General eligibility policies:
        1. Academic standing: No active arrears for renewal. Min CGPA: NSP=8.0, Pragati=7.5, First Graduate=7.0, State Post-Matric=6.0.
        2. Family Income verification: Certificate issued within last 6 months by Revenue Department.
        3. Income limits: NSP ₹2,00,000; Pragati ₹8,00,000; State Post-Matric SC/ST ₹2,50,000; BC/MBC ₹2,00,000.
        4. Simultaneous schemes: Students prohibited from receiving tuition fee benefits from more than one government scheme.
        """
    },
    {
        "id": "kb_document_guidelines",
        "title": "ScholarAI Document Submission & Upload Guidelines",
        "url": "https://scholarships.gov.in",
        "content": """
        Required Document Specifications:
        - Aadhaar Card: Name, DOB, gender, state, 12-digit UID visible. Name must exactly match profile.
        - Income Certificate: Parent's name, annual family income, tahsildar signature, issued within 6 months.
        - Community Certificate: Caste classification (SC, ST, BC, MBC, OBC) matching profile.
        - Marksheets (10th/12th/College): CGPA or aggregate percentage. Mismatch with profile will flag discrepancy.
        - Institution Bonafide: Required for NSP and Pragati to verify regular study status.
        """
    }
]

# Scholarship-specific required documents
SCHOLARSHIP_DOCUMENTS = {
    "nsp merit": ["Aadhaar Card", "Income Certificate (Tahsildar)", "College Bonafide Certificate", "10th Marksheet", "12th Marksheet"],
    "pragati": ["Aadhaar Card", "Income Certificate", "College Admission Letter", "Bank Passbook", "Institution Bonafide"],
    "post-matric": ["Community Certificate", "Income Certificate", "Marksheets (10th/12th)", "Bonafide Certificate"],
    "first graduate": ["Community Certificate", "First Graduate Certificate (Tahsildar)", "Income Certificate", "Aadhaar Card"],
    "sona": ["Aadhaar Card", "College ID / Bonafide Certificate", "10th Marksheet", "12th Marksheet"],
    "state": ["Community Certificate", "Income Certificate", "Aadhaar Card", "Marksheets"],
}

# Official source URLs per provider
PROVIDER_URLS = {
    "aicte": "https://www.aicte-india.org/bureaus/rifd/pragati",
    "nsp": "https://scholarships.gov.in",
    "national scholarship": "https://scholarships.gov.in",
    "sona college": "https://www.sonatech.ac.in",
    "state": "https://www.tnesevai.tn.gov.in",
    "tamil nadu": "https://www.tnesevai.tn.gov.in",
    "tamilnadu": "https://www.tnesevai.tn.gov.in",
}

# ─────────────────────────────────────────────
# Local Fallback (ONLY used when Gemini is unavailable)
# Gemini is the primary handler for casual + general queries.
# These are emergency safety nets, NOT a replacement for Gemini.
# ─────────────────────────────────────────────

CASUAL_FALLBACK = {
    "hello": "Hello! 👋 I'm ScholarAI — your AI scholarship advisor. Ask me about eligibility, deadlines, or documents!",
    "hi": "Hi there! 👋 I'm ScholarAI. How can I help you today?",
    "hey": "Hey! 👋 I'm ScholarAI. Try asking about your scholarship eligibility or upcoming deadlines!",
    "how are you": "I'm doing great! 😊 I'm ScholarAI — always ready to help with scholarships. What can I help you with?",
    "how r u": "I'm great, thanks! 😊 Ask me anything about scholarships, eligibility, or documents!",
    "thank you": "You're welcome! 😊 Let me know if you need anything else about scholarships!",
    "thanks": "You're welcome! Happy to help. 😊",
    "bye": "Goodbye! 👋 Good luck with your applications!",
    "who are you": "I am **ScholarAI** — an Agentic AI Scholarship Advisor built with:\n\n• **Matching Agent** — finds scholarships matching your profile\n• **OCR Agent** — reads uploaded certificates\n• **Verification Agent** — cross-checks documents vs. profile\n• **RAG Agent** — answers from a grounded knowledge base\n• **Supervisor Agent** — orchestrates everything\n\nPowered by Google Gemini AI + MySQL scholarship database.",
    "what can you do": "I can help you with:\n\n• ✔ Scholarship eligibility checks\n• ✔ Compare scholarships side-by-side\n• ✔ Deadline reminders with urgency indicators\n• ✔ Required documents per scholarship\n• ✔ Best scholarship recommendations\n• ✔ Profile improvement suggestions\n• ✔ Certificate verification via OCR\n• ✔ General knowledge questions\n\nTry: \"Why am I eligible?\" or \"Best scholarship for me\"",
}

# Intent classifier — routes queries to the right agent/pipeline
def _classify_intent(query: str) -> str:
    """Classify user query into: CURRENT_AFFAIRS, CASUAL, GENERAL_KNOWLEDGE, SCHOLARSHIP, or UNKNOWN."""
    q_lower = query.lower().strip()
    q_words = set(re.findall(r'\w+', q_lower))

    # 1. Scholarship FIRST (more specific — prevents false matches)
    sch_keywords = [
        "scholarship", "eligible", "eligibility", "deadline", "apply", "document",
        "nsp", "pragati", "marksheet", "income", "community", "caste", "aadhaar",
        "adhaar", "marks", "cgpa", "first graduate", "verify", "verification",
        "mismatch", "fee", "profile", "improve", "strength", "compare", "best",
        "recommend", "required documents", "upload", "certificate", "bonafide",
        "ocr", "aicte", "sona", "post-matric"
    ]
    # If it asks specifically about scholarship features/deadlines
    if any(k in q_lower for k in sch_keywords) and not any(k in q_lower for k in ["news", "chief minister", "prime minister", "collector", "district collector", "magistrate", "commissioner", "stock market", "recruitment process", "infosys", "tcs"]):
        return "SCHOLARSHIP"

    # 2. Current Affairs & Time-Sensitive Government / Official / News Information
    current_affairs_triggers = [
        "current", "latest", "today", "yesterday", "this week", "recently", "now",
        "2026", "upcoming", "latest update", "current affairs", "news", "headlines",
        "collector", "district collector", "magistrate", "commissioner", "superintendent of police", "sp", "dgp",
        "chief minister", "prime minister", "president", "governor", "election",
        "vice chancellor", "registrar", "stock market", "sensex", "nifty", "recruitment", "hiring update",
        "who is the chief minister", "who is the prime minister", "who is the pm", "who is the cm", "who is the collector",
        "who is the district collector", "current collector", "salem collector", "chennai collector", "district magistrate"
    ]
    if any(trigger in q_lower for trigger in current_affairs_triggers):
        return "CURRENT_AFFAIRS"

    # 3. Casual / conversational (use word boundaries for short words)
    multi_word_casual = [
        "how are you", "how r u", "good morning", "good evening", "good night",
        "thank you", "who are you", "what can you do", "tell me a joke",
        "any joke", "tell joke"
    ]
    for trigger in multi_word_casual:
        if trigger in q_lower:
            return "CASUAL"
    single_word_casual = {"hello", "hi", "hey", "thanks", "bye", "joke", "funny"}
    if q_words & single_word_casual:
        return "CASUAL"

    # 4. General knowledge (handled by Gemini)
    gen_patterns = [
        "what is", "explain", "define", "tell me about", "how does", "who is",
        "who was", "what are", "describe", "meaning of", "difference between",
        "how to", "why is", "when was", "where is", "can you explain"
    ]
    if any(p in q_lower for p in gen_patterns):
        return "GENERAL_KNOWLEDGE"

    # 5. Unknown — still try Gemini
    return "UNKNOWN"


def live_web_search(query: str, max_results: int = 5) -> List[Dict]:
    """Retrieve real-time live search context from official government domains (.nic.in), Google News RSS, and DDG."""
    results = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
    import ssl
    ctx = ssl._create_unverified_context()

    # 1. Direct Web Search (prioritizes official .nic.in / .gov.in portal pages)
    try:
        html_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(html_url, headers=headers)
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            html_text = resp.read().decode("utf-8", errors="ignore")
            snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', html_text, re.DOTALL)
            urls = re.findall(r'<a class="result__url"[^>]*href="([^"]*)"[^>]*>(.*?)</a>', html_text, re.DOTALL)
            for i in range(min(len(snippets), len(urls), max_results)):
                raw_u, raw_t = urls[i]
                raw_s = snippets[i]
                clean_u = urllib.parse.unquote(raw_u)
                if "uddg=" in clean_u:
                    clean_u = clean_u.split("uddg=")[1].split("&")[0]
                clean_t = re.sub(r'<[^>]+>', '', raw_t).strip()
                clean_s = re.sub(r'<[^>]+>', '', raw_s).strip()
                if clean_s:
                    results.append({
                        "title": clean_t or "Official Portal Record",
                        "snippet": clean_s,
                        "url": clean_u
                    })
    except Exception:
        pass

    # 2. Google News RSS for live/current events / today news / headlines / official orders
    is_news = any(k in query.lower() for k in ["today", "latest", "news", "current", "stock", "update", "yesterday", "recently", "2026", "recruitment", "minister", "collector"])
    if is_news:
        try:
            encoded_q = urllib.parse.quote(query)
            rss_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-IN&gl=IN&ceid=IN:en"
            req = urllib.request.Request(rss_url, headers=headers)
            with urllib.request.urlopen(req, timeout=4, context=ctx) as resp:
                xml_data = resp.read().decode("utf-8", errors="ignore")
                items = re.findall(r"<item>(.*?)</item>", xml_data, re.DOTALL)
                for item in items[:2]:
                    t_match = re.search(r"<title>(.*?)</title>", item, re.DOTALL)
                    l_match = re.search(r"<link>(.*?)</link>", item, re.DOTALL)
                    d_match = re.search(r"<pubDate>(.*?)</pubDate>", item, re.DOTALL)
                    if t_match:
                        title = t_match.group(1).replace("<![CDATA[", "").replace("]]>", "").strip()
                        link = l_match.group(1).strip() if l_match else "https://news.google.com"
                        pub_date = d_match.group(1).strip() if d_match else ""
                        results.append({
                            "title": title,
                            "snippet": f"News Headline ({pub_date}): {title}",
                            "url": link
                        })
        except Exception:
            pass

    # 3. Wikipedia API Search for factual background / dignitaries
    if len(results) < 2:
        try:
            wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&utf8=&format=json"
            req = urllib.request.Request(wiki_url, headers=headers)
            with urllib.request.urlopen(req, timeout=4, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                search_items = data.get("query", {}).get("search", [])
                for item in search_items[:2]:
                    snippet_clean = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
                    if snippet_clean:
                        results.append({
                            "title": item.get("title", ""),
                            "snippet": snippet_clean,
                            "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(item.get('title', ''))}"
                        })
        except Exception:
            pass

    return results[:max_results]


def search_knowledge_base(query: str, top_k: int = 3) -> List[Dict]:
    """Keyword relevance scoring to retrieve knowledge base context chunks."""
    words = [w.lower() for w in re.findall(r'\w+', query) if len(w) > 2]
    if not words:
        return KNOWLEDGE_BASE[:top_k]
    scored = []
    for doc in KNOWLEDGE_BASE:
        text = (doc["title"] + " " + doc["content"]).lower()
        score = sum(text.count(w) for w in words)
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [doc for score, doc in scored[:top_k] if score > 0]
    return results if results else KNOWLEDGE_BASE[:top_k]


def _call_cloudflare_ai(prompt: str) -> str:
    """Fallback LLM via Cloudflare Workers AI Llama 3.1 8B."""
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    if not account_id or not api_token:
        return ""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messages": [
            {"role": "system", "content": "You are ScholarAI, an expert AI scholarship advisor and general assistant for students. Provide direct, helpful, and concise answers."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1024,
        "temperature": 0.2
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                result_text = data.get("result", {}).get("response", "")
                if result_text and result_text.strip():
                    return result_text.strip()
    except Exception as e:
        print(f"[Cloudflare AI Fallback Warning]: {e}")
    return ""


def call_gemini_api(prompt: str) -> str:
    """Call Google Gemini REST API with prompt grounding and Cloudflare AI fallback."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        gemini_models = [
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
        ]
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
        }
        for m in gemini_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                import ssl
                ctx = ssl._create_unverified_context()
                with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text_content.strip():
                            return text_content.strip()
            except urllib.error.HTTPError as err:
                print(f"[Gemini API HTTPError {m}]: {err.code} - {err.read().decode('utf-8', errors='ignore')[:200]}")
                continue
            except Exception as err:
                print(f"[Gemini API Exception {m}]: {err}")
                continue

    # Fallback to Cloudflare Workers AI if Gemini is unavailable
    cf_res = _call_cloudflare_ai(prompt)
    if cf_res:
        return cf_res

    return ""


def _format_amt(amt) -> str:
    if amt is None:
        return "Varies"
    if isinstance(amt, (int, float)):
        return f"₹{amt:,.0f}" if amt == int(amt) else f"₹{amt:,.2f}"
    s = str(amt).replace('â‚¹', '₹').replace('â€“', '-').replace('Rs.', '₹').strip()
    if '₹' in s or s.lower().startswith('varies'):
        return s
    return f"₹{s}"


def _get_numeric_amount(amt) -> float:
    if isinstance(amt, (int, float)):
        return float(amt)
    if not amt:
        return 0.0
    s = str(amt).replace(',', '')
    match = re.search(r'\d+', s)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            pass
    return 0.0


def _get_deadline_urgency(deadline_str: str) -> tuple:
    """Return (emoji, label, days_remaining) based on deadline."""
    try:
        dl = datetime.strptime(str(deadline_str).strip(), "%Y-%m-%d").date()
        days_left = (dl - date.today()).days
        if days_left < 0:
            return "⚫", "Expired", days_left
        elif days_left <= 7:
            return "🔴", f"URGENT — {days_left} day(s) left", days_left
        elif days_left <= 30:
            return "🟡", f"{days_left} days remaining", days_left
        else:
            return "🟢", f"{days_left} days remaining", days_left
    except Exception:
        return "🔵", "Date not verified", 9999


def _get_official_url(match: dict, s_obj=None) -> str:
    """Return the official URL from the scholarship DB record, or best-effort from known providers."""
    if s_obj and getattr(s_obj, "official_url", None) and str(s_obj.official_url).strip():
        return str(s_obj.official_url).strip()
    name_lower = match.get("scholarship_name", "").lower()
    provider_lower = (match.get("provider") or "").lower()
    for key, url in PROVIDER_URLS.items():
        if key in name_lower or key in provider_lower:
            return url
    return "https://scholarships.gov.in"


def _get_scholarship_documents(scholarship_name: str, s_obj=None) -> List[str]:
    """Return the specific required documents for this scholarship."""
    if s_obj and getattr(s_obj, "required_documents", None) and str(s_obj.required_documents).strip():
        raw = str(s_obj.required_documents).strip()
        docs = [d.strip() for d in raw.split(",") if d.strip()]
        if docs:
            return docs
    name_lower = scholarship_name.lower()
    for key, docs in SCHOLARSHIP_DOCUMENTS.items():
        if key in name_lower:
            return docs
    return ["Aadhaar Card", "Income Certificate", "College Bonafide Certificate", "Marksheets (10th/12th)"]


def _build_sources_section(matches: list, db=None) -> str:
    """Build a clean, honest Sources section with URLs and today's date."""
    today_str = date.today().strftime("%d %b %Y")
    seen_urls = set()
    section = "SOURCES & GROUNDING RULES:\n"
    for m in matches:
        s_obj = db.query(models.Scholarship).filter(models.Scholarship.id == m["id"]).first() if db else None
        url = _get_official_url(m, s_obj)
        if url not in seen_urls:
            seen_urls.add(url)
            name = m.get("scholarship_name", "Scholarship")
            section += f"📖 {name} — {url}\n"
    section += f"📖 Data last verified: {today_str} (from ScholarAI scholarship database)\n"
    return section


# ─────────────────────────────────────────────
# Main RAG Response Generator
def _generate_rag_response_en(user_query: str, user_profile_summary: str = "", extra_context: str = "", db: Session = None, user_id: int = None) -> Dict:
    """Routes queries to structured crisp intent responses or Gemini fallback in English."""
    q_lower = user_query.lower()
    today_str = date.today().strftime("%d %b %Y")

    # ─── INTENT 1: Why am I eligible? ───────────────────────────────────────
    if any(p in q_lower for p in ["why am i eligible", "why eligible", "am i eligible", "why am i"]):
        if db and user_id:
            from .matching_agent import ScholarshipMatchingAgent
            matches = ScholarshipMatchingAgent(db).match_scholarships(user_id)

            eligible = [m for m in matches if m["status"] == "Eligible"]
            partial = [m for m in matches if m["status"] == "Partially Eligible"]

            if not eligible and not partial:
                message = "🎯 **Result**\nNo eligible scholarships matched your current profile.\n\n"
                message += "💡 **Next Steps**\nComplete your profile (CGPA, Income, Category) and upload required certificates to unlock matches.\n\n"
                message += "📌 **Note**\nFinal eligibility must be confirmed by the scholarship authority.\n\n[Edit Profile →] [Upload Documents →]"
                return {"answer": message, "citations": [], "confidence": "HIGH"}

            message = f"🎯 **Result**\nYou appear eligible for **{len(eligible)} scholarship{'s' if len(eligible) != 1 else ''}**.\n\n"
            message += "You're eligible because your academic performance, degree, income, and required profile criteria match the scholarship requirements.\n\n"

            if eligible:
                top = eligible[0]
                dl = top.get("deadline") or "Not verified"
                message += f"🏆 **Top Match**\n**{top['scholarship_name']} — {top['match_percentage']}%**\n"
                message += f"* Funding: {_format_amt(top['amount'])}\n"
                message += f"* Deadline: {dl}\n"
                message += f"* Reason: Strong match with your profile\n\n"

                if len(eligible) > 1:
                    message += "⭐ **Other Matches**\n"
                    for m in eligible[1:4]:
                        message += f"* {m['scholarship_name']} — {m['match_percentage']}%\n"
                    message += "\n"

            if partial and len(eligible) < 2:
                message += "⏳ **Pending Verification**\n"
                for m in partial[:2]:
                    message += f"* {m['scholarship_name']} — {m['match_percentage']}%\n"
                message += "\n"

            message += "📌 **Note**\nFinal eligibility must be confirmed by the scholarship authority.\n\n"
            message += "[View Eligible Scholarships →] [Upload Documents →]"

            return {"answer": message, "citations": [{"title": m["scholarship_name"], "id": m["id"]} for m in eligible[:5]], "confidence": "HIGH"}

    # ─── INTENT 2: Compare scholarships ─────────────────────────────────────
    if "compare" in q_lower and "scholarship" in q_lower:
        if db and user_id:
            from .matching_agent import ScholarshipMatchingAgent
            matches = ScholarshipMatchingAgent(db).match_scholarships(user_id)
            top_matches = matches[:5]

            message = "🎯 **Scholarship Comparison**\n\n"
            message += "| Scholarship | Match | Funding | Deadline | Status |\n"
            message += "| --- | --- | --- | --- | --- |\n"
            for m in top_matches:
                dl = m.get("deadline") or "Not verified"
                message += f"| {m['scholarship_name']} | {m['match_percentage']}% | {_format_amt(m['amount'])} | {dl} | {m['status']} |\n"

            message += "\n📌 **Note**\nFinal eligibility must be confirmed by the scholarship authority.\n\n"
            message += "[View Eligible Scholarships →]"
            return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── INTENT 3: Deadline reminder ────────────────────────────────────────
    if "deadline" in q_lower:
        if db and user_id:
            from .matching_agent import ScholarshipMatchingAgent
            matches = ScholarshipMatchingAgent(db).match_scholarships(user_id)
            eligible_matches = [m for m in matches if m["status"] in ("Eligible", "Partially Eligible")]

            if not eligible_matches:
                message = "⏰ **Deadline Reminder**\nNo active deadlines for eligible scholarships at this time.\n\n"
                message += "[View Eligible Scholarships →]"
                return {"answer": message, "citations": [], "confidence": "HIGH"}

            sorted_matches = sorted(eligible_matches, key=lambda m: _get_deadline_urgency(m["deadline"])[2])
            message = "⏰ **Upcoming Deadlines**\n\n"
            for m in sorted_matches[:5]:
                dl = m.get("deadline") or "Not verified"
                message += f"* **{m['scholarship_name']}**: {dl}\n"

            message += "\n📌 **Note**\nSubmit applications early to avoid last-minute portal issues.\n\n"
            message += "[View Eligible Scholarships →]"
            return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── INTENT 4: Improve my profile ───────────────────────────────────────
    if any(p in q_lower for p in ["improve my profile", "improve profile", "how can i improve", "strengthen my profile"]):
        if db and user_id:
            profile = crud.get_user_profile(db, user_id)
            cgpa = profile.cgpa or 0.0

            elig_required = {
                "CGPA": profile.cgpa is not None,
                "Annual Income": profile.annualIncome is not None,
                "Category": bool(profile.category),
                "Gender": bool(profile.gender),
                "State": bool(profile.state),
                "Degree": bool(profile.degree),
            }
            elig_filled = sum(elig_required.values())
            elig_pct = int((elig_filled / len(elig_required)) * 100)

            docs = db.query(models.Document).filter(models.Document.user_id == user_id).all()
            uploaded_doc_types = [d.document_type for d in docs]
            all_req_docs = ["aadhaar", "income", "community", "college", "tenth", "twelfth"]
            missing_docs = [d.title() for d in all_req_docs if d not in uploaded_doc_types]

            message = f"🎯 **Profile Completeness: {elig_pct}%**\n\n"
            message += "**Recommendations:**\n"
            if missing_docs:
                message += f"* **Upload Documents**: {', '.join(missing_docs[:3])}\n"
            if cgpa < 9.0:
                message += "* **Academic Score**: Maintaining 9.0+ CGPA qualifies for top merit schemes\n"
            if elig_pct < 100:
                missing_fields = [k for k, v in elig_required.items() if not v]
                message += f"* **Complete Profile**: Fill in {', '.join(missing_fields)}\n"
            if elig_pct == 100 and not missing_docs:
                message += "* Profile is complete and ready for applications!\n"

            message += "\n📌 **Note**\nVerified documents help unlock higher matching accuracy.\n\n"
            message += "[Edit Profile →] [Upload Documents →]"
            return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── INTENT 5: Required documents ───────────────────────────────────────
    if any(p in q_lower for p in ["required documents", "required document", "what documents", "documents needed", "which documents"]):
        message = "📄 **Required Documents**\n\n"
        message += "**Common Documents:**\n"
        message += "* Aadhaar Card\n"
        message += "* Income Certificate (Revenue Dept/Tahsildar)\n"
        message += "* College Bonafide / ID Card\n"
        message += "* 10th & 12th Marksheets\n\n"
        message += "**Additional Documents (Specific Schemes):**\n"
        message += "* Community Certificate (for quota schemes)\n"
        message += "* Bank Passbook / First Graduate Certificate\n\n"
        message += "📌 **Note**\nRequirements vary slightly per scheme. Verify on the official scholarship portal.\n\n"
        message += "[Upload Documents →]"
        return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── INTENT 6: Best scholarship / Which scholarship first ───────────────
    if any(p in q_lower for p in ["best scholarship", "which scholarship", "top scholarship", "recommend", "should i apply"]):
        if db and user_id:
            from .matching_agent import ScholarshipMatchingAgent
            matches = ScholarshipMatchingAgent(db).match_scholarships(user_id)
            eligible_matches = [m for m in matches if m["status"] == "Eligible"]
            if not eligible_matches:
                eligible_matches = [m for m in matches if m["status"] == "Partially Eligible"]

            if eligible_matches:
                top = eligible_matches[0]
                dl = top.get("deadline") or "Not verified"

                message = f"🎯 **Result**\nYou appear eligible for **{len(eligible_matches)} scholarship{'s' if len(eligible_matches) != 1 else ''}**.\n\n"
                message += f"🏆 **Top Match**\n**{top['scholarship_name']} — {top['match_percentage']}%**\n"
                message += f"* Funding: {_format_amt(top['amount'])}\n"
                message += f"* Deadline: {dl}\n"
                message += f"* Reason: Strong match with your profile\n\n"

                if len(eligible_matches) > 1:
                    message += "⭐ **Other Matches**\n"
                    for m in eligible_matches[1:4]:
                        message += f"* {m['scholarship_name']} — {m['match_percentage']}%\n"
                    message += "\n"

                message += "📌 **Note**\nFinal eligibility must be confirmed by the scholarship authority.\n\n"
                message += "[View Eligible Scholarships →] [Upload Documents →]"
            else:
                message = "🎯 **Result**\nNo eligible scholarships matched yet.\n\n💡 **Recommendation**\nComplete your profile and upload documents to get personalized recommendations.\n\n[Edit Profile →]"
            return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── INTENT 7: What should I do next / next steps ───────────────────────
    if any(p in q_lower for p in ["what should i do", "next steps", "action", "what next", "apply now"]):
        if db and user_id:
            from .matching_agent import ScholarshipMatchingAgent
            matches = ScholarshipMatchingAgent(db).match_scholarships(user_id)
            eligible_matches = sorted(
                [m for m in matches if m["status"] == "Eligible"],
                key=lambda m: _get_deadline_urgency(m["deadline"])[2]
            )
            docs = db.query(models.Document).filter(models.Document.user_id == user_id).all()
            uploaded_types = [d.document_type for d in docs]
            missing_docs = [d for d in ["aadhaar", "income", "community", "college", "tenth", "twelfth"] if d not in uploaded_types]

            message = "**🎯 Recommended Next Steps**\n\n"
            step = 1
            if eligible_matches:
                top = eligible_matches[0]
                message += f"{step}. **Apply for {top['scholarship_name']}** (Deadline: {top['deadline']})\n"
                step += 1
            if missing_docs:
                message += f"{step}. **Upload Documents** — {', '.join(d.title() for d in missing_docs[:3])}\n"
                step += 1
            if len(eligible_matches) > 1:
                message += f"{step}. **Apply for {eligible_matches[1]['scholarship_name']}**\n"
                step += 1
            message += f"{step}. Confirm application submission on the official portal.\n\n"
            message += "**📌 Note**\nKeep all scanned certificates ready before starting your application.\n\n"
            message += "[View Eligible Scholarships →] [Upload Documents →]"
            return {"answer": message, "citations": [], "confidence": "HIGH"}

    # ─── Fallback: Intent-Classified Routing ───────────────────────────────
    intent = _classify_intent(user_query)

    # ── CURRENT AFFAIRS & LIVE INFORMATION INTENT ──
    if intent == "CURRENT_AFFAIRS":
        live_results = live_web_search(user_query, max_results=5)
        if live_results:
            live_context = "\n".join([f"• [{r['title']}]: {r['snippet']} (Source URL: {r['url']})" for r in live_results])
            current_prompt = f"""You are ScholarAI, an intelligent and grounded AI assistant for students.
Answer in a crisp, simple, and direct way:
- Give the main answer first.
- Keep response within 3-5 bullet points.
- Cite official source URL.

TODAY'S DATE: {today_str}

LIVE SEARCH CONTEXT:
{live_context}

USER QUESTION:
{user_query}

Answer:"""
            gemini_answer = call_gemini_api(current_prompt)
            if gemini_answer:
                return {
                    "answer": gemini_answer,
                    "citations": [{"title": r["title"], "url": r["url"]} for r in live_results],
                    "confidence": "HIGH"
                }

        return {
            "answer": f"I cannot verify the live information for \"{user_query}\" right now. Please check official government portals for current records.\n\n📖 Verified: {today_str}",
            "citations": [],
            "confidence": "LOW"
        }

    # ── CASUAL INTENT → Gemini first, local fallback if unavailable ──
    if intent == "CASUAL":
        casual_prompt = f"""You are ScholarAI, a friendly and intelligent AI scholarship assistant for Indian students.
Respond warmly, directly, and concisely (1-2 sentences). Guide them to ask about scholarships.

User says: {user_query}

Respond:"""
        gemini_answer = call_gemini_api(casual_prompt)
        if gemini_answer:
            return {"answer": gemini_answer, "citations": [], "confidence": "HIGH"}
        for key, resp in CASUAL_FALLBACK.items():
            if key in q_lower:
                return {"answer": resp, "citations": [], "confidence": "HIGH"}
        return {"answer": "Hello! 👋 I'm ScholarAI — your AI scholarship advisor. Ask me about eligibility, deadlines, or documents!", "citations": [], "confidence": "HIGH"}

    # ── GENERAL KNOWLEDGE or UNKNOWN → Gemini handles everything with Crisp rules ──
    if intent in ("GENERAL_KNOWLEDGE", "UNKNOWN"):
        gen_prompt = f"""You are ScholarAI. Answer this question in a crisp, direct, and simple way suitable for a student:
- Main answer first in 1-2 clear sentences.
- Use 3-5 bullet points with key concepts/examples.
- Keep total response under 150 words.
- Avoid repetition, filler, or internal logs.

Question: {user_query}

Answer:"""
        gemini_answer = call_gemini_api(gen_prompt)
        if gemini_answer:
            return {"answer": gemini_answer, "citations": [], "confidence": "MEDIUM"}
        return {
            "answer": ("I'm ScholarAI — your scholarship advisor! 🎓\n\n"
                       "Try asking me one of these:\n"
                       "• **Why am I eligible?**\n"
                       "• **Best scholarship for me**\n"
                       "• **Compare scholarships**\n"
                       "• **Deadline reminder**\n"
                       "• **Required documents**"),
            "citations": [], "confidence": "LOW"
        }

    # ── SCHOLARSHIP INTENT → Full RAG pipeline with Crisp Format ──
    context_docs = search_knowledge_base(user_query)
    citations = [{"title": d["title"], "id": d["id"]} for d in context_docs]
    context_str = "\n---\n".join([f"[{d['title']}]: {d['content'].strip()}" for d in context_docs])

    rag_prompt = f"""You are ScholarAI, an expert Scholarship Advisor AI.
Answer the user's scholarship question strictly using the provided context.

CRISP RULES:
1. Main answer first.
2. 3-6 bullet points max.
3. List: Scholarship Name, Match %, Funding, Deadline, Status.
4. No filler, no internal logs, no repeated criteria.
5. End with: "📌 Note: Final eligibility must be confirmed by the scholarship authority."

[USER PROFILE]:
{user_profile_summary}

[SCHOLARSHIP CONTEXT]:
{extra_context}

[KNOWLEDGE BASE]:
{context_str}

[USER QUESTION]:
{user_query}

Answer:"""

    gemini_answer = call_gemini_api(rag_prompt)
    if gemini_answer:
        answer = gemini_answer
    else:
        answer = f"**🎯 Scholarship Information**\n\n{context_docs[0]['content'].strip()}\n\n**📌 Note**\nFinal eligibility must be confirmed by the scholarship authority."

    return {
        "answer": answer,
        "citations": citations,
        "confidence": "MEDIUM"
    }

def generate_rag_response(user_query: str, user_profile_summary: str = "", extra_context: str = "", db: Session = None, user_id: int = None, language: str = "en") -> Dict:
    """Multilingual wrapper for RAG advisor using Cloudflare Workers AI translation."""
    res = _generate_rag_response_en(
        user_query=user_query,
        user_profile_summary=user_profile_summary,
        extra_context=extra_context,
        db=db,
        user_id=user_id
    )
    if language and language.lower() not in ("en", "english"):
        from ..services.translation_service import translate_single_text
        try:
            translated_answer = translate_single_text(res["answer"], target_lang=language.lower())
            if translated_answer:
                res["answer"] = translated_answer
        except Exception as e:
            print(f"[RAG Translation Warning]: {e}")
    return res
