from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class UserCreate(BaseModel):
    fullName: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    fullName: str
    email: EmailStr
    role: Optional[str] = "student"

    class Config:
        from_attributes = True

class AdminStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordResetRequest(BaseModel):
    email: EmailStr

class UserProfileBase(BaseModel):
    fullName: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    mobileNumber: Optional[str] = None
    state: Optional[str] = None
    college: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[str] = None
    tenthPercentage: Optional[float] = None
    twelfthPercentage: Optional[float] = None
    cgpa: Optional[float] = None
    arrears: Optional[str] = None
    annualIncome: Optional[float] = None
    parentOccupation: Optional[str] = None
    category: Optional[str] = None
    disability: Optional[bool] = False
    sportsQuota: Optional[bool] = False
    ncc: Optional[bool] = False
    nss: Optional[bool] = False
    firstGraduate: Optional[bool] = False
    minority: Optional[bool] = False
    age: Optional[int] = None
    religion: Optional[str] = None
    quota: Optional[str] = "General"



class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    completionScore: int

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    document_type: str
    filename: str
    file_path: str
    status: str
    extracted_data: Optional[str] = None

    class Config:
        from_attributes = True

class ScholarshipResponse(BaseModel):
    id: int
    scholarship_name: str
    provider: Optional[str] = None
    scholarship_type: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    min_cgpa: Optional[float] = None
    min_10th_percentage: Optional[float] = None
    min_12th_percentage: Optional[float] = None
    max_family_income: Optional[int] = None
    category: Optional[str] = None
    state: Optional[str] = None
    gender: Optional[str] = None
    amount: int
    deadline: date
    official_url: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    first_graduate: bool = False
    disability_required: bool = False
    sports_quota: bool = False
    ncc_required: bool = False
    nss_required: bool = False
    minority_required: bool = False
    arrears_allowed: bool = True
    required_documents: Optional[str] = None
    eligibility_text: Optional[str] = None
    class Config:
        from_attributes = True

class ScholarshipMatchResponse(BaseModel):
    scholarship: ScholarshipResponse
    match_percentage: int
    eligible: bool
    reasons: List[str]

class SavedScholarshipResponse(BaseModel):
    id: int
    user_id: int
    scholarship_id: int
    scholarship: Optional[ScholarshipResponse] = None

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    scholarship_id: int
    status: str
    submitted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    snapshot_data: Optional[str] = None
    scholarship: Optional[ScholarshipResponse] = None

    class Config:
        from_attributes = True

class ApplicationUpdate(BaseModel):
    status: str

class ChatMessageCreate(BaseModel):
    message: str
    language: Optional[str] = "en"

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    message: str
    sender: str
    created_at: datetime

    class Config:
        from_attributes = True

class MissingDoc(BaseModel):
    document_type: str
    name: str
    uploaded: bool
    status: str

class VerificationStatus(BaseModel):
    profile: str
    documents: str
    ocr: str
    ai_matching: str

class DashboardStats(BaseModel):
    profile_completion: int
    total_scholarships: int
    eligible_count: int
    partially_eligible_count: int
    rejected_count: int
    pending_count: int = 0
    missing_documents: List[MissingDoc] = []
    verification_status: VerificationStatus
    mismatches: List[Dict[str, Any]] = []


class SupervisorResponse(BaseModel):
    action: str
    message: str
    missing_fields: List[str] = []
    missing_documents: List[str] = []
    required_documents: List[str] = []
    mismatches: List[Dict[str, Any]] = []
    scholarships: List[Dict[str, Any]] = []
    ai_explanation: Optional[str] = None
    ocr_data: Optional[Dict[str, Any]] = None

class CertificateGeneratePayload(BaseModel):
    document_type: str
    fields: Dict[str, Any]

class AgentWorkflowStateResponse(BaseModel):
    id: int
    user_id: int
    scholarship_id: Optional[int] = None
    current_stage: str
    current_task: Optional[str] = None
    profile_status: str
    matching_status: str
    required_documents: Optional[str] = None
    uploaded_documents: Optional[str] = None
    verification_status: str
    application_status: str
    pending_actions: Optional[str] = None
    last_agent: Optional[str] = None
    next_agent: Optional[str] = None
    decision_reason: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentDecisionLogResponse(BaseModel):
    id: int
    user_id: int
    agent_name: str
    action: str
    input_context_summary: Optional[str] = None
    decision: Optional[str] = None
    result: Optional[str] = None
    next_action: Optional[str] = None
    status: str
    created_at: datetime


class TranslationRequest(BaseModel):
    texts: List[str]
    target_lang: str = "en"
    source_lang: str = "en"

class TranslationResponse(BaseModel):
    translations: Dict[str, str]
    target_lang: str

class DocumentCollectionStartRequest(BaseModel):
    document_type: str
    open_browser: Optional[bool] = True

class HumanVerificationConfirmRequest(BaseModel):
    document_type: str

class DocumentCollectionStatusResponse(BaseModel):
    user_id: int
    document_type: str
    state: str
    official_url: str
    status_message: str
    portal_info: Optional[Dict[str, Any]] = None
    search_term: Optional[str] = None
    block_reason: Optional[str] = None
    verification_reason: Optional[str] = None
    document_page_url: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    started_at: Optional[str] = None
    updated_at: Optional[str] = None

