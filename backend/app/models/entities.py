import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ==============================================================================
# 1. USER & AUTHENTICATION
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), default="Learner")
    avatar_url = Column(String(256), default="/avatars/default.png")
    is_active = Column(Boolean, default=True)
    is_demo_user = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    account_status = Column(String(32), default="ACTIVE")  # ACTIVE, PENDING_VERIFICATION, SUSPENDED
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    profile = relationship("LearnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    memberships = relationship("CourseMembership", back_populates="user", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="user", cascade="all, delete-orphan")
    concept_masteries = relationship("ConceptMastery", back_populates="user", cascade="all, delete-orphan")
    attempts = relationship("QuestionAttempt", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    flashcard_reviews = relationship("FlashcardReview", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="verification_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")


# ==============================================================================
# 2. COURSE & MEMBERSHIP
# ==============================================================================

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True)  # e.g., "OS_101"
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(64), default="Computer Science")
    is_demo_course = Column(Boolean, default=False)
    status = Column(String(32), default="READY")  # READY, INGESTING, FAILED
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    memberships = relationship("CourseMembership", back_populates="course", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="course", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    knowledge_units = relationship("KnowledgeUnit", back_populates="course", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="course", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="course", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="course", cascade="all, delete-orphan")


class CourseMembership(Base):
    __tablename__ = "course_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), default="student")  # student, instructor, demo
    enrolled_at = Column(DateTime, default=get_utc_now, nullable=False)
    last_accessed_at = Column(DateTime, default=get_utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_membership"),
    )

    user = relationship("User", back_populates="memberships")
    course = relationship("Course", back_populates="memberships")


# ==============================================================================
# 3. MULTIMODAL INGESTION DOCUMENTS, SLIDES & VIDEOS
# ==============================================================================

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(256), nullable=False)
    original_name = Column(String(256), nullable=False)
    file_type = Column(String(32), nullable=False)  # pdf, docx, txt, pptx, image, video_mp4
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(512), nullable=False)
    status = Column(String(32), default="QUEUED")  # QUEUED, PROCESSING, INDEXING, READY, FAILED
    error_message = Column(Text, nullable=True)
    progress_percent = Column(Float, default=0.0)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    slides = relationship("Slide", back_populates="document", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="document", cascade="all, delete-orphan")
    knowledge_units = relationship("KnowledgeUnit", back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False, index=True)
    text_content = Column(Text, nullable=False)
    figure_count = Column(Integer, default=0)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    document = relationship("Document", back_populates="pages")


class Slide(Base):
    __tablename__ = "slides"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    slide_number = Column(Integer, nullable=False, index=True)
    title = Column(String(256), nullable=True)
    text_content = Column(Text, nullable=False)
    speaker_notes = Column(Text, nullable=True)
    diagram_description = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    document = relationship("Document", back_populates="slides")


class Video(Base):
    __tablename__ = "videos"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    duration_seconds = Column(Integer, default=0)
    format = Column(String(32), default="mp4")
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    document = relationship("Document", back_populates="videos")
    segments = relationship("VideoSegment", back_populates="video", cascade="all, delete-orphan")


class VideoSegment(Base):
    __tablename__ = "video_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    video_id = Column(String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_index = Column(Integer, nullable=False)
    start_seconds = Column(Integer, nullable=False, index=True)
    end_seconds = Column(Integer, nullable=False, index=True)
    timestamp_formatted = Column(String(32), nullable=False)  # e.g., "21:43 - 22:27"
    transcript_text = Column(Text, nullable=False)
    topic_hint = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    video = relationship("Video", back_populates="segments")


# ==============================================================================
# 4. KNOWLEDGE BASE & KNOWLEDGE GRAPH
# ==============================================================================

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False, index=True)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    importance_weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    course = relationship("Course", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="topic", cascade="all, delete-orphan")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    difficulty_baseline = Column(Float, default=0.5)  # 0.0 - 1.0
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    topic = relationship("Topic", back_populates="concepts")
    knowledge_units = relationship("KnowledgeUnit", back_populates="concept", cascade="all, delete-orphan")
    concept_masteries = relationship("ConceptMastery", back_populates="concept", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="concept", cascade="all, delete-orphan")
    prerequisites = relationship("Prerequisite", foreign_keys="Prerequisite.concept_id", back_populates="concept", cascade="all, delete-orphan")
    required_for = relationship("Prerequisite", foreign_keys="Prerequisite.prerequisite_concept_id", back_populates="prerequisite_concept", cascade="all, delete-orphan")


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    strength = Column(Float, default=1.0)  # 0.0 to 1.0 (strictness)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    concept = relationship("Concept", foreign_keys=[concept_id], back_populates="prerequisites")
    prerequisite_concept = relationship("Concept", foreign_keys=[prerequisite_concept_id], back_populates="required_for")


