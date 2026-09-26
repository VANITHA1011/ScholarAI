from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, Text, DateTime, Date, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, synonym
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fullName = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=True)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dob = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    mobileNumber = Column(String(50), nullable=True)
    state = Column(String(100), nullable=True)
    college = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    degree = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    year = Column(String(10), nullable=True)
    semester = Column(String(10), nullable=True)
    tenthPercentage = Column(Float, nullable=True)
    twelfthPercentage = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    arrears = Column(String(10), nullable=True)
    annualIncome = Column(Float, nullable=True)
    parentOccupation = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    disability = Column(Boolean, default=False)
    sportsQuota = Column(Boolean, default=False)
    ncc = Column(Boolean, default=False)
    nss = Column(Boolean, default=False)
    firstGraduate = Column(Boolean, default=False)
    minority = Column(Boolean, default=False)
    age = Column(Integer, nullable=True)
    religion = Column(String(100), nullable=True)
    quota = Column(String(100), nullable=True, default="General")
    completionScore = Column(Integer, default=45)


class OCRData(Base):
    __tablename__ = "ocr_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    dob = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    income = Column(Float, nullable=True)
    community = Column(String(100), nullable=True)
    cgpa = Column(Float, nullable=True)
    marks = Column(Float, nullable=True)
    year = Column(String(50), nullable=True)
    college = Column(String(255), nullable=True)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False) # e.g. tenth, twelfth, college, income, community, aadhaar
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    status = Column(String(50), default="Uploaded") # Uploaded, Verifying, Verified, Mismatch, Blurry
    extracted_data = Column(Text, nullable=True) # JSON format string for OCR output

class Scholarship(Base):
    __tablename__ = "scholarships"

    s_no = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scholarship_name = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=True)
    degree = Column(String(100), nullable=True)
    min_cgpa = Column(String(100), nullable=True)
    max_family_income = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    gender = Column(String(30), nullable=True)
    amount = Column(String(100), nullable=False)
    deadline = Column(String(50), nullable=False)
    official_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=True) # ACTIVE, EXPIRING_SOON, EXPIRED

    requirements = relationship("ScholarshipRequirement", back_populates="scholarship", cascade="all, delete-orphan")
    id = synonym("s_no")

    @property
    def description(self):
        return self.notes or self.scholarship_name

    @property
    def eligibility_text(self):
        return self.notes or ""

    @property
    def scholarship_type(self):
        return self.category or "General"


class ScholarshipRequirement(Base):
    __tablename__ = "scholarship_requirements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.s_no", ondelete="CASCADE"), nullable=False)
    requirement_type = Column(String(64), nullable=False)  # percentage, cgpa, income, category, state, gender, degree, minority, disability, course_branch, school_level, special_quota
    operator = Column(String(16), default="=")            # >=, <=, =, IN, NOT_IN, CONTAINS, MERIT
    required_value = Column(Text, nullable=False)          # e.g. "60", "250000", "Tamil Nadu", "Female", "SC,ST", "true"
    description = Column(Text, nullable=True)             # Rule explanation
    source_url = Column(String(500), nullable=True)
    evidence = Column(String(255), nullable=True)
    is_mandatory = Column(Boolean, default=True)

    scholarship = relationship("Scholarship", back_populates="requirements")


class SavedScholarship(Base):
    __tablename__ = "saved_scholarships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.s_no", ondelete="CASCADE"), nullable=False)
    scholarship = relationship("Scholarship")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.s_no", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="Recommended") # Recommended, Interested, Documents Ready, Applied, Waiting, Approved, SUBMITTED
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    snapshot_data = Column(Text, nullable=True)
    history_json = Column(Text, nullable=True)

    # Add relationship to scholarship and user
    scholarship = relationship("Scholarship")
    user = relationship("User")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(String(50), nullable=False) # user or assistant
    created_at = Column(DateTime, default=func.now())

class AgentWorkflowState(Base):
    __tablename__ = "agent_workflow_states"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.s_no", ondelete="CASCADE"), nullable=True)
    current_stage = Column(String(100), default="NOT_STARTED") # NOT_STARTED, PROFILE_INCOMPLETE, MATCHING, DOCUMENTS_REQUIRED, OCR_PROCESSING, VERIFICATION, APPLICATION_READY, COMPLETED
    current_task = Column(String(255), nullable=True)
    profile_status = Column(String(50), default="Pending") # Pending, Complete
    matching_status = Column(String(50), default="Pending") # Pending, Completed
    required_documents = Column(Text, nullable=True) # comma-separated list
    uploaded_documents = Column(Text, nullable=True) # comma-separated list
    verification_status = Column(String(50), default="Pending") # Pending, Verified, Mismatch
    application_status = Column(String(50), default="Pending") # Pending, Ready
    pending_actions = Column(Text, nullable=True) # JSON list or details
    last_agent = Column(String(100), nullable=True)
    next_agent = Column(String(100), nullable=True)
    decision_reason = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AgentDecisionLog(Base):
    __tablename__ = "agent_decision_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    action = Column(String(255), nullable=False)
    input_context_summary = Column(Text, nullable=True)
    decision = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    next_action = Column(String(255), nullable=True)
    status = Column(String(50), default="Success") # Success, Failure
    created_at = Column(DateTime, default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.s_no", ondelete="CASCADE"), nullable=True)
    title = Column(String(150), nullable=True)
    notification_type = Column(String(50), nullable=True) # DEADLINE_7_DAYS, DEADLINE_3_DAYS, DEADLINE_1_DAY, EXPIRED
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=func.now())
    status = Column(String(50), default="SENT") # SENT, FAILED
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    scholarship = relationship("Scholarship")
