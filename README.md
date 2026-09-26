# 🎓 ScholarAI — Agentic AI Scholarship Advisor & Verification Platform
## 📘 Complete System Architecture, Master Blueprint & Disaster Recovery Specification

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-Automated_RPA-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Cloudflare Workers AI](https://img.shields.io/badge/Cloudflare-Workers_AI-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers-ai/)
[![Web Speech API](https://img.shields.io/badge/Web_Speech_API-STT_&_TTS-9C27B0?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5/3.6_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Brevo](https://img.shields.io/badge/Email-Brevo_Transactional-0B996F?style=for-the-badge&logo=sendinblue&logoColor=white)](https://www.brevo.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_/_SQLite-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

---

> ### 🚨 Disaster Recovery & Self-Healing Contract
> **Notice to AI Coding Agents & Developers:**
> This document is the **authoritative single source of truth** for the ScholarAI platform. If **any file, agent, component, route, or database model** is accidentally deleted, altered, or corrupted, **this README contains complete functional specifications, contracts, and internal logic required to recreate, repair, and recover that file from scratch** without missing dependencies or regressing system behavior.

---

## 📑 Master Table of Contents
1. [🌟 Platform Overview & Core Architecture](#-platform-overview--core-architecture)
2. [🚑 Disaster Recovery Guide: How to Rebuild Any Deleted File](#-disaster-recovery-guide-how-to-rebuild-any-deleted-file)
3. [📂 Master Directory & File Manifest (Every File Explained)](#-master-directory--file-manifest-every-file-explained)
4. [🗄️ Database Architecture & Complete Schema Reference](#️-database-architecture--complete-schema-reference)
5. [🤖 Multi-Agent AI Ecosystem (Contracts & Algorithms)](#-multi-agent-ai-ecosystem-contracts--algorithms)
6. [🌐 Visible Google Playwright RPA Engine & Verification Protocol](#-visible-google-playwright-rpa-engine--verification-protocol)
7. [🔍 Computer Vision OCR & Fuzzy Cross-Verification Engine](#-computer-vision-ocr--fuzzy-cross-verification-engine)
8. [🌐 Dynamic Multilingual Translation Subsystem (Cloudflare LLaMA 3.1)](#-dynamic-multilingual-translation-subsystem-cloudflare-llama-31)
9. [🎙️ Voice Chat Subsystem (STT & TTS)](#️-voice-chat-subsystem-stt--tts)
10. [📜 Certificate Generator & Profile AutoFill Engine](#-certificate-generator--profile-autofill-engine)
11. [📬 Transactional Notifications Subsystem (Brevo)](#-transactional-notifications-subsystem-brevo)
12. [📡 Complete REST API Endpoint Dictionary](#-complete-rest-api-endpoint-dictionary)
13. [🛡️ Critical Engineering Safeguards & Gotchas](#️-critical-engineering-safeguards--gotchas)
14. [🚀 Environment Setup & Deployment Guide](#-environment-setup--deployment-guide)

---

## 🌟 Platform Overview & Core Architecture

**ScholarAI** is an autonomous multi-agent educational assistant and scholarship verification platform designed to bridge the gap between students and legitimate higher education funding. 

The system operates across three tiers:
1. **Frontend (React 18 + Vite + Tailwind CSS)**: Glassmorphic dark/light UI, dynamic multi-language translation, browser-native voice recognition and speech synthesis, dynamic application wizards, and interactive verification modals.
2. **Backend (FastAPI + Python 3.11+)**: Asynchronous REST API, stateful multi-agent supervisor orchestrator, Playwright RPA browser controller, OCR extraction pipelines, and Brevo transactional notifications.
3. **Data & External Intelligence**:
   - **Relational DB**: MySQL (production) / SQLite (development) with SQLAlchemy ORM.
   - **Google Gemini API**: Grounded Retrieval-Augmented Generation (RAG) educational counselor.
   - **Cloudflare Workers AI**: Zero-static-file dynamic UI translation powered by `@cf/meta/llama-3.1-8b-instruct`.
   - **Tesseract OCR**: Automated document credential extraction and fuzzy identity matching.
   - **Playwright Chrome Automation**: Live desktop Google search, anti-bot CAPTCHA handling, and real-time portal cross-checking.

```mermaid
flowchart TD
    User([Student / Applicant]) <-->|HTTPS / REST| UI[React 18 + Vite Frontend]
    UI <-->|JWT Authenticated Requests| API[FastAPI Backend Server]

    subgraph Backend Core
        API --> Auth[JWT Auth & Google OAuth 2.0]
        API --> DB[(MySQL Database - SQLAlchemy)]
        API --> Supervisor[Supervisor Agent Orchestrator]
        API --> EmailService[Brevo Transactional Email Service]
        API --> TranslationService[Cloudflare Workers AI Service]
    end

    subgraph Agentic AI Ecosystem
        Supervisor --> ProfileAgent[Profile Validation Agent]
        Supervisor --> Matching[16-Parameter Matching Engine]
        Supervisor --> OCR[Tesseract OCR Agent]
        Supervisor --> Audit[Verification Agent - Fuzzy & Compact]
        Supervisor --> GoogleRPA[Google RPA Playwright Agent]
        Supervisor --> RAG[RAG & Grounding Agent]
        Supervisor --> DocCollector[Document Collector Agent]
        
        Matching -->|16 Param Filters| DB
        OCR -->|Extracted JSON| Audit
        Audit -->|Levenshtein + Compact Match| DB
        GoogleRPA -->|Visible Desktop Chrome| Web[Google / Gov Portals]
        GoogleRPA -->|Matrix & Recommendation| DB
        GoogleRPA -->|Audit Trail Log| ExcelFile[Scholarship_Verification.xlsx]
        RAG --> LLM[Google Gemini 3.5/3.6 Flash]
    end

    EmailService -->|SMTP/API| Brevo[Brevo Mail Servers]
    Brevo -->|Delivered| UserInbox([Student Email Inbox])
```

---

## 🚑 Disaster Recovery Guide: How to Rebuild Any Deleted File

If any file in this repository is accidentally deleted or damaged, follow this recovery matrix:

### 1. If an Agent File in `backend/app/agent/` is deleted:
* **`supervisor.py`**: Instantiate `SupervisorAgent(db: Session)`. Must implement `get_workflow_state(user_id)`, `evaluate_workflow_state(...)`, `transition_state(...)`, and `log_decision(...)`. Interacts with `models.AgentWorkflowState` and `models.AgentDecisionLog`.
* **`google_verification_agent.py`**: Instantiate `GoogleScholarshipVerificationAgent(db: Session)`. Must implement `verify_scholarship(scholarship_data, user_id)` and `_execute_browser_searches(queries)`. Uses Playwright with visible Chrome (`headless=False`), human-like typing (`delay=28-55ms`), CAPTCHA detection (`_is_captcha`), Serper fallback (`search_serper_fallback`), and writes audit rows to `Scholarship_Verification.xlsx`.
* **`matching_agent.py`**: Instantiate `MatchingAgent(db: Session)`. Must implement `find_matching_scholarships(user_profile)` evaluating the 16 criteria (CGPA, 10th/12th marks, income ceiling, state, category, first graduate, quota, etc.) and calculate match scores (0–100%).
* **`ocr_agent.py`**: Instantiate `OCRAgent()`. Must implement `process_document(file_path, doc_type)`. Auto-detects Tesseract binary path on Windows (`C:\Program Files\Tesseract-OCR\tesseract.exe`), converts PDFs with `pdf2image` or `pdfplumber`, performs PIL image preprocessing (grayscale, Otsu thresholding), and extracts structured JSON.
* **`verification_agent.py`**: Instantiate `VerificationAgent()`. Must implement `cross_audit(user_profile, ocr_data)`. Uses compact string normalization (`clean_compact`), token set matching, and Levenshtein similarity ($\ge 75\%$).
* **`profile_agent.py`**: Must implement `evaluate_profile(profile_dict)` checking completion score (0-100) and mandatory field ranges.
* **`rag_agent.py`**: Must implement `answer_query(query, chat_history, context)` using Google Gemini (`gemini-3.5-flash` or `gemini-3.6-flash`).

### 2. If a Backend Core File in `backend/app/` is deleted:
* **`models.py`**: Rebuild using the exact SQLAlchemy declarations in [Database Architecture](#️-database-architecture--complete-schema-reference).
* **`schemas.py`**: Rebuild Pydantic models matching the payload definitions in [REST API Endpoint Dictionary](#-complete-rest-api-endpoint-dictionary).
* **`database.py`**: Create SQLAlchemy `create_engine` pointing to `DATABASE_URL` (MySQL pymysql with fallback to SQLite), `sessionmaker`, and `Base = declarative_base()`. Provide `get_db()` FastAPI dependency.
* **`auth.py`**: Create password hashing using `passlib.context.CryptContext(schemes=["bcrypt"])`, JWT token generation using `jose.jwt` or `jwt` (`SECRET_KEY`, `ALGORITHM = "HS256"`, `ACCESS_TOKEN_EXPIRE_MINUTES = 1440`), and `get_current_user` FastAPI dependency.
* **`crud.py`**: Re-implement user lookup, profile create/update, document record create, application status mutation, and chat logging.
* **`main.py`**: Re-register FastAPI app, CORS middleware (`allow_origins=["*"]`), include API routers, static file mounts (`/uploads`), admin auto-seeding (`admin@scholarship.com`), and error handlers.

### 3. If a Frontend Component or Page in `src/` is deleted:
* **`AdaptiveRpaVerificationModal.jsx`**: Recreate modal showing live Google RPA queries, progress steps, comparison matrix, and student eligibility checks. **Crucial:** Must maintain `useRef(false)` execution guard in `useEffect` to prevent duplicate Playwright browser launches in React StrictMode!
* **`RecommendationsPage.jsx`**: Recreate scholarship recommendation feed with filters, match percentage badge, "Verify on Google" button triggering `AdaptiveRpaVerificationModal`, and 5-step Application Wizard.
* **`LanguageContext.jsx` & `translationManager.js`**: Recreate dynamic translation provider using 60ms batching queue, `localStorage` caching, and calls to `POST /api/v1/translate`.
* **`AssistantPage.jsx`**: Recreate AI chat interface with integrated `VoiceInput` (STT Web Speech API) and `VoiceOutput` (TTS Web Speech API).
* **`CertificateGeneratorPage.jsx`**: Recreate 5 government document templates (Aadhaar, Income, Community, Bonafide, Marksheet) with 1-Click AutoFill from `userProfile` and `html2canvas` PNG download.

---

## 📂 Master Directory & File Manifest (Every File Explained)

```text
d:/sriramajayam/newbeg/
├── backend/                                      # Python FastAPI Backend Engine
│   ├── app/
│   │   ├── agent/                                # Autonomous Multi-Agent AI Subsystem
│   │   │   ├── classifier_agent.py               # Document type classification via text keywords
│   │   │   ├── discovery_agent.py                # Discovers new scholarship opportunities online
│   │   │   ├── document_agent.py                 # Resolves required document checklist per scholarship
│   │   │   ├── document_collector_agent.py       # Orchestrates document retrieval and upload states
│   │   │   ├── google_verification_agent.py      # Visible Playwright RPA Google search & comparison engine
│   │   │   ├── matching_agent.py                 # 16-parameter scholarship eligibility & scoring engine
│   │   │   ├── ocr_agent.py                      # Tesseract OCR engine with image preprocessing
│   │   │   ├── profile_agent.py                  # Profile completeness and range validation
│   │   │   ├── rag_agent.py                      # RAG grounding, web search router & Gemini synthesis
│   │   │   ├── recommendation_agent.py           # Personalized application advice & roadmap generator
│   │   │   ├── supervisor.py                     # Central state machine orchestrator & task scheduler
│   │   │   └── verification_agent.py             # Cross-auditing logic with compact/fuzzy name matching
│   │   │
│   │   ├── services/
│   │   │   ├── email_service.py                  # Brevo transactional email delivery service
│   │   │   └── translation_service.py            # Cloudflare Workers AI (Llama 3.1 8B) translation service
│   │   │
│   │   ├── auth.py                               # JWT token creation, OAuth handling & bcrypt hashing
│   │   ├── crud.py                               # Database CRUD operations for profiles, docs, and apps
│   │   ├── database.py                           # SQLAlchemy engine, session maker & get_db dependency
│   │   ├── main.py                               # FastAPI REST routes, admin auto-seeding & event handlers
│   │   ├── models.py                             # SQLAlchemy ORM models (11 core relational tables)
│   │   └── schemas.py                            # Pydantic request/response validation schemas
│   │
│   ├── .env                                      # Backend configuration & API keys
│   ├── requirements.txt                          # Python dependencies list
│   └── Scholarship_Verification.xlsx             # Live Excel audit trail produced by Google RPA Agent
│
├── src/                                          # React 18 Frontend Application
│   ├── assets/                                   # Media, icons, textures
│   ├── components/                               # Reusable Glassmorphism UI Components
│   │   ├── AdaptiveRpaVerificationModal.jsx      # Modal showing live Google RPA steps & comparison matrix
│   │   ├── AdminRoute.jsx                        # Protected route wrapper for admin role
│   │   ├── AutopilotGuide.jsx                    # Dynamic 12-stage workflow guide banner
│   │   ├── BrowserAutomationPanel.jsx            # Real-time visual representation of browser automation
│   │   ├── CloudflareTurnstileWidget.jsx         # Cloudflare Turnstile anti-bot widget
│   │   ├── GlassCard.jsx                         # Glassmorphic card container with gradient borders
│   │   ├── InputField.jsx                        # Standardized styled input field component
│   │   ├── LanguageSelector.jsx                  # Multilingual selector with high z-index & active flags
│   │   ├── StudentJourneyCard.jsx                # Visual card tracking a student's active journey
│   │   ├── ThemeToggle.jsx                       # Light/dark mode toggle button
│   │   ├── Toast.jsx                             # Global notification toast provider
│   │   ├── VoiceInput.jsx                        # Speech-to-Text mic button with live audio pulse
│   │   └── VoiceOutput.jsx                       # Text-to-Speech audio reader with start/stop controls
│   │
│   ├── config/
│   │   └── languages.js                          # 10-language metadata definitions & BCP-47 voice tags
│   │
│   ├── context/
│   │   ├── AuthContext.jsx                       # Authentication state & JWT session management
│   │   └── LanguageContext.jsx                   # Dynamic Cloudflare translation context & t() provider
│   │
│   ├── pages/                                    # Application Views & Pages
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx                # Admin monitoring, analytics, and application approval console
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx                     # Traditional & Google OAuth login
│   │   │   └── RegisterPage.jsx                  # Student registration portal
│   │   ├── AdminLoginPage.jsx                    # Dedicated admin authentication portal
│   │   ├── DashboardPage.jsx                     # Central student portal overview & action cards
│   │   ├── LandingPage.jsx                       # Public homepage with live feature previews
│   │   └── dashboard/
│   │       ├── AssistantPage.jsx                 # ScholarAI Assistant with Voice Chat & Multilingual RAG
│   │       ├── CertificateGeneratorPage.jsx      # 1-Click Certificate Generator & Profile AutoFill
│   │       ├── DocumentsPage.jsx                 # Document repository, upload & OCR review modals
│   │       ├── EligibilityPage.jsx               # AI Supervisor Agent workflow & status checker
│   │       ├── HistoryPage.jsx                   # Application history, tracking & status timeline
│   │       ├── InsightsPage.jsx                  # Analytics, deadline calendar & notification center
│   │       ├── JourneyPage.jsx                   # End-to-end interactive scholarship application roadmap
│   │       ├── ProfilePage.jsx                   # 16-parameter student profile editor
│   │       ├── RecommendationsPage.jsx           # Scholarship recommendations, Google RPA trigger & Apply wizard
│   │       ├── SavedPage.jsx                     # Bookmarked scholarships & side-by-side comparison
│   │       └── SettingsPage.jsx                  # Student account preferences & security settings
│   │
│   ├── services/
│   │   ├── api.js                                # Central Axios client with auth interceptors
│   │   ├── translationManager.js                 # Batch request queue, memory + localStorage cache
│   │   └── voiceService.js                       # Web Speech API STT/TTS engine with speech cleaning
│   │
│   ├── App.jsx                                   # React Router routes & authentication guards
│   ├── index.css                                 # Tailwind CSS styling, keyframe animations & themes
│   └── main.jsx                                  # React 18 DOM mount entrypoint with StrictMode
│
├── package.json                                  # NPM dependencies & scripts
├── vite.config.js                                # Vite bundler configuration
└── README.md                                     # Master Blueprint & Recovery Documentation
```

---

## 🗄️ Database Architecture & Complete Schema Reference

The database models are declared in `backend/app/models.py`. In case of database loss or migration repair, use these exact table structures:

### 1. Table: `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement, Index | Unique User Identifier |
| `fullName` | `String(255)` | `nullable=False` | Full Name of the student or admin |
| `email` | `String(255)` | Unique, Index, `nullable=False` | Registered email address |
| `password` | `String(255)` | `nullable=False` | Bcrypt hashed password |
| `role` | `String(50)` | Default `"student"` | `"student"` or `"admin"` |

### 2. Table: `user_profiles`
Stores the complete 16-parameter eligibility profile for a student:
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement, Index | Profile ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE), Unique | Linked user |
| `dob` | `String(50)` | `nullable=True` | Date of Birth (`YYYY-MM-DD`) |
| `gender` | `String(50)` | `nullable=True` | Male / Female / Other |
| `mobileNumber` | `String(50)` | `nullable=True` | Contact Phone Number |
| `state` | `String(100)` | `nullable=True` | Native / Domicile State |
| `college` | `String(255)` | `nullable=True` | Current College Name |
| `university` | `String(255)` | `nullable=True` | Affiliated University |
| `degree` | `String(100)` | `nullable=True` | e.g. B.E, B.Tech, B.Sc, M.Sc |
| `department` | `String(100)` | `nullable=True` | e.g. Computer Science, Mechanical |
| `year` | `String(10)` | `nullable=True` | 1, 2, 3, 4 |
| `semester` | `String(10)` | `nullable=True` | 1 through 8 |
| `tenthPercentage` | `Float` | `nullable=True` | 10th Standard Marks Percentage |
| `twelfthPercentage`| `Float` | `nullable=True` | 12th Standard Marks Percentage |
| `cgpa` | `Float` | `nullable=True` | Current Cumulative GPA (0.00–10.00) |
| `arrears` | `String(10)` | `nullable=True` | Active arrears count (`0`, `1+`) |
| `annualIncome` | `Float` | `nullable=True` | Family Annual Income in INR (₹) |
| `parentOccupation` | `String(100)` | `nullable=True` | Occupation of parent/guardian |
| `category` | `String(50)` | `nullable=True` | General / OBC / BC / MBC / SC / ST |
| `disability` | `Boolean` | Default `False` | Persons with Disabilities (PwD) flag |
| `sportsQuota` | `Boolean` | Default `False` | Sports quota eligibility |
| `ncc` | `Boolean` | Default `False` | NCC Cadet certificate holder |
| `nss` | `Boolean` | Default `False` | NSS Volunteer |
| `firstGraduate` | `Boolean` | Default `False` | First Graduate in family flag |
| `minority` | `Boolean` | Default `False` | Religious/Linguistic minority flag |
| `age` | `Integer` | `nullable=True` | Calculated student age |
| `religion` | `String(100)` | `nullable=True` | Student's religion |
| `quota` | `String(100)` | Default `"General"` | Applicable reservation quota |
| `completionScore` | `Integer` | Default `45` | Profile completeness (0-100%) |

### 3. Table: `scholarships`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `s_no` | `Integer` | PK, Autoincrement, Index | Scholarship ID (synonym: `id`) |
| `scholarship_name` | `String(255)` | `nullable=False` | Official scholarship title |
| `provider` | `String(255)` | `nullable=True` | Government body / Trust / Corporate |
| `degree` | `String(100)` | `nullable=True` | Eligible degree program |
| `min_cgpa` | `String(100)` | `nullable=True` | Minimum CGPA threshold |
| `max_family_income`| `String(100)` | `nullable=True` | Upper income ceiling in INR |
| `category` | `String(100)` | `nullable=True` | Eligible caste / social category |
| `state` | `String(100)` | `nullable=True` | Eligible domicile state |
| `gender` | `String(30)` | `nullable=True` | Eligible gender (e.g. All, Female) |
| `amount` | `String(100)` | `nullable=False` | Scholarship grant amount |
| `deadline` | `String(50)` | `nullable=False` | Application closing date |
| `official_url` | `String(500)` | `nullable=True` | Official government or portal URL |
| `notes` | `Text` | `nullable=True` | Detailed scheme notes & criteria |

### 4. Table: `scholarship_requirements`
Child table enabling dynamic rule parsing for scholarships:
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | Requirement ID |
| `scholarship_id` | `Integer` | FK (`scholarships.s_no`, CASCADE) | Parent scholarship |
| `requirement_type`| `String(64)` | `nullable=False` | `percentage`, `cgpa`, `income`, `category`, `state`, etc. |
| `operator` | `String(16)` | Default `"="` | `>=`, `<=`, `=`, `IN`, `NOT_IN`, `CONTAINS` |
| `required_value` | `Text` | `nullable=False` | Target threshold value |
| `is_mandatory` | `Boolean` | Default `True` | Whether rule is strict requirement |

### 5. Table: `documents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | Document Record ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE) | Linked student |
| `document_type` | `String(100)` | `nullable=False` | `aadhaar`, `income`, `community`, `tenth`, `twelfth`, `college` |
| `filename` | `String(255)` | `nullable=False` | Original filename |
| `file_path` | `String(512)` | `nullable=False` | Path on disk (in `/uploads`) |
| `status` | `String(50)` | Default `"Uploaded"` | `Uploaded`, `Verifying`, `Verified`, `Mismatch`, `Blurry` |
| `extracted_data` | `Text` | `nullable=True` | OCR extracted JSON payload string |

### 6. Table: `ocr_data`
Consolidated OCR records extracted per student:
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | OCR ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE), Unique | Linked student |
| `name` | `String(255)` | `nullable=True` | Name extracted from official IDs |
| `dob` | `String(50)` | `nullable=True` | Date of birth extracted |
| `gender` | `String(50)` | `nullable=True` | Gender extracted |
| `address` | `Text` | `nullable=True` | Address extracted |
| `state` | `String(100)` | `nullable=True` | State extracted |
| `income` | `Float` | `nullable=True` | Income extracted from certificate |
| `community` | `String(100)` | `nullable=True` | Caste/Community extracted |
| `cgpa` | `Float` | `nullable=True` | CGPA extracted from marksheet |
| `marks` | `Float` | `nullable=True` | 10th/12th percentage extracted |

### 7. Table: `applications`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | Application ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE) | Linked student |
| `scholarship_id` | `Integer` | FK (`scholarships.s_no`, CASCADE) | Linked scholarship |
| `status` | `String(50)` | Default `"Recommended"` | `Recommended`, `Documents Ready`, `Applied`, `SUBMITTED`, `Approved`, `Rejected` |
| `submitted_at` | `DateTime` | `nullable=True` | Exact timestamp of submission |
| `snapshot_data` | `Text` | `nullable=True` | JSON snapshot of profile & verification data at submission |
| `history_json` | `Text` | `nullable=True` | Audit history of status changes |

### 8. Table: `agent_workflow_states`
Maintains the student's active stage within the autonomous multi-agent pipeline:
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | State ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE), Unique | Linked student |
| `scholarship_id` | `Integer` | FK (`scholarships.s_no`), `nullable=True` | Targeted scholarship |
| `current_stage` | `String(100)` | Default `"NOT_STARTED"` | Stage identifier for the Autopilot Guide |
| `current_task` | `String(255)` | `nullable=True` | Human readable action prompt |
| `profile_status` | `String(50)` | Default `"Pending"` | `Pending`, `Complete` |
| `matching_status`| `String(50)` | Default `"Pending"` | `Pending`, `Completed` |
| `verification_status`| `String(50)` | Default `"Pending"` | `Pending`, `Verified`, `Mismatch` |
| `application_status`| `String(50)` | Default `"Pending"` | `Pending`, `Ready`, `Submitted` |
| `decision_reason`| `Text` | `nullable=True` | State machine rationale for next step |

### 9. Table: `agent_decision_logs`
Chronological audit log of every autonomous action taken by any agent:
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Integer` | PK, Autoincrement | Log ID |
| `user_id` | `Integer` | FK (`users.id`, CASCADE) | Linked student |
| `agent_name` | `String(100)` | `nullable=False` | e.g. `SupervisorAgent`, `GoogleScholarshipVerificationAgent` |
| `action` | `String(255)` | `nullable=False` | Action performed |
| `input_context_summary` | `Text` | `nullable=True` | Context inputs received |
| `decision` | `Text` | `nullable=True` | Decision reached |
| `result` | `Text` | `nullable=True` | Action result summary |
| `status` | `String(50)` | Default `"Success"` | `Success` or `Failure` |

---

## 🤖 Multi-Agent AI Ecosystem (Contracts & Algorithms)

```text
Student Interaction / Profile Event
              ↓
      [SupervisorAgent] ◄── Controls Workflow State & Task Sequencing
       │        │
       ├────────┼──────────────────────────────────┐
       ▼        ▼                                  ▼
[ProfileAgent] [MatchingAgent]           [RAGAgent] (Gemini)
       │        │                                  │
       │        ▼                                  ▼
       │  [GoogleVerificationAgent]        Chatbot Counseling
       │        │  (Playwright RPA)
       │        ▼
       │  Live Official Guidelines
       │        │
       ▼        ▼
 [DocumentCollectorAgent]
       │
       ▼
   [OCRAgent] (Tesseract)
       │
       ▼
[VerificationAgent] (Compact & Fuzzy Match)
       │
       ▼
 [Supervisor Final Approval & Brevo Notification]
```

### 1. Supervisor Agent (`backend/app/agent/supervisor.py`)
* **State Machine Stages**:
  `NOT_STARTED` $\to$ `PROFILE_INCOMPLETE` $\to$ `PROFILE_READY` $\to$ `MATCHING` $\to$ `MATCHING_COMPLETED` $\to$ `DOCUMENTS_MISSING` $\to$ `CORRECTION_REQUIRED` $\to$ `APPLICATION_READY` $\to$ `SUBMITTED` $\to$ `COMPLETED`.
* **Method**: `evaluate_workflow_state(user_id)` dynamically inspects `user_profiles`, `documents`, and `applications` to advance the stage and log the rationale in `agent_decision_logs`.

### 2. Matching Agent (`backend/app/agent/matching_agent.py`)
* Evaluates 16 parameters:
  1. `min_cgpa`: checks `userProfile.cgpa >= threshold`
  2. `min_percentage`: checks 10th and 12th percentages
  3. `max_family_income`: checks `userProfile.annualIncome <= ceiling`
  4. `category`: checks caste reservation (BC, MBC, SC, ST, General, OBC)
  5. `state`: checks domicile requirement (e.g. Tamil Nadu, All India)
  6. `degree`: checks B.E, B.Tech, Arts, Medicine, etc.
  7. `gender`: checks Female-only or All
  8. `firstGraduate`: checks first-generation graduate criteria
  9. `minority`: checks religious or linguistic minority
  10. `disability`: checks PwD reservation
  11. `sportsQuota`: checks district/state/national sports representation
  12. `arrears`: penalizes or disqualifies candidates with standing arrears
  13. `department`: checks field of study
  14. `year_of_study`: checks current academic year
  15. `parentOccupation`: checks targeted schemes (e.g. farmers, defense)
  16. `quota`: checks management vs government quota
* **Scoring Formula**:
  $$\text{MatchScore} = \text{BaseMerit}(30\%) + \text{IncomeEligibility}(30\%) + \text{QuotaMatch}(20\%) + \text{AcademicCriteria}(20\%)$$

### 3. OCR Agent (`backend/app/agent/ocr_agent.py`)
* **Windows Tesseract Discovery**: Searches `C:\Program Files\Tesseract-OCR\tesseract.exe`, `C:\Program Files (x86)\Tesseract-OCR\tesseract.exe`, and system `PATH`.
* **Preprocessing Pipeline**: Converts input image to grayscale, applies Gaussian blur, Otsu adaptive thresholding, and contrast normalization.
* **Document Parsers**: Includes specialized regex parsers for:
  - `Aadhaar`: 12-digit UID pattern (`\d{4}\s\d{4}\s\d{4}`), DOB, gender.
  - `Income Certificate`: Revenue official stamp, annual amount pattern (`₹|Rs\.?\s*([0-9,]+)`).
  - `Community Certificate`: Sub-caste, community class (`BC|MBC|SC|ST|OBC`).
  - `Marksheet / Transcript`: Subject codes, credits, and CGPA extraction (`[0-9]\.[0-9]{1,2}`).

### 4. Verification Agent (`backend/app/agent/verification_agent.py`)
* Handles OCR errors and name formatting variations:
  - **Compact String Normalization**: Strips spaces, dots, punctuation and lowercases text (`"Anbu. G"` $\to$ `"anbug"`, `"ANBUG"` $\to$ `"anbug"`).
  - **Token Permutation Comparison**: Checks if token sets match across reversed family names (`{"anbu", "g"} == {"g", "anbu"}`).
  - **Fuzzy Levenshtein Ratio**: Requires $\ge 75\%$ similarity threshold to approve minor character misrecognitions (e.g. `O` vs `0`, `I` vs `1`).

---

## 🌐 Visible Google Playwright RPA Engine & Verification Protocol

Implemented in `backend/app/agent/google_verification_agent.py`:

```text
User clicks "Verify on Google"
              ↓
AdaptiveRpaVerificationModal opens
              ↓
useRef Execution Guard (verifies NOT triggered twice by StrictMode)
              ↓
POST /api/v1/agent/verify-scholarship
              ↓
Playwright launches visible desktop Chrome (headless=False)
              ↓
Query 1: "[Scholarship Name]" [Provider] eligibility criteria official application
              ↓
Query 2: "[Scholarship Name]" annual income limit CGPA criteria
              ↓
Query 3: "[Scholarship Name]" application deadline status 2025 2026
              ↓
Extract SERP snippets & verify against MySQL records
              ↓
Write audit row to Scholarship_Verification.xlsx
              ↓
Return structured Comparison Matrix to Modal
```

### 1. Anti-Bot Hardening & Stealth Initialization
Playwright launches real Chrome with the following flags:
```python
p.chromium.launch(
    headless=False,
    channel="chrome",
    args=["--start-maximized", "--disable-blink-features=AutomationControlled", "--no-sandbox"]
)
```
Initializes stealth context overriding `navigator.webdriver = undefined` and mocking plugins, languages, and runtime headers.

### 2. Interactive CAPTCHA Resolution ("Click Then Search Again")
When Google returns a bot verification page (`google.com/sorry`):
1. **Window Focus**: `page.bring_to_front()` elevates Chrome above other windows.
2. **Banner Injection**: Injects a fixed high-contrast notice banner:
   `🤖 ScholarAI: Please solve the CAPTCHA below. The search will automatically re-run once verified!`
3. **Auto-Click Checkbox**: Attempts programmatic click on `#recaptcha-anchor`.
4. **Resolution Polling**: Loops for up to 75 seconds waiting for the user to solve the challenge.
5. **Auto Re-Search**: Once verified, it automatically re-executes the search query and extracts results without requiring the user to press anything in the web app.

### 3. StrictMode Double-Launch Prevention Fix
In React 18 development mode, `<StrictMode>` mounts components twice. In `AdaptiveRpaVerificationModal.jsx`:
```javascript
const verificationStarted = useRef(false);

useEffect(() => {
  if (verificationStarted.current) return;
  verificationStarted.current = true;
  runVerification();
}, [schId]);
```
This ensures **exactly ONE browser window** opens, preventing duplicate execution and resource waste.

---

## 🔍 Computer Vision OCR & Fuzzy Cross-Verification Engine

### Comparison Status Logic:
* **`VERIFIED`**: Extracted credential strictly matches or falls within permitted tolerance of the database record.
* **`MISMATCH`**: Extracted value strictly violates the database value (e.g. income on certificate is ₹4,00,000 but student declared ₹1,50,000).
* **`UNVERIFIED / PENDING`**: Document not yet uploaded or illegible/blurry.

---

## 🌐 Dynamic Multilingual Translation Subsystem (Cloudflare LLaMA 3.1)

ScholarAI uses a zero-static-dictionary dynamic translation architecture:
* **Service**: `backend/app/services/translation_service.py`
* **Model**: `@cf/meta/llama-3.1-8b-instruct` on Cloudflare Workers AI.
* **Frontend Queue**: `src/services/translationManager.js` batches phrases into a single request every 60ms.
* **Dual Caching**:
  1. Fast in-memory dictionary.
  2. Persistent `localStorage` key-value pairs (`scholarai_trans_${lang}_${hash}`).
* **Target Languages (10)**:
  English (`en`), Tamil (`ta`), Hindi (`hi`), Telugu (`te`), Malayalam (`ml`), Kannada (`kn`), Bengali (`bn`), Marathi (`mr`), Gujarati (`gu`), Punjabi (`pa`).

---

## 🎙️ Voice Chat Subsystem (STT & TTS)

Integrated into `src/pages/dashboard/AssistantPage.jsx`:
1. **Speech-to-Text (`src/components/VoiceInput.jsx`)**:
   - Uses `window.webkitSpeechRecognition` / `window.SpeechRecognition`.
   - Uses BCP-47 regional language tag matched from `src/config/languages.js` (e.g. `ta-IN` for Tamil, `hi-IN` for Hindi).
   - Inserts transcript directly into user input box for human review before submission.
2. **Text-to-Speech (`src/components/VoiceOutput.jsx`)**:
   - Uses `window.speechSynthesis`.
   - Strips markdown formatting, links, and code blocks before speaking.
   - Provides Listen (🔊) and Stop (⏹) interactive controls.

---

## 📜 Certificate Generator & Profile AutoFill Engine

Located in `src/pages/dashboard/CertificateGeneratorPage.jsx`:
* Generates authentic, printable government-styled certificates:
  1. **Aadhaar Identity Card**: UIDAI seal, photo frame, 12-digit number, QR representation.
  2. **Tahsildar Income Certificate**: Revenue Department emblem, certified annual income.
  3. **Community Certificate**: Government of Tamil Nadu / State format with caste categories.
  4. **College Bonafide Certificate**: Academic Dean signature, register number, department.
  5. **Academic Grade Sheet**: Tabular semester GPA and cumulative credits.
* **1-Click AutoFill**: Reads active `userProfile` from backend and populates all fields.
* **Export**: Employs `html2canvas` to render pixel-perfect `.png` certificates directly into the student's download folder.

---

## 📬 Transactional Notifications Subsystem (Brevo)

* Implemented in `backend/app/services/email_service.py`.
* Uses Brevo (formerly Sendinblue) REST API (`https://api.brevo.com/v3/smtp/email`).
* Triggers automatic HTML confirmation receipts whenever a student submits a verified scholarship application, including application reference number, scholarship name, date, and status tracking link.

---

## 📡 Complete REST API Endpoint Dictionary

| Method | Endpoint | Auth | Request Body | Response / Purpose |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/v1/auth/register` | None | `{fullName, email, password}` | Registers student, returns JWT token |
| `POST` | `/api/v1/auth/login` | None | `{email, password}` | Validates credentials, returns JWT |
| `GET` | `/api/v1/auth/google/login` | None | None | Initiates Google OAuth 2.0 flow |
| `POST` | `/api/v1/translate` | None | `{texts: [...], target_lang: "ta"}` | Dynamic Cloudflare LLaMA translation |
| `POST` | `/api/v1/chat` | JWT | `{message: "...", history: [...]}` | Grounded Gemini educational counselor |
| `GET` | `/api/v1/profile` | JWT | None | Fetches 16-parameter student profile |
| `PUT` | `/api/v1/profile` | JWT | Full `UserProfile` JSON | Updates 16-parameter student profile |
| `POST` | `/api/v1/documents/upload` | JWT | `multipart/form-data` (file, type) | Uploads document & runs Tesseract OCR |
| `GET` | `/api/v1/scholarships/matching` | JWT | None | Runs 16-parameter eligibility engine |
| `POST` | `/api/v1/agent/verify-scholarship`| JWT | Scholarship JSON payload | Launches visible Playwright Google RPA |
| `POST` | `/api/v1/agent/run` | JWT | `{scholarship_id: 1}` | Runs full multi-agent pipeline |
| `POST` | `/api/v1/applications/{id}` | JWT | None | Submits application & sends Brevo email |
| `GET` | `/api/v1/admin/analytics` | Admin| None | Total students, documents & approvals |
| `PUT` | `/api/v1/admin/applications/{id}/status`| Admin| `{status: "Approved"}` | Approves/rejects student application |

---

## 🛡️ Critical Engineering Safeguards & Gotchas

1. **React StrictMode & Browser Launch Duplication**:
   - Always keep `const verificationStarted = useRef(false);` in `AdaptiveRpaVerificationModal.jsx`. Never remove it, or React StrictMode in development will open two Chrome windows simultaneously.
2. **Tesseract Windows Executable Detection**:
   - In `ocr_agent.py`, always ensure fallback checks for `C:\Program Files\Tesseract-OCR\tesseract.exe`.
3. **Database Null-Safety**:
   - When calculating match percentages in `matching_agent.py`, always wrap string-to-float parsing in `try/except` to prevent crashes when scholarship fields contain text like `"Not Specified"`.
4. **CORS Headers**:
   - `main.py` must maintain CORS configuration for local Vite development (`http://localhost:5173`).

---

## 🚀 Environment Setup & Deployment Guide

### 1. Environment Secrets (`backend/.env`)
```ini
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Database Connection (MySQL)
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/scholarship_db

# Brevo Transactional Email
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_email@domain.com
BREVO_SENDER_NAME="ScholarAI Support"

# Cloudflare Workers AI (LLaMA 3.1 Translation)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Google Serper API (Optional Fallback)
SERPER_API_KEY=your_serper_api_key
```

### 2. Quick Launch Commands
* **Start Backend**:
  ```powershell
  cd D:\sriramajayam\newbeg\backend
  .\venv\Scripts\activate
  uvicorn app.main:app --reload --port 8000
  ```
* **Start Frontend**:
  ```powershell
  cd D:\sriramajayam\newbeg
  npm run dev
  ```
* **Default Admin Account**:
  - Email: `admin@scholarship.com`
  - Password: `Admin@123`