class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    source_concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    target_concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String(32), nullable=False)  # PREREQUISITE_OF, RELATED_TO, PART_OF, EXPLAINED_IN
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)


class KnowledgeUnit(Base):
    """Normalized source-addressable atomic knowledge chunk."""
    __tablename__ = "knowledge_units"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True, index=True)
    
    content_type = Column(String(32), default="text")  # text, code, formula, figure, slide, video_transcript
    topic_name = Column(String(128), nullable=False, index=True)
    concept_name = Column(String(128), nullable=False, index=True)
    content = Column(Text, nullable=False)
    
    # Exact source coordinates
    source_type = Column(String(32), nullable=False)  # pdf, docx, pptx, video, image
    source_file = Column(String(256), nullable=False)
    source_location = Column(JSON, nullable=False)  # {"page": 42} or {"slide": 18} or {"start_seconds": 1303, "end_seconds": 1347}
    
    # Vector Embedding reference
    embedding_vector = Column(JSON, nullable=True)  # Normalized list of floats
    prerequisites_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    course = relationship("Course", back_populates="knowledge_units")
    document = relationship("Document", back_populates="knowledge_units")
    concept = relationship("Concept", back_populates="knowledge_units")
    citations = relationship("Citation", back_populates="knowledge_unit", cascade="all, delete-orphan")


# ==============================================================================
# 5. LEARNER MODEL & MASTERY
# ==============================================================================

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    overall_mastery = Column(Float, default=0.25)
    learning_goal = Column(String(128), default="Master Core Concepts")
    target_exam_date = Column(DateTime, nullable=True)
    daily_study_goal_minutes = Column(Integer, default=45)
    preferred_language = Column(String(32), default="en")
    preferred_mode = Column(String(32), default="beginner")  # beginner, exam, deep_dive, interview, socratic, bilingual
    
    total_study_minutes = Column(Integer, default=0)
    current_streak_days = Column(Integer, default=1)
    xp_points = Column(Integer, default=150)
    level = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    
    mastery_score = Column(Float, default=0.0)  # 0.00 - 1.00
    status = Column(String(32), default="Novice")  # Novice, Weak, Developing, Proficient, Mastered
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    recent_accuracy = Column(Float, default=0.0)
    last_studied_at = Column(DateTime, default=get_utc_now, nullable=False)
    
    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_user_topic_mastery"),
    )

    user = relationship("User", back_populates="topic_masteries")
    topic = relationship("Topic", back_populates="topic_masteries")


class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    mastery_score = Column(Float, default=0.0)  # 0.00 - 1.00
    status = Column(String(32), default="Novice")  # Novice, Weak, Developing, Proficient, Mastered
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.5)
    last_practiced_at = Column(DateTime, default=get_utc_now, nullable=False)
    
    __table_args__ = (
        UniqueConstraint("user_id", "concept_id", name="uq_user_concept_mastery"),
    )

    user = relationship("User", back_populates="concept_masteries")
    concept = relationship("Concept", back_populates="concept_masteries")


# ==============================================================================
# 6. ASSESSMENTS, QUESTIONS & MISCONCEPTIONS
# ==============================================================================

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_type = Column(String(32), default="mcq")  # mcq, multi_select, short_answer, coding
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # list of strings for MCQ
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(Float, default=0.5)  # 0.0 - 1.0
    
    # Grounding & Verification
    source_evidence = Column(Text, nullable=False)
    source_reference = Column(JSON, nullable=False)  # {"document": "...", "page": 42}
    is_verified = Column(Boolean, default=True)
    rejection_reason = Column(String(256), nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    course = relationship("Course", back_populates="questions")
    concept = relationship("Concept", back_populates="questions")
    attempts = relationship("QuestionAttempt", back_populates="question", cascade="all, delete-orphan")


class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer, default=30)
    confidence_level = Column(Float, default=0.8)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")
    misconception_record = relationship("Misconception", back_populates="attempt", uselist=False, cascade="all, delete-orphan")


