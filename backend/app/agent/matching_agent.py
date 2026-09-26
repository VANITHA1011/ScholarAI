import re
from sqlalchemy.orm import Session
from .. import models, crud

class ScholarshipMatchingAgent:
    """
    Agent 2: Scholarship Matching Agent
    Purpose: Evaluates each scholarship based ONLY on the current authenticated student's profile
    and that scholarship's actual requirements in the database.
    """
    def __init__(self, db: Session):
        self.db = db

    def match_scholarships(self, user_id: int) -> list:
        profile = crud.get_user_profile(self.db, user_id)
        user = self.db.query(models.User).filter(models.User.id == user_id).first()

        scholarships = self.db.query(models.Scholarship).all()
        results = []

        def to_english(text_val):
            if not text_val:
                return ""
            t = str(text_val)
            t = t.replace("â‚¹", "Rs. ").replace("â€“", " - ").replace("â€”", " - ").replace("Â", "")
            t = t.replace("₹", "Rs. ").replace("–", " - ").replace("—", " - ")
            t = re.sub(r'Rs\.\s*Rs\.', 'Rs. ', t)
            t = re.sub(r'\s+', ' ', t).strip()
            return t

        def parse_amount(val):
            if not val:
                return 0
            if isinstance(val, (int, float)):
                return int(val)
            digits = re.sub(r'[^\d]', '', str(val).split('/')[0].split('–')[0].split('-')[0])
            return int(digits) if digits else 0

        # Check core student profile presence
        has_income = profile is not None and profile.annualIncome is not None
        has_gender = profile is not None and bool(str(profile.gender or "").strip())
        has_category = profile is not None and bool(str(profile.category or "").strip())
        has_state = profile is not None and bool(str(profile.state or "").strip())
        has_degree = profile is not None and bool(str(profile.degree or "").strip())
        has_marks = profile is not None and (
            profile.cgpa is not None
            or profile.twelfthPercentage is not None
            or profile.tenthPercentage is not None
        )

        has_any_profile_data = (
            has_income
            or has_gender
            or has_category
            or has_state
            or has_degree
            or has_marks
        )

        for s in scholarships:
            reqs = self.db.query(models.ScholarshipRequirement).filter(
                models.ScholarshipRequirement.scholarship_id == s.s_no
            ).all()

            criteria_results = []
            has_failed = False
            has_unknown = False
            passed_count = 0

            # If user has zero profile data, mark all criteria as unknown
            if not has_any_profile_data:
                has_unknown = True

            for req in reqs:
                rtype = req.requirement_type
                op = req.operator
                rval = req.required_value
                desc = req.description or ""

                status = "passed"
                msg = desc
                sval = "Not Provided"

                # 1. Income Requirement
                if rtype == "income":
                    try:
                        limit = float(rval)
                    except ValueError:
                        limit = 9999999
                    
                    if not has_income:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires family income <= Rs. {limit:,.0f}"
                    elif profile.annualIncome <= limit:
                        status = "passed"
                        sval = f"Rs. {profile.annualIncome:,.0f}"
                        msg = f"✔ Annual Income satisfied: Rs. {profile.annualIncome:,.0f} <= Rs. {limit:,.0f}"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = f"Rs. {profile.annualIncome:,.0f}"
                        msg = f"❌ Income limit exceeded: Required <= Rs. {limit:,.0f}, Yours: Rs. {profile.annualIncome:,.0f}"

                # 2. Gender Requirement
                elif rtype == "gender":
                    if not has_gender:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires {rval} applicant"
                    elif (
                        profile.gender.lower().strip() == rval.lower().strip()
                        or (rval.lower() == "female" and profile.gender.lower() in ("female", "f"))
                        or (rval.lower() == "male" and profile.gender.lower() in ("male", "m"))
                    ):
                        status = "passed"
                        sval = profile.gender
                        msg = f"✔ Gender satisfied: {profile.gender} applicant"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = profile.gender
                        msg = f"❌ Gender requirement failed: Open exclusively to {rval} applicants (Yours: {profile.gender})"

                # 3. State Requirement
                elif rtype == "state":
                    if not has_state:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires {rval} resident"
                    elif (
                        profile.state.lower().strip() == rval.lower().strip()
                        or rval.lower() in profile.state.lower()
                        or profile.state.lower() in rval.lower()
                    ):
                        status = "passed"
                        sval = profile.state
                        msg = f"✔ State residency satisfied: {profile.state}"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = profile.state
                        msg = f"❌ State requirement failed: Requires {rval} resident (Yours: {profile.state})"

                # 4. Category Quota Requirement
                elif rtype == "category":
                    allowed = [c.strip().lower() for c in rval.split(",")]
                    u_cat = str(profile.category or "").strip().lower() if profile else ""
                    if not has_category:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires category in {rval}"
                    elif (
                        u_cat in allowed
                        or any(u_cat in a for a in allowed)
                        or any(a in u_cat for a in allowed)
                        or (u_cat in ("bc", "mbc", "bcm", "dnc") and any(k in allowed for k in ("obc", "bc", "mbc", "dnc", "bcm")))
                    ):
                        status = "passed"
                        sval = profile.category
                        msg = f"✔ Category satisfied: {profile.category} matches {rval} quota"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = profile.category
                        msg = f"❌ Category quota failed: Requires {rval} (Yours: {profile.category})"

                # 5. Minority Requirement
                elif rtype == "minority":
                    u_cat = str(profile.category or "").strip().lower() if profile else ""
                    u_rel = str(getattr(profile, "religion", "") or "").strip().lower() if profile else ""
                    
                    if not profile or (profile.minority is None and not u_cat and not u_rel):
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = "⚠ Information Required: Open to minority community students"
                    else:
                        is_min = (
                            bool(profile.minority)
                            or u_cat in ("bcm", "muslim", "christian", "minority")
                            or u_rel in ("muslim", "christian", "sikh", "jain", "buddhist", "parsi")
                        )
                        sval = str(is_min)
                        if is_min:
                            status = "passed"
                            msg = f"✔ Minority status satisfied: {profile.category or profile.religion or 'Minority'} verified"
                            passed_count += 1
                        else:
                            status = "failed"
                            has_failed = True
                            msg = "❌ Minority quota failed: Open only to notified minority communities"

                # 6. Disability Requirement
                elif rtype == "disability":
                    if not profile or profile.disability is None:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = "⚠ Information Required: Requires disability certificate status"
                    elif profile.disability is True:
                        status = "passed"
                        sval = "Yes"
                        msg = "✔ Disability quota satisfied: PwD certified"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = "No"
                        msg = "❌ Disability quota failed: Requires certified physical disability (>= 40% PwD)"

                # 7. Percentage Requirement
                elif rtype == "percentage":
                    try:
                        threshold = float(rval)
                    except ValueError:
                        threshold = 50.0
                    
                    if not has_marks:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Minimum percentage requirement >= {threshold:.1f}%"
                    else:
                        best_pct = max(
                            float(profile.tenthPercentage or 0) if profile else 0,
                            float(profile.twelfthPercentage or 0) if profile else 0,
                            (float(profile.cgpa or 0) * 10.0) if profile else 0
                        )
                        sval = f"{best_pct:.1f}%"
                        if best_pct >= threshold:
                            status = "passed"
                            msg = f"✔ Percentage satisfied: {best_pct:.1f}% >= {threshold:.1f}%"
                            passed_count += 1
                        else:
                            status = "failed"
                            has_failed = True
                            msg = f"❌ Minimum percentage not met: Requires >= {threshold:.1f}%, Yours: {best_pct:.1f}%"

                # 8. CGPA Requirement
                elif rtype == "cgpa":
                    try:
                        threshold = float(rval)
                    except ValueError:
                        threshold = 6.0
                    
                    if not profile or profile.cgpa is None:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Minimum CGPA cutoff >= {threshold}"
                    else:
                        s_cgpa = float(profile.cgpa)
                        sval = str(s_cgpa)
                        if s_cgpa >= threshold:
                            status = "passed"
                            msg = f"✔ CGPA cutoff satisfied: {s_cgpa} >= {threshold}"
                            passed_count += 1
                        else:
                            status = "failed"
                            has_failed = True
                            msg = f"❌ CGPA cutoff not met: Requires >= {threshold}, Yours: {s_cgpa}"

                # 9. Academic Merit
                elif rtype == "academic_merit":
                    if not has_marks:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Academic merit criteria: {rval}"
                    else:
                        sval = f"CGPA: {profile.cgpa or 'N/A'}, 12th: {profile.twelfthPercentage or 'N/A'}%"
                        status = "passed"
                        msg = f"✔ Academic merit criteria: {rval}"
                        passed_count += 1

                # 10. School level
                elif rtype == "school_level":
                    sval = profile.degree if profile else "College"
                    status = "failed"
                    has_failed = True
                    msg = f"❌ Education level failed: Scheme is strictly for School students ({rval}). Your degree: {profile.degree or 'UG'}"

                # 11. Degree level
                elif rtype == "degree":
                    allowed = [d.strip().lower() for d in rval.split(",")]
                    u_deg = str(profile.degree or "").strip().lower() if profile else ""
                    if not has_degree:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires degree in {rval}"
                    elif (
                        any(a in u_deg or u_deg in a for a in allowed)
                        or any(term in u_deg for term in ["b.e", "b.tech", "ug", "bachelor", "engineering", "degree"])
                    ):
                        status = "passed"
                        sval = profile.degree
                        msg = f"✔ Degree level satisfied: {profile.degree or 'UG'} matches {rval}"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = profile.degree
                        msg = f"❌ Degree mismatch: Scheme requires {rval} (Your degree: {profile.degree})"

                # 12. Course Branch
                elif rtype == "course_branch":
                    allowed = [b.strip().lower() for b in rval.split(",")]
                    u_dept = str(profile.department or "").strip().lower() if profile else ""
                    u_deg = str(profile.degree or "").strip().lower() if profile else ""
                    if not u_dept and not u_deg:
                        status = "unknown"
                        has_unknown = True
                        sval = "Not Provided"
                        msg = f"⚠ Information Required: Scheme requires course specialization in {rval}"
                    elif any(a in u_dept or a in u_deg for a in allowed):
                        status = "passed"
                        sval = profile.department or profile.degree
                        msg = f"✔ Course branch satisfied: {profile.department or profile.degree}"
                        passed_count += 1
                    else:
                        status = "failed"
                        has_failed = True
                        sval = profile.department or profile.degree or "General"
                        msg = f"❌ Course specialization mismatch: Scheme requires {rval} (Your department: {profile.department or profile.degree or 'General'})"

                # 13. Special quotas
                elif rtype in ("govt_school_quota", "single_girl_child", "first_graduate_priority"):
                    sval = "Not Declared"
                    status = "unknown"
                    has_unknown = True
                    msg = f"ℹ Special scheme requirement: {desc}"

                criteria_results.append({
                    "type": rtype,
                    "operator": op,
                    "required_value": rval,
                    "student_value": str(sval),
                    "status": status,
                    "message": to_english(msg)
                })

            total_reqs = len(reqs)

            # Strict Eligibility Decision Logic
            if not has_any_profile_data:
                match_score = 0
                eligible = False
                status_label = "Pending"
            elif has_failed:
                match_score = int((passed_count / total_reqs) * 100) if total_reqs else 0
                eligible = False
                status_label = "Rejected"
            elif has_unknown or total_reqs == 0:
                if total_reqs == 0 and has_any_profile_data:
                    match_score = 100
                    eligible = True
                    status_label = "Eligible"
                else:
                    match_score = int((passed_count / total_reqs) * 100) if total_reqs else 0
                    eligible = False
                    status_label = "Pending"
            else:
                match_score = 100 if passed_count == total_reqs else int((passed_count / total_reqs) * 100)
                eligible = True
                status_label = "Eligible"

            num_amount = parse_amount(s.amount)
            amt_str = to_english(s.amount)
            if amt_str and amt_str[0].isdigit():
                amt_str = f"Rs. {amt_str}"

            clean_reasons = [c["message"] for c in criteria_results] if criteria_results else ["Complete your profile to evaluate eligibility."]

            results.append({
                "id": s.s_no,
                "scholarship_name": to_english(s.scholarship_name),
                "provider": to_english(s.provider) or "Government / Trust",
                "scholarship_type": to_english(s.category) or "Merit-based",
                "degree": to_english(s.degree) or "All",
                "amount": amt_str,
                "numeric_amount": num_amount,
                "deadline": to_english(str(s.deadline)),
                "description": to_english(s.notes) or f"Scholarship scheme provided by {to_english(s.provider) or 'Organization'}",
                "official_url": s.official_url or "https://scholarships.gov.in",
                "match_percentage": match_score,
                "status": status_label,
                "eligible": eligible,
                "total_requirements": total_reqs,
                "criteria": criteria_results,
                "reasons": clean_reasons,
                "recommendation": to_english(s.notes) or "High Priority Match"
            })

        # Sort: eligible first, then match percentage, then amount
        results.sort(key=lambda x: (x["eligible"], x["match_percentage"], x["numeric_amount"]), reverse=True)
        return results
