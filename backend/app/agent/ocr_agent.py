import json
import os
import re
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from .. import models, crud
from .classifier_agent import DocumentClassificationAgent

try:
    import pytesseract
    # Auto-detect Tesseract executable on Windows
    tesseract_candidates = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        os.path.expandvars(r'%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe')
    ]
    for tc in tesseract_candidates:
        if os.path.exists(tc):
            pytesseract.pytesseract.tesseract_cmd = tc
            break
except ImportError:
    pass

def correct_ocr_name(extracted_name: str, profile_name: str = None) -> str:
    """
    Sanitizes OCR extracted names, correcting common OCR scanning confusions
    such as 'V' instead of 'Y' (e.g. SRINAGAPRIVAA -> SRINAGAPRIYA A, PRIVA -> PRIYA),
    '1' or 'L' instead of 'I' (e.g. SRIVANL -> srivani), and aligning against
    the authenticated student profile name when a high-confidence fuzzy match exists.
    """
    if not extracted_name:
        return extracted_name

    clean_ext = re.sub(r'\s+', ' ', str(extracted_name)).strip()

    # 1. Profile-guided alignment if profile_name is available
    if profile_name and str(profile_name).strip():
        prof = re.sub(r'\s+', ' ', str(profile_name)).strip()
        clean_p = re.sub(r'[^A-Za-z0-9]', '', prof).upper()
        clean_e = re.sub(r'[^A-Za-z0-9]', '', clean_ext).upper()

        if clean_p == clean_e:
            return prof

        def normalize_chars(s):
            return (s.replace('V', 'Y')
                     .replace('1', 'I')
                     .replace('L', 'I')
                     .replace('|', 'I')
                     .replace('!', 'I')
                     .replace('0', 'O')
                     .replace('5', 'S')
                     .replace('8', 'B'))

        # Exact match after OCR character equivalence (e.g. SRINAGAPRIVAA == SRINAGAPRIYA A)
        if normalize_chars(clean_p) == normalize_chars(clean_e):
            return prof

        # Levenshtein distance check with zero cost for known OCR character confusions
        len_p, len_e = len(clean_p), len(clean_e)
        if abs(len_p - len_e) <= 3:
            dp = [[0] * (len_e + 1) for _ in range(len_p + 1)]
            for i in range(len_p + 1):
                dp[i][0] = i
            for j in range(len_e + 1):
                dp[0][j] = j
            for i in range(1, len_p + 1):
                for j in range(1, len_e + 1):
                    ch_p = clean_p[i - 1]
                    ch_e = clean_e[j - 1]
                    if (ch_p == ch_e or 
                        (ch_p in ('Y', 'V') and ch_e in ('Y', 'V')) or 
                        (ch_p in ('I', 'L', '1') and ch_e in ('I', 'L', '1')) or
                        (ch_p in ('O', '0') and ch_e in ('O', '0'))):
                        cost = 0
                    else:
                        cost = 1
                    dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)

            edit_dist = dp[len_p][len_e]
            max_len = max(len_p, len_e, 1)
            similarity = 1.0 - (edit_dist / max_len)
            if similarity >= 0.75 or edit_dist <= 2:
                return prof

    # 2. Standalone pattern-based OCR corrections for common names
    corrected = clean_ext
    # Fix PRIVAA -> PRIYA A, PRIVA -> PRIYA
    corrected = re.sub(r'\bPRIVAA\b', 'PRIYA A', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'PRIVAA\b', 'PRIYA A', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'PRIVA\b', 'PRIYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'PRIVA([A-Z])', r'PRIYA \1', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'([A-Z]+)PRIVA', r'\1PRIYA', corrected, flags=re.IGNORECASE)
    # Fix VIJAV -> VIJAY, JAVA -> JAYA
    corrected = re.sub(r'\bVIJAV\b', 'VIJAY', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'VIJAV\b', 'VIJAY', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'\bJAVA\b', 'JAYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'([A-Z]+)JAVA\b', r'\1JAYA', corrected, flags=re.IGNORECASE)
    # Fix other common -ya suffixes misrecognized as -va
    corrected = re.sub(r'KAVVA\b', 'KAVYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'DIVVA\b', 'DIVYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'SURVA\b', 'SURYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'RAMVA\b', 'RAMYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'BHAGVA\b', 'BHAGYA', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'SOWMV\b', 'SOWMY', corrected, flags=re.IGNORECASE)
    corrected = re.sub(r'DHVA\b', 'DHYA', corrected, flags=re.IGNORECASE)

    return corrected

class BaseOCREngine(ABC):
    @abstractmethod
    def extract_text(self, file_path: str, doc_type: str) -> dict:
        pass

class TesseractOCREngine(BaseOCREngine):
    def __init__(self):
        self.classifier = DocumentClassificationAgent()
        self.label_map = {
            "aadhaar": "Aadhaar Card",
            "income": "Income Certificate",
            "community": "Community Certificate",
            "tenth": "10th Marksheet",
            "twelfth": "12th Marksheet",
            "college": "College Transcript",
            "college_id": "College ID",
            "disability": "Disability Certificate",
            "sportsQuota": "Sports Quota Certificate",
            "sports": "Sports Quota Certificate",
            "firstGraduate": "First Graduate Certificate",
            "ncc": "NCC Certificate",
            "nss": "NSS Certificate",
            "minority": "Minority Certificate",
            "Unknown": "Unknown Document"
        }

    def _preprocess_image(self, img):
        try:
            from PIL import ImageEnhance, Image
            width, height = img.size
            if width < 2500:
                scale = 2.5
                new_size = (int(width * scale), int(height * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                
            img = img.convert("L")
            img = ImageEnhance.Contrast(img).enhance(2.0)
            img = ImageEnhance.Sharpness(img).enhance(1.8)
            img = img.point(lambda p: 255 if p > 140 else 0)
            return img
        except Exception as e:
            print(f"[OCR Preprocessing Warning] {e}")
            return img

    def _run_tesseract_multi_psm(self, raw_img, expected_type) -> str:
        import pytesseract
        psm_modes = [
            ("--psm 3", "Default Page Segmentation"),
            ("--psm 6", "Single Uniform Block"),
            ("--psm 11", "Sparse Text")
        ]
        
        # Try raw image first with all PSM modes
        best_text = ""
        for psm_flag, desc in psm_modes:
            try:
                candidate = pytesseract.image_to_string(raw_img, config=psm_flag)
                if candidate.strip():
                    parsed = self._parse_fields(candidate, expected_type)
                    if expected_type == "college" and parsed.get("cgpa") is not None:
                        return candidate
                    if expected_type == "income" and parsed.get("annual_income") is not None:
                        return candidate
                    if expected_type == "community" and parsed.get("category") is not None:
                        return candidate
                    if expected_type == "aadhaar" and parsed.get("name") is not None:
                        return candidate
                    if expected_type in ("tenth", "twelfth") and parsed.get("calculated_percentage") is not None:
                        return candidate
                    if expected_type in ("disability", "sportsQuota", "sports", "firstGraduate", "ncc", "nss", "minority") and parsed.get("name") is not None:
                        return candidate
                    
                    if not best_text:
                        best_text = candidate
            except Exception as e:
                print(f"[OCR Pipeline Raw] Exception on PSM {psm_flag}: {e}")

        # If raw image didn't extract fields, try preprocessing fallback
        preprocessed_img = self._preprocess_image(raw_img)
        for psm_flag, desc in psm_modes:
            try:
                candidate = pytesseract.image_to_string(preprocessed_img, config=psm_flag)
                if candidate.strip():
                    parsed = self._parse_fields(candidate, expected_type)
                    if expected_type == "college" and parsed.get("cgpa") is not None:
                        return candidate
                    if expected_type == "income" and parsed.get("annual_income") is not None:
                        return candidate
                    if expected_type == "community" and parsed.get("category") is not None:
                        return candidate
                    if expected_type == "aadhaar" and parsed.get("name") is not None:
                        return candidate
                    if expected_type in ("tenth", "twelfth") and parsed.get("calculated_percentage") is not None:
                        return candidate
                    if expected_type in ("disability", "sportsQuota", "sports", "firstGraduate", "ncc", "nss", "minority") and parsed.get("name") is not None:
                        return candidate
            except Exception as e:
                print(f"[OCR Pipeline Preprocessed] Exception on PSM {psm_flag}: {e}")

        return best_text

    def _extract_pdf(self, file_path: str, expected_type: str) -> str:
        text = ""
        # 1. Try PyPDF / pypdf
        try:
            import importlib
            pypdf_module = None
            try:
                pypdf_module = importlib.import_module("pypdf")
            except Exception:
                try:
                    pypdf_module = importlib.import_module("PyPDF2")
                except Exception:
                    pass

            if pypdf_module and hasattr(pypdf_module, "PdfReader"):
                reader = pypdf_module.PdfReader(file_path)
                for page in reader.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            print(f"[PDF EXTRACTION WARNING] PDF text extraction failed: {e}")

        # 2. Try PIL Image directly if it's an image-format container
        if not text.strip() or len(text.strip()) < 10:
            try:
                from PIL import Image
                img = Image.open(file_path)
                img_text = self._run_tesseract_multi_psm(img, expected_type)
                if img_text.strip():
                    return img_text
            except Exception:
                pass

            # 3. Try pdf2image dynamically if installed
            try:
                import importlib
                pdf2img_module = importlib.import_module("pdf2image")
                if hasattr(pdf2img_module, "convert_from_path"):
                    pages = pdf2img_module.convert_from_path(file_path, first_page=1, last_page=1)
                    if pages:
                        text = self._run_tesseract_multi_psm(pages[0], expected_type)
            except Exception as e:
                print(f"[PDF EXTRACTION WARNING] pdf2image fallback failed: {e}")

        return text

    def extract_text(self, file_path: str, expected_type: str) -> dict:
        extracted = {"status": "success"}
        try:
            import shutil
            import pytesseract
            from PIL import Image
            
            # Auto-detect Tesseract executable
            possible_tess_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
                shutil.which("tesseract") or ""
            ]
            for tp in possible_tess_paths:
                if tp and os.path.exists(tp):
                    pytesseract.pytesseract.tesseract_cmd = tp
                    break

            # Robust file path resolution across folders
            if not os.path.isabs(file_path) or not os.path.exists(file_path):
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                filename_only = os.path.basename(file_path)
                alt_path = os.path.join(backend_dir, "uploads", filename_only)
                if os.path.exists(alt_path):
                    file_path = alt_path
                elif os.path.exists(os.path.join("uploads", filename_only)):
                    file_path = os.path.abspath(os.path.join("uploads", filename_only))

            if file_path.lower().endswith(".pdf"):
                raw_text = self._extract_pdf(file_path, expected_type)
            else:
                img = Image.open(file_path)
                raw_text = self._run_tesseract_multi_psm(img, expected_type)
            
            text_lower = raw_text.lower()
            extracted["raw_text"] = raw_text

            # Step 1: Run Classification Agent
            detected_type = self.classifier.classify(raw_text)
            extracted["detected_type"] = detected_type
            extracted["expected_type"] = expected_type

            # Step 2: Extract fields (run expected_type parser, and if classification differs, also extract from detected_type)
            parsed = self._parse_fields(raw_text, expected_type)
            if detected_type != expected_type and detected_type != "Unknown":
                detected_parsed = self._parse_fields(raw_text, detected_type)
                for k, v in detected_parsed.items():
                    if (parsed.get(k) is None or parsed.get(k) == "") and v is not None:
                        parsed[k] = v

            extracted.update(parsed)

            if detected_type != expected_type:
                extracted["classification_failed"] = True
                extracted["classification_warning"] = {
                    "expected": self.label_map.get(expected_type, expected_type),
                    "received": self.label_map.get(detected_type, detected_type)
                }

        except Exception as e:
            print(f"[OCR ERROR] Tesseract OCR failed: {e}")
            return {"status": "error", "message": str(e)}
            
        return extracted

    def _parse_fields(self, text: str, doc_type: str) -> dict:
        if doc_type == "aadhaar":
            return self._parse_aadhaar(text)
        elif doc_type == "income":
            return self._parse_income(text)
        elif doc_type == "community":
            return self._parse_community(text)
        elif doc_type == "college":
            return self._parse_college(text)
        elif doc_type in ("tenth", "twelfth"):
            return self._parse_marks(text, doc_type)
        elif doc_type == "disability":
            return self._parse_disability(text)
        elif doc_type in ("sportsQuota", "sports"):
            return self._parse_sports(text)
        elif doc_type == "firstGraduate":
            return self._parse_first_graduate(text)
        elif doc_type == "ncc":
            return self._parse_ncc(text)
        elif doc_type == "nss":
            return self._parse_nss(text)
        elif doc_type == "minority":
            return self._parse_minority(text)
        return {}

    def _parse_disability(self, text: str) -> dict:
        result = {}
        # 1. Name: "carefully examined ANU, Son" or "carefully examined [Name]"
        m_name = re.search(r"carefully\s+examined\s+([A-Za-z\s\.]+?)(?:,|\s+Son|\s+Daughter|\s+Ward|\n)", text, re.IGNORECASE)
        if m_name:
            val = m_name.group(1).strip()
            val_clean = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
            if len(val_clean) >= 2:
                result["name"] = val_clean

        if not result.get("name"):
            m_name2 = re.search(r"(?:Name|Applicant Name)\s*[:/]\s*([A-Za-z\s\.]+)", text, re.IGNORECASE)
            if m_name2:
                val_clean = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if len(val_clean) >= 2:
                    result["name"] = val_clean

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number)\s*[:/]?\s*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. DOB
        m_dob = re.search(r"DOB\s*[:/]?\s*(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})", text, re.IGNORECASE)
        if m_dob:
            result["dob"] = m_dob.group(1).strip()

        # 4. Gender
        m_gen = re.search(r"Gender\s*[:/]?\s*(MALE|FEMALE|TRANSGENDER|OTHER)", text, re.IGNORECASE)
        if m_gen:
            result["gender"] = m_gen.group(1).strip().upper()

        # 5. Percentage
        m_pct = re.search(r"(?:DISABILITY\s+ASSESSMENT|Disability\s+Percentage|Percentage|assessment)\D*?(\d{1,3})\s*%", text, re.IGNORECASE)
        if m_pct:
            result["percentage"] = m_pct.group(1).strip()
        else:
            m_pct2 = re.search(r"(\d{1,3})\s*%\s*(?:benchmark\s+disability)?", text, re.IGNORECASE)
            if m_pct2:
                result["percentage"] = m_pct2.group(1).strip()

        # 6. Disability classification / type
        m_type = re.search(r"(?:Disability\s+Classification|Disability\s+Type)\s*[:/]?\s*\n?([^\n]+)", text, re.IGNORECASE)
        if m_type:
            val = m_type.group(1).strip()
            if val and len(val) >= 3 and not val.lower().startswith("medical"):
                result["disability_type"] = val

        # 7. Diagnosis
        m_diag = re.search(r"Diagnosis\s*[:/]?\s*\n?([^\n]+)", text, re.IGNORECASE)
        if m_diag:
            val = m_diag.group(1).strip()
            if val and len(val) >= 3 and not val.lower().startswith("medical"):
                result["diagnosis"] = val

        # 8. Date of Issue
        m_date = re.search(r"Date\s+(?:of\s+Issue)?\s*[:/]?\s*(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})", text, re.IGNORECASE)
        if m_date:
            result["date"] = m_date.group(1).strip()

        result["disability_status"] = "Verified PwD"
        return result

    def _parse_sports(self, text: str) -> dict:
        result = {}
        # 1. Athlete Name
        m_name = re.search(r"certify\s+that\s+([A-Za-z\s\.]+?)(?:,|\s+Son|\s+Daughter|\s+Ward|\s+has|\n)", text, re.IGNORECASE)
        if m_name:
            val = re.sub(r'[^a-zA-Z\s\.]', '', m_name.group(1)).strip()
            if len(val) >= 2:
                result["name"] = val
        if not result.get("name"):
            m_name2 = re.search(r"(?:Athlete\s+Name|Name|Player)\s*[:/]?\s*([A-Za-z\s\.]+)", text, re.IGNORECASE)
            if m_name2:
                val = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if len(val) >= 2:
                    result["name"] = val

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number|Serial|Sl\s*No)\s*[:/]?\s*([A-Za-z0-9\-/]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. Sport Name
        m_sport = re.search(r"(?:Sport|Discipline|Game|event\s+of)\s*[:/]?\s*([^\n,]+)", text, re.IGNORECASE)
        if m_sport:
            result["sport_name"] = m_sport.group(1).strip()

        # 4. Achievement / Position
        m_ach = re.search(r"(Gold\s+Medal\w*|Silver\s+Medal\w*|Bronze\s+Medal\w*|1st\s+Position|2nd\s+Position|3rd\s+Position|Winner|Runner|Participation)", text, re.IGNORECASE)
        if m_ach:
            result["achievement"] = m_ach.group(1).strip()

        # 5. Competition Level
        m_lvl = re.search(r"(National\s+Level|State\s+Level|District\s+Level|Inter-University|SGFI|All\s+India)", text, re.IGNORECASE)
        if m_lvl:
            result["competition_level"] = m_lvl.group(1).strip()

        result["sports_status"] = "Eligible Sports Quota"
        return result

    def _parse_first_graduate(self, text: str) -> dict:
        result = {}
        # 1. Candidate Name
        m_name = re.search(r"(?:Selvi|Thiru|certify\s+that)\s+([A-Za-z\s\.]+?)(?:,|\s+Son|\s+Daughter|\s+residing|\n)", text, re.IGNORECASE)
        if m_name:
            val = re.sub(r'[^a-zA-Z\s\.]', '', m_name.group(1)).strip()
            if len(val) >= 2:
                result["name"] = val
        if not result.get("name"):
            m_name2 = re.search(r"(?:Candidate\s+Name|Applicant\s+Name|Name)\s*[:/]?\s*([A-Za-z\s\.]+)", text, re.IGNORECASE)
            if m_name2:
                val = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if len(val) >= 2:
                    result["name"] = val

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number)\s*[:/]?\s*([A-Za-z0-9\-/]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. District
        m_dist = re.search(r"District\s*[:/]?\s*([A-Za-z\s]+)", text, re.IGNORECASE)
        if m_dist:
            result["district"] = m_dist.group(1).strip()

        result["first_graduate_status"] = "Verified First Graduate"
        return result

    def _parse_ncc(self, text: str) -> dict:
        result = {}
        # 1. Cadet Name
        m_name = re.search(r"(?:Cadet|Name)\s*[:/]?\s*([A-Za-z\s\.]+?)(?:,|\s+Son|\s+Daughter|\s+of|\n)", text, re.IGNORECASE)
        if m_name:
            val = re.sub(r'[^a-zA-Z\s\.]', '', m_name.group(1)).strip()
            if len(val) >= 2:
                result["name"] = val
        if not result.get("name"):
            m_name2 = re.search(r"certify\s+that\s+([A-Za-z\s\.]+?)(?:,|\s+has|\s+Son|\n)", text, re.IGNORECASE)
            if m_name2:
                val = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if len(val) >= 2:
                    result["name"] = val

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number|Sl\s*No)\s*[:/]?\s*([A-Za-z0-9\-/]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. Unit / Battalion
        m_unit = re.search(r"Unit\s*[:/]?\s*([^\n,]+)", text, re.IGNORECASE)
        if m_unit:
            result["unit"] = m_unit.group(1).strip()

        # 4. Certificate Grade
        m_grade = re.search(r"('(?:A|B|C)'\s*Certificate|Certificate\s*['\"]?(?:A|B|C)['\"]?)", text, re.IGNORECASE)
        if m_grade:
            result["cert_type"] = m_grade.group(1).strip()

        result["ncc_status"] = "Eligible NCC Cadet"
        return result

    def _parse_nss(self, text: str) -> dict:
        result = {}
        # 1. Volunteer Name
        # Certificate template typically has: "This is to certify that Volunteer \n [NAME] \n Student of [COLLEGE]"
        name_val = None
        m_name = re.search(r"certify\s+that\s+(?:Volunteer\s+)?(?:\n\s*)?([A-Za-z\s\.]+?)(?:\s*\n|\s+Student|\s+of|\s+has|,)", text, re.IGNORECASE)
        if m_name:
            val = re.sub(r'[^a-zA-Z\s\.]', '', m_name.group(1)).strip()
            # If val is just 'Volunteer' or contains generic words, look on the next line
            if val.lower() in ("volunteer", "volunteer name", "the volunteer", "student", ""):
                m_next = re.search(r"certify\s+that\s+Volunteer\s*\n+([A-Za-z\s\.]+?)(?:\s*\n|\s+Student|\s+of|,)", text, re.IGNORECASE)
                if m_next:
                    val = re.sub(r'[^a-zA-Z\s\.]', '', m_next.group(1)).strip()
            if val and val.lower() not in ("volunteer", "student", "candidate", "") and len(val) >= 2:
                name_val = val

        if not name_val:
            m_name2 = re.search(r"(?:Volunteer\s+Name|Name)\s*[:/]?\s*([A-Za-z\s\.]+)", text, re.IGNORECASE)
            if m_name2:
                val = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if val.lower() not in ("volunteer", "student", "candidate") and len(val) >= 2:
                    name_val = val

        if name_val:
            result["name"] = name_val

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number|Sl\s*No)\s*[:/]?\s*([A-Za-z0-9\-/]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. College
        m_col = re.search(r"Student\s+of\s+([^\n,]+)", text, re.IGNORECASE)
        if m_col:
            result["college"] = m_col.group(1).strip()
        else:
            m_col2 = re.search(r"(?:College|Institution)\s*[:/]?\s*([^\n,]+)", text, re.IGNORECASE)
            if m_col2:
                result["college"] = m_col2.group(1).strip()

        result["nss_status"] = "Eligible NSS Volunteer"
        return result

    def _parse_minority(self, text: str) -> dict:
        result = {}
        # 1. Applicant Name
        m_name = re.search(r"certify\s+that\s+([A-Za-z\s\.]+?)(?:,|\s+Son|\s+Daughter|\s+resident|\n)", text, re.IGNORECASE)
        if m_name:
            val = re.sub(r'[^a-zA-Z\s\.]', '', m_name.group(1)).strip()
            if len(val) >= 2:
                result["name"] = val
        if not result.get("name"):
            m_name2 = re.search(r"(?:Applicant\s+Name|Name)\s*[:/]?\s*([A-Za-z\s\.]+)", text, re.IGNORECASE)
            if m_name2:
                val = re.sub(r'[^a-zA-Z\s\.]', '', m_name2.group(1)).strip()
                if len(val) >= 2:
                    result["name"] = val

        # 2. Certificate No
        m_cert = re.search(r"Certificate\s*(?:No|Number)\s*[:/]?\s*([A-Za-z0-9\-/]+)", text, re.IGNORECASE)
        if m_cert:
            result["certificate_no"] = m_cert.group(1).strip()

        # 3. Minority community / religion
        m_rel = re.search(r"(Muslim|Christian|Sikh|Buddhist|Jain|Parsi|Linguistic)", text, re.IGNORECASE)
        if m_rel:
            result["minority_category"] = m_rel.group(1).strip()

        result["minority_status"] = "Verified Minority"
        return result

    def _parse_aadhaar(self, text: str) -> dict:
        result = {}
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        name_found = None

        # 1. Explicit Name labels: Name / Student Name / Full Name / नाम / Name
        for i, line in enumerate(lines):
            line_cleaned = line.strip()
            if re.search(r"\b(name|नाम)\b", line_cleaned, re.IGNORECASE):
                if ":" in line_cleaned:
                    val = line_cleaned.split(":", 1)[1].strip()
                    if val and len(re.sub(r'[^a-zA-Z\s\.]', '', val).strip()) >= 2:
                        name_found = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
                        break
                elif "/" in line_cleaned:
                    val = line_cleaned.split("/", 1)[1].strip()
                    name_part = re.sub(r'^(name|नाम|[\s/])+', '', val, flags=re.IGNORECASE).strip()
                    if name_part and len(re.sub(r'[^a-zA-Z\s\.]', '', name_part).strip()) >= 2:
                        name_found = re.sub(r'[^a-zA-Z\s\.]', '', name_part).strip()
                        break
                
                # Check next line
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not any(k in next_line.lower() for k in ["dob", "date", "gender", "male", "female", "year", "government", "india", "uidai"]):
                        clean_val = re.sub(r'[^a-zA-Z\s\.]', '', next_line).strip()
                        if len(clean_val) >= 2:
                            name_found = clean_val
                            break

        # 2. Fallback: Search for name line above DOB / Gender / Year of Birth
        if not name_found:
            header_noise = {"government", "india", "unique", "identification", "authority", "uidai", "enrollment", "help", "mera", "aadhaar", "card", "male", "female", "transgender", "father", "address", "to"}
            for i, line in enumerate(lines):
                if re.search(r"\b(?:DOB|Date of Birth|Year of Birth|Gender|Male|Female)\b", line, re.IGNORECASE):
                    # Check preceding 1 or 2 lines
                    for offset in [1, 2]:
                        if i - offset >= 0:
                            cand = lines[i - offset].strip()
                            clean_cand = re.sub(r'[^a-zA-Z\s\.]', '', cand).strip()
                            words = [w.lower() for w in clean_cand.split() if w]
                            if len(clean_cand) >= 2 and not any(w in header_noise for w in words):
                                name_found = clean_cand
                                break
                    if name_found:
                        break

        if name_found:
            name_found = re.split(r"\b(?:DOB|Date|Gender|Aadhaar|Male|Female)\b", name_found, flags=re.IGNORECASE)[0].strip()
            result["name"] = correct_ocr_name(name_found.strip())

        dob_match = re.search(r"(?:DOB|Date of Birth|D\.O\.B|Year of Birth)\s*[:\-]?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4})", text, re.IGNORECASE)
        if dob_match:
            result["dob"] = dob_match.group(1).strip()

        gender_match = re.search(r"\b(Male|Female|Transgender)\b", text, re.IGNORECASE)
        if gender_match:
            result["gender"] = gender_match.group(1).capitalize()

        aadhaar_num_match = re.search(r"(?:Aadhaar\s*No\.?|Aadhar\s*No\.?|UID)?\s*[:\-]?\s*([2-9]\d{3}\s*\d{4}\s*\d{4})", text, re.IGNORECASE)
        if aadhaar_num_match:
            result["aadhaar_no"] = re.sub(r"\s+", "", aadhaar_num_match.group(1).strip())

        states = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
            "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
            "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
            "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
        ]
        for state in states:
            if state.lower() in text.lower():
                result["state"] = state
                break

        return result

    def _parse_income(self, text: str) -> dict:
        result = {}
        # Parse Name
        name_found = None
        prefix_match = re.search(
            r"\b(?:Thiru\s*[\/\\]?\s*Selvi|Thiru|Selvi|Tmt|Thiruvalar|Shri|Smt)\s+([a-zA-Z\s\.]+?)(?=\s+\b(?:son|daughter|wife|residing|of|s/o|d/o|w/o)\b)",
            text, re.IGNORECASE
        )
        if prefix_match:
            name_found = prefix_match.group(1).strip()

        if not name_found:
            lines = text.split("\n")
            for line in lines:
                if "name" in line.lower():
                    if ":" in line:
                        val = line.split(":", 1)[1].strip()
                        clean_name = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
                        if len(clean_name) >= 2 and not any(k in clean_name.lower() for k in ["register", "roll", "candidate"]):
                            name_found = clean_name
                            break

        if name_found:
            result["name"] = name_found.strip()

        # Extract income amount
        income_match = re.search(
            r"(?:Rs\.?|INR|₹|Rupees|Annual\s*Income|Total\s*Income|Income)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)",
            text, re.IGNORECASE
        )
        if income_match:
            raw = income_match.group(1).replace(",", "")
            try:
                val = float(raw)
                if val > 0:
                    result["annual_income"] = val
            except ValueError:
                pass

        if "annual_income" not in result:
            # Fallback: scan for any standalone number formatted as money (e.g. 5,65,656 or 565656)
            num_matches = re.findall(r"\b(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d{4,8})\b", text)
            for nm in num_matches:
                clean_nm = nm.replace(",", "")
                try:
                    val = float(clean_nm)
                    if 1000 <= val <= 10000000:
                        result["annual_income"] = val
                        break
                except ValueError:
                    pass

        if "annual_income" in result:
            result["income"] = result["annual_income"]
        return result

    def _parse_community(self, text: str) -> dict:
        result = {}
        # Parse Name
        name_found = None
        # Pattern 1: standard certificate text "Thiru/Selvi Valarmadhi son of"
        prefix_match = re.search(
            r"\b(?:Thiru\s*[\/\\]?\s*Selvi|Thiru|Selvi|Tmt|Thiruvalar|Shri|Smt)\s+([a-zA-Z\s\.]+?)(?=\s+\b(?:son|daughter|wife|residing|of|s/o|d/o|w/o)\b)",
            text, re.IGNORECASE
        )
        if prefix_match:
            name_found = prefix_match.group(1).strip()

        # Pattern 2: line containing "name" label
        if not name_found:
            lines = text.split("\n")
            for line in lines:
                if "name" in line.lower():
                    if ":" in line:
                        val = line.split(":", 1)[1].strip()
                        clean_name = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
                        if len(clean_name) >= 2 and not any(k in clean_name.lower() for k in ["register", "roll", "candidate"]):
                            name_found = clean_name
                            break
        if name_found:
            result["name"] = name_found.strip()

        cat_found = None
        # 1. Search for acronyms in parentheses or bounded: e.g. (BCM), (MBC/DNC), (OBC), (SC), (ST), (BC)
        paren_match = re.search(r'\(\s*(BCM|MBC\s*\/?\s*DNC|DNC|EWS|MBC|OBC|SC|ST|BC|General|Minority)\s*\)', text, re.IGNORECASE)
        if paren_match:
            cat_found = paren_match.group(1).upper().replace(" ", "")
        
        # 2. Search bounded keywords
        if not cat_found:
            categories = ["BCM", "MBC/DNC", "MBC", "DNC", "EWS", "OBC", "SC", "ST", "BC", "General", "Minority"]
            for cat in categories:
                escaped = re.escape(cat)
                if re.search(r'\b' + escaped + r'\b', text, re.IGNORECASE):
                    cat_found = cat.upper()
                    break

        # 3. Full text matching
        if not cat_found:
            if re.search(r'backward\s+class\s*\(?\s*muslim\s*\)?', text, re.IGNORECASE) or re.search(r'backward\s+class\s+muslim', text, re.IGNORECASE):
                cat_found = "BCM"
            elif re.search(r'most\s+backward\s+class', text, re.IGNORECASE):
                cat_found = "MBC"
            elif re.search(r'backward\s+class', text, re.IGNORECASE):
                cat_found = "BC"
            elif re.search(r'scheduled\s+caste', text, re.IGNORECASE):
                cat_found = "SC"
            elif re.search(r'scheduled\s+tribe', text, re.IGNORECASE):
                cat_found = "ST"
            elif re.search(r'other\s+backward\s+class', text, re.IGNORECASE):
                cat_found = "OBC"

        if cat_found:
            result["category"] = cat_found
            result["community"] = cat_found
        
        states = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh"]
        for state in states:
            if state.lower() in text.lower():
                result["state"] = state
                break

        return result

    def _parse_college(self, text: str) -> dict:
        result = {}
        # Normalize text lines
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        # Parse CGPA score with priority labels
        cgpa_label_match = re.search(
            r"(?:CGPA Score|CGPA|C\.G\.P\.A|Cumulative Grade Point Average|Grade Point Average)\s*[:\-]?\s*([0-9]\.[0-9]{1,2})\b",
            text, re.IGNORECASE
        )
        if cgpa_label_match:
            try:
                val = float(cgpa_label_match.group(1))
                if 0.0 <= val <= 10.0:
                    result["cgpa"] = val
            except ValueError:
                pass

        # Positional or keyword-based parsing for other fields
        college_val = None
        course_val = None
        reg_val = None
        name_val = None

        # 1. Extract College
        for line in lines:
            if any(term in line.lower() for term in ["college", "university", "technology", "institute", "school"]):
                if not any(k in line.lower() for k in ["identity", "card", "statement", "grades", "marksheet"]):
                    val = re.sub(r"^(?:college|university|technology|institute|school)\s*[:\-]?\s*", "", line, flags=re.IGNORECASE).strip()
                    if val:
                        college_val = val
                        break

        # 2. Extract Register Number
        for line in lines:
            if re.search(r"\b[A-Z0-9]{5,}\b", line) or "/" in line:
                if any(term in line.lower() for term in ["reg no", "register", "roll"]):
                    val = re.sub(r"^(?:reg no|register number|roll no|roll number|register)\s*[:\-]?\s*", "", line, flags=re.IGNORECASE).strip()
                    if val:
                        reg_val = val
                        break
                elif "/" in line and any(c.isdigit() for c in line) and not any(k in line.lower() for k in ["session", "date", "dob"]):
                    reg_val = line.strip()
                    break

        # 3. Extract Course
        for line in lines:
            if any(c in line.lower() for c in ["b.e.", "b.tech", "b.e", "be", "btech", "b.sc", "bsc", "bca", "b.com", "bcom", "mca", "mba", "m.e", "mle", "m.tech"]):
                if not any(term in line.lower() for term in ["course", "branch", "programme"]):
                    course_val = line.strip()
                    break
                else:
                    val = re.sub(r"^(?:course|branch|programme)\s*[:\-]?\s*", "", line, flags=re.IGNORECASE).strip()
                    if val:
                        course_val = val
                        break

        # Non-name words to avoid false positive name matches
        non_name_tokens = {
            'reg', 'register', 'registration', 'roll', 'college', 'university', 'technology',
            'institute', 'school', 'name', 'candidate', 'student', 'identity', 'card', 'id',
            'course', 'branch', 'programme', 'batch', 'cgpa', 'gpa', 'score', 'grade', 'grades',
            'dob', 'gender', 'session', 'date', 'valid', 'validity', 'signature', 'principal',
            'dean', 'institution', 'department', 'dept', 'engineering', 'b.e', 'b.e.', 'be',
            'btech', 'b.tech', 'b.sc', 'bsc', 'bcom', 'b.com', 'bca', 'mca', 'mba', 'm.e',
            'm.e.', 'mle', 'm.tech', 'autonomous', 'statement', 'semester', 'regulations',
            'examination', 'examinations', 'pass', 'marksheet', 'credits', 'earned', 'points',
            'oo', 'on', 'waal', 'affiliation', 'affiliated', 'chennai', 'salem', 'india', 'of', 'the'
        }

        def is_valid_name(val):
            if not val:
                return False
            cleaned = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
            if len(cleaned) < 3 or len(cleaned) > 50:
                return False
            words = [w.lower().strip('.') for w in cleaned.split() if w.strip('.')]
            if not words:
                return False
            if all(w in non_name_tokens for w in words):
                return False
            if any(w in {'reg', 'college', 'university', 'identity', 'card', 'course', 'cgpa', 'department', 'semester', 'examination'} for w in words):
                return False
            if len(words) == 1 and len(words[0]) <= 2:
                return False
            return True

        # 4. Extract Name
        # Check explicit label patterns first
        for idx, line in enumerate(lines):
            if re.search(r'\b(candidate|student\s*name|name)\b', line, re.IGNORECASE):
                clean_line = re.sub(r'^(?:name\s*of\s*(?:the)?\s*candidate|candidate\s*name|student\s*name|name|candidate|of\s*the)\s*[:\-]?\s*', '', line, flags=re.IGNORECASE).strip()
                clean_name = re.sub(r'[^a-zA-Z\s\.]', '', clean_line).strip()
                if is_valid_name(clean_name):
                    name_val = clean_name
                    break
                if idx + 1 < len(lines):
                    next_l = lines[idx + 1]
                    clean_next = re.sub(r'^(?:candidate|name|of\s*the)\s*[:\-]?\s*', '', next_l, flags=re.IGNORECASE).strip()
                    clean_next_name = re.sub(r'[^a-zA-Z\s\.]', '', clean_next).strip()
                    if is_valid_name(clean_next_name):
                        name_val = clean_next_name
                        break

        # Fallback for 2-column or separated values layout
        if not name_val:
            for idx, line in enumerate(lines):
                if re.search(r'[A-Z0-9]{5,}', line) and ('/' in line or any(c.isdigit() for c in line)):
                    for offset in [1, 2]:
                        if idx + offset < len(lines):
                            cand = lines[idx + offset]
                            if any(term in cand.lower() for term in ['college', 'university', 'technology', 'institute']):
                                continue
                            cand_clean = re.sub(r'[^a-zA-Z\s\.]', '', cand).strip()
                            if is_valid_name(cand_clean):
                                name_val = cand_clean
                                break
                    if name_val:
                        break

        # Column layout CGPA fallback
        if "cgpa" not in result:
            if any(label in text.lower() for label in ["cgpa", "gpa", "grade point average", "cumulative"]):
                floats = re.findall(r"\b([0-9]\.[0-9]{1,2})\b", text)
                valid_floats = []
                for f in floats:
                    try:
                        v = float(f)
                        if 0.0 <= v <= 10.0:
                            valid_floats.append(v)
                    except ValueError:
                        pass
                if valid_floats:
                    result["cgpa"] = valid_floats[-1]

        if name_val:
            result["name"] = name_val.strip()
        if college_val:
            result["college_name"] = college_val.strip()
        if course_val:
            result["course"] = course_val.strip()
        if reg_val:
            result["register_number"] = reg_val.strip()

        return result

    def _parse_marks(self, text: str, doc_type: str) -> dict:
        result = {}
        # Extract name
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        name_found = None
        for idx, line in enumerate(lines):
            if any(term in line.lower() for term in ["name of candidate", "candidate name", "name of the candidate"]):
                # If there's a colon or we can split, try same-line first
                if ":" in line:
                    val = line.split(":", 1)[1].strip()
                    clean_val = re.sub(r'[^a-zA-Z\s\.]', '', val).strip()
                    if len(clean_val) >= 2 and not any(k in clean_val.lower() for k in ["register", "roll"]):
                        name_found = clean_val
                        break
                # Check the next line (often containing the actual name e.g., VALARMADHI)
                if idx + 1 < len(lines):
                    next_line = lines[idx + 1]
                    # Take only the alphabetic prefix of the line (names don't have digits)
                    name_part = re.match(r"^\s*([a-zA-Z\s\.\u00C0-\u00FF]+)", next_line)
                    if name_part:
                        clean_name = name_part.group(1).strip()
                        if len(clean_name) >= 2 and not any(k in clean_name.lower() for k in ["register", "roll"]):
                            name_found = clean_name
                            break
        if name_found:
            result["name"] = name_found.strip()

        # Fallback to general Name regex if not found
        if "name" not in result:
            name_match = re.search(r"(?:Candidate Name|Name)\s*[:\-]?\s*([a-zA-Z\s\.]+)", text, re.IGNORECASE)
            if name_match:
                clean_name = name_match.group(1).strip()
                if not any(k in clean_name.lower() for k in ["register", "roll", "candidate"]):
                    result["name"] = clean_name

        # Board extraction
        if "tamil nadu" in text.lower():
            result["board"] = "Tamil Nadu State Board"
        elif "cbse" in text.lower() or "central board" in text.lower():
            result["board"] = "CBSE"
        else:
            result["board"] = "State Board"

        # Robust total marks extraction for lines containing "Total"
        obtained = None
        maximum = None
        for line in text.split("\n"):
            if re.search(r"\b(total|grand total)\b", line, re.IGNORECASE):
                # Find all integer/decimal values on the line, excluding the percentage value if possible
                # Remove % and its preceding number first to avoid confusion
                line_no_pct = re.sub(r"\d+(?:\.\d+)?\s*%", "", line)
                nums = re.findall(r"\b\d{3,4}\b", line_no_pct)
                if len(nums) >= 2:
                    try:
                        val1 = float(nums[0])
                        val2 = float(nums[1])
                        obtained = min(val1, val2)
                        maximum = max(val1, val2)
                        break
                    except ValueError:
                        pass
                # Try fallback with any numbers if 3-4 digits fail (e.g. out of 500, total 475)
                all_nums = re.findall(r"\b\d+\b", line_no_pct)
                # Filter out values that are too small (like serial numbers or single digits)
                valid_nums = [float(n) for n in all_nums if float(n) >= 50]
                if len(valid_nums) >= 2:
                    obtained = min(valid_nums)
                    maximum = max(valid_nums)
                    break

        # Fallback to standard regex total extraction: "Total: 1060 / 1200"
        if obtained is None or maximum is None:
            total_match = re.search(r"(?:Total|Grand Total)\D*(\d{3,4})\s*[\/\\|]\s*(\d{3,4})", text, re.IGNORECASE)
            if total_match:
                try:
                    val1 = float(total_match.group(1))
                    val2 = float(total_match.group(2))
                    obtained = min(val1, val2)
                    maximum = max(val1, val2)
                except ValueError:
                    pass

        # If no explicit total found, fallback to parsing subject wise: e.g. "French 181 / 200"
        if obtained is None or maximum is None:
            subject_marks = re.findall(r"\b[A-Za-z]+\s*(\d{2,3})\s*[\/\\|]\s*(\d{2,3})\b", text)
            if subject_marks:
                total_obt = 0.0
                total_max = 0.0
                for obt_str, max_str in subject_marks:
                    try:
                        o_val = float(obt_str)
                        m_val = float(max_str)
                        # Filter obvious registry numbers or years
                        if m_val in (100.0, 200.0) and o_val <= m_val:
                            total_obt += o_val
                            total_max += m_val
                    except ValueError:
                        pass
                if total_max > 0:
                    obtained = total_obt
                    maximum = total_max

        if obtained is not None and maximum is not None and maximum > 0:
            result["obtained_marks"] = obtained
            result["maximum_marks"] = maximum
            result["calculated_percentage"] = round((obtained / maximum) * 100.0, 2)

        # Printed percentage
        pct_match = re.search(r"(\d{2,3}(?:\.\d{1,2})?)\s*%", text)
        if pct_match:
            try:
                result["printed_percentage"] = float(pct_match.group(1))
            except ValueError:
                pass

        if "calculated_percentage" not in result and "printed_percentage" in result:
            result["calculated_percentage"] = result["printed_percentage"]
            
        final_pct = result.get("calculated_percentage") or result.get("printed_percentage")
        if final_pct is not None:
            result["percentage"] = final_pct
            result["marks"] = final_pct

        return result


class OCRAgent:
    """
    Agent 5: OCR Agent
    Purpose: Pluggable OCR extraction with classification.
    """
    def __init__(self, db: Session, engine: BaseOCREngine = None):
        self.db = db
        self.engine = engine or TesseractOCREngine()

    def extract_data(self, user_id: int, document_type: str, file_path: str) -> dict:
        abs_path = file_path
        if not os.path.isabs(abs_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidate1 = os.path.join(base_dir, file_path.lstrip("/"))
            candidate2 = os.path.join(base_dir, "uploads", os.path.basename(file_path))
            candidate3 = os.path.join(base_dir, "backend", "uploads", os.path.basename(file_path))
            if os.path.exists(candidate1):
                abs_path = candidate1
            elif os.path.exists(candidate2):
                abs_path = candidate2
            elif os.path.exists(candidate3):
                abs_path = candidate3
            else:
                abs_path = candidate1

        extracted = self.engine.extract_text(abs_path, document_type)
        doc = crud.get_user_document_by_type(self.db, user_id, document_type)
        
        # Store complete schema for compatibility with DB, defaulting missing fields to None
        complete_data = {}
        if document_type == "college":
            complete_data = {
                "document_type": "college",
                "name": extracted.get("name"),
                "college_name": extracted.get("college_name"),
                "course": extracted.get("course"),
                "register_number": extracted.get("register_number"),
                "cgpa": extracted.get("cgpa")
            }
        elif document_type == "income":
            complete_data = {
                "document_type": "income",
                "name": extracted.get("name"),
                "annual_income": extracted.get("annual_income") or extracted.get("income")
            }
        elif document_type == "community":
            complete_data = {
                "document_type": "community",
                "name": extracted.get("name"),
                "category": extracted.get("category") or extracted.get("community"),
                "state": extracted.get("state")
            }
        elif document_type == "aadhaar":
            complete_data = {
                "document_type": "aadhaar",
                "name": extracted.get("name"),
                "dob": extracted.get("dob"),
                "gender": extracted.get("gender"),
                "state": extracted.get("state"),
                "aadhaar_no": extracted.get("aadhaar_no")
            }
        elif document_type in ("tenth", "twelfth"):
            complete_data = {
                "document_type": document_type,
                "name": extracted.get("name"),
                "obtained_marks": extracted.get("obtained_marks"),
                "maximum_marks": extracted.get("maximum_marks"),
                "calculated_percentage": extracted.get("calculated_percentage") or extracted.get("percentage") or extracted.get("marks"),
                "printed_percentage": extracted.get("printed_percentage") or extracted.get("percentage") or extracted.get("marks"),
                "board": extracted.get("board")
            }
        elif document_type == "disability":
            complete_data = {
                "document_type": "disability",
                "name": extracted.get("name"),
                "dob": extracted.get("dob"),
                "gender": extracted.get("gender"),
                "disability_type": extracted.get("disability_type"),
                "percentage": extracted.get("percentage"),
                "diagnosis": extracted.get("diagnosis"),
                "certificate_no": extracted.get("certificate_no"),
                "date": extracted.get("date"),
                "disability_status": extracted.get("disability_status", "Verified PwD")
            }
        elif document_type in ("sportsQuota", "sports"):
            complete_data = {
                "document_type": "sportsQuota",
                "name": extracted.get("name"),
                "sport_name": extracted.get("sport_name"),
                "competition_level": extracted.get("competition_level"),
                "achievement": extracted.get("achievement"),
                "certificate_no": extracted.get("certificate_no"),
                "sports_status": extracted.get("sports_status", "Eligible Sports Quota")
            }
        elif document_type == "firstGraduate":
            complete_data = {
                "document_type": "firstGraduate",
                "name": extracted.get("name"),
                "certificate_no": extracted.get("certificate_no"),
                "district": extracted.get("district"),
                "first_graduate_status": extracted.get("first_graduate_status", "Verified First Graduate")
            }
        elif document_type == "ncc":
            complete_data = {
                "document_type": "ncc",
                "name": extracted.get("name"),
                "certificate_no": extracted.get("certificate_no"),
                "unit": extracted.get("unit"),
                "cert_type": extracted.get("cert_type"),
                "ncc_status": extracted.get("ncc_status", "Eligible NCC Cadet")
            }
        elif document_type == "nss":
            complete_data = {
                "document_type": "nss",
                "name": extracted.get("name"),
                "certificate_no": extracted.get("certificate_no"),
                "college": extracted.get("college"),
                "nss_status": extracted.get("nss_status", "Eligible NSS Volunteer")
            }
        elif document_type == "minority":
            complete_data = {
                "document_type": "minority",
                "name": extracted.get("name"),
                "certificate_no": extracted.get("certificate_no"),
                "minority_category": extracted.get("minority_category"),
                "minority_status": extracted.get("minority_status", "Verified Minority")
            }

        if extracted.get("classification_warning"):
            complete_data["classification_warning"] = extracted.get("classification_warning")
        if extracted.get("detected_type"):
            complete_data["detected_type"] = extracted.get("detected_type")
        if extracted.get("expected_type"):
            complete_data["expected_type"] = extracted.get("expected_type")

        user = crud.get_user(self.db, user_id)
        profile_name = user.fullName if user else None
        if "name" in complete_data and complete_data["name"]:
            complete_data["name"] = correct_ocr_name(complete_data["name"], profile_name)

        # Check completeness / validation metrics
        is_valid = any(v is not None and v != "" for k, v in complete_data.items() if k not in ("document_type", "board", "classification_warning", "detected_type", "expected_type"))
        fields_found = [k for k, v in complete_data.items() if v is not None and k != "document_type"]
        fields_missing = [k for k, v in complete_data.items() if v is None and k != "document_type"]

        # Build output structure
        output_payload = {
            "extraction_status": "success" if is_valid else "failed",
            "fields_found": fields_found,
            "fields_missing": fields_missing,
            "ocr_status": "OCR_COMPLETED" if is_valid else "OCR_FAILED"
        }
        output_payload.update(complete_data)

        if not is_valid:
            payload = {
                "status": "ocr_failed",
                "error_message": f"Could not parse required fields from {document_type} document.",
                "parsed": complete_data
            }
            if doc:
                doc.status = "OCR Failed"
                doc.extracted_data = json.dumps(payload)
                self.db.add(doc)
            self.db.commit()
            return payload

        # Update OCRData model
        ocr_data = crud.get_ocr_data(self.db, user_id)
        if "name" in complete_data and complete_data["name"]:
            if document_type == "aadhaar" or not ocr_data.name or ocr_data.name != complete_data["name"]:
                ocr_data.name = complete_data["name"]
        if "gender" in complete_data and complete_data["gender"]:
            ocr_data.gender = complete_data["gender"]
        if "state" in complete_data and complete_data["state"]:
            ocr_data.state = complete_data["state"]
        if "annual_income" in complete_data and complete_data["annual_income"]:
            ocr_data.income = complete_data["annual_income"]
        if "category" in complete_data and complete_data["category"]:
            ocr_data.community = complete_data["category"]
        if "cgpa" in complete_data and complete_data["cgpa"]:
            ocr_data.cgpa = complete_data["cgpa"]
        if "calculated_percentage" in complete_data and complete_data["calculated_percentage"]:
            ocr_data.marks = complete_data["calculated_percentage"]
        if "college_name" in complete_data and complete_data["college_name"]:
            ocr_data.college = complete_data["college_name"]

        self.db.add(ocr_data)
        
        if doc:
            doc.status = "OCR Completed"
            doc.extracted_data = json.dumps(output_payload)
            self.db.add(doc)

        self.db.commit()
        return output_payload