class Misconception(Base):
    __tablename__ = "misconceptions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    attempt_id = Column(String(36), ForeignKey("question_attempts.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    concept_name = Column(String(128), nullable=False)
    detected_misconception = Column(Text, nullable=False)
    prerequisite_gap = Column(String(128), nullable=True)
    remediation_lesson = Column(Text, nullable=False)
    remediation_example = Column(Text, nullable=False)
    followup_question_json = Column(JSON, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    attempt = relationship("QuestionAttempt", back_populates="misconception_record")


# ==============================================================================
# 7. FLASHCARDS & SPACED REPETITION (SM-2)
# ==============================================================================

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    topic_name = Column(String(128), nullable=False, index=True)
    concept_name = Column(String(128), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    source_reference = Column(JSON, nullable=True)
    
    # SM-2 Algorithm Attributes
    interval_days = Column(Integer, default=1)
    repetition = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="flashcards")
    reviews = relationship("FlashcardReview", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    flashcard_id = Column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rating = Column(Integer, nullable=False)  # 0 to 5 (SM-2 score)
    time_taken_ms = Column(Integer, default=5000)
    reviewed_at = Column(DateTime, default=get_utc_now, nullable=False)

    flashcard = relationship("Flashcard", back_populates="reviews")
    user = relationship("User", back_populates="flashcard_reviews")


# ==============================================================================
# 8. STUDY PLANNER & SESSIONS
# ==============================================================================

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    target_date = Column(DateTime, nullable=False)
    total_planned_hours = Column(Float, default=20.0)
    completed_hours = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    user = relationship("User", back_populates="study_plans")
    course = relationship("Course", back_populates="study_plans")
    items = relationship("StudyPlanItem", back_populates="study_plan", cascade="all, delete-orphan")


class StudyPlanItem(Base):
    __tablename__ = "study_plan_items"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    study_plan_id = Column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    
    day_number = Column(Integer, nullable=False)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    topic_name = Column(String(128), nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    action_type = Column(String(32), default="study")  # study, practice, revision, exam_blitz
    estimated_minutes = Column(Integer, default=30)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    study_plan = relationship("StudyPlan", back_populates="items")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    session_type = Column(String(32), default="tutor")  # tutor, quiz, flashcard, coding, revision
    duration_minutes = Column(Integer, default=15)
    xp_earned = Column(Integer, default=25)
    started_at = Column(DateTime, default=get_utc_now, nullable=False)
    ended_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="study_sessions")


# ==============================================================================
# 9. CONVERSATIONS & SOURCE CITATIONS
# ==============================================================================

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(256), default="Grounded Study Session")
    mode = Column(String(32), default="beginner")
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    user = relationship("User", back_populates="conversations")
    course = relationship("Course", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sender = Column(String(32), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    is_grounded = Column(Boolean, default=False)
    grounding_confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    citations = relationship("Citation", back_populates="message", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    message_id = Column(String(36), ForeignKey("conversation_messages.id", ondelete="CASCADE"), nullable=True, index=True)
    knowledge_unit_id = Column(String(36), ForeignKey("knowledge_units.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source_type = Column(String(32), nullable=False)  # pdf, docx, pptx, video, image
    document_title = Column(String(256), nullable=False)
    location_label = Column(String(128), nullable=False)  # "Page 42" or "Slide 18" or "21:43"
    location_data = Column(JSON, nullable=False)
    excerpt = Column(Text, nullable=False)
    relevance_score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    message = relationship("ConversationMessage", back_populates="citations")
    knowledge_unit = relationship("KnowledgeUnit", back_populates="citations")


# ==============================================================================
# 10. RECOMMENDATIONS, ACHIEVEMENTS & AUDIT LOGS
# ==============================================================================

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    topic_name = Column(String(128), nullable=False)
    action_type = Column(String(32), nullable=False)  # review_prerequisite, read_source, watch_lecture, practice_quiz
    recommendation_reason = Column(Text, nullable=False)
    priority_score = Column(Float, default=1.0)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="recommendations")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    badge_key = Column(String(64), nullable=False)  # first_diagnostic, streak_7, mastery_expert
    title = Column(String(128), nullable=False)
    description = Column(String(256), nullable=False)
    icon = Column(String(64), default="Trophy")
    unlocked_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="achievements")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String(64), nullable=False, index=True)  # upload_file, code_exec, query_grounded, mastery_updated
    details = Column(JSON, default=dict)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="audit_logs")
