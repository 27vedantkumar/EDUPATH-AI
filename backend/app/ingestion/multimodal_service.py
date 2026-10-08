import os
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import (
    Course, Document, DocumentPage, Slide, Video, VideoSegment,
    KnowledgeUnit, Topic, Concept, Prerequisite, KnowledgeRelation
)
from backend.app.ingestion.parsers import (
    PDFParser, DOCXParser, PPTXParser, VideoParser, ImageParser
)
from backend.app.ingestion.chunking import SemanticChunker
from backend.app.ingestion.taxonomy_extractor import TaxonomyExtractor

logger = logging.getLogger("edupath.ingestion.service")

class MultimodalIngestionService:
    """
    End-to-end multimodal ingestion pipeline. Ingests PDFs, DOCX, PPTX, MP4, and images,
    builds source-addressable knowledge units, extracts course taxonomy, and populates
    knowledge relations.
    """

    @classmethod
    async def process_document(
        cls,
        db: AsyncSession,
        course_id: str,
        filename: str,
        file_bytes: bytes,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the 5-stage ingestion pipeline:
        UPLOAD -> EXTRACTION -> SEMANTIC CHUNKING -> TAXONOMY & PREREQUISITES -> INDEXING
        """
        fn_lower = filename.lower()
        file_type = cls._infer_file_type(fn_lower)
        
        # 1. Fetch or create Document record
        doc = None
        if document_id:
            res = await db.execute(select(Document).filter(Document.id == document_id))
            doc = res.scalars().first()
            
        if not doc:
            doc = Document(
                course_id=course_id,
                filename=filename,
                original_name=filename,
                file_type=file_type,
                file_size_bytes=len(file_bytes),
                file_path=os.path.join("./uploads", filename),
                status="PROCESSING",
                progress_percent=15.0
            )
            db.add(doc)
            await db.flush()
        else:
            doc.status = "PROCESSING"
            doc.progress_percent = 20.0
            await db.flush()

        pages_count = 0
        slides_count = 0
        video_segments_count = 0
        extracted_chunks: List[Dict[str, Any]] = []

        try:
            # 2. Extract content by media type
            logger.info(f"Extracting {file_type} content from {filename}...")
            
            if file_type == "pdf":
                pages = PDFParser.parse(file_bytes, filename)
                pages_count = len(pages)
                for p in pages:
                    dp = DocumentPage(
                        document_id=doc.id,
                        page_number=p["page_number"],
                        text_content=p["text"],
                        figure_count=1 if p["has_figures"] else 0,
                        metadata_json=p["source"]
                    )
                    db.add(dp)
                extracted_chunks = SemanticChunker.chunk_pdf_pages(pages, filename)
                
            elif file_type == "pptx":
                slides = PPTXParser.parse(file_bytes, filename)
                slides_count = len(slides)
                for s in slides:
                    sl = Slide(
                        document_id=doc.id,
                        slide_number=s["slide_number"],
                        title=s["title"],
                        text_content=s["text"],
                        speaker_notes=s["speaker_notes"],
                        diagram_description=s["diagram_description"],
                        metadata_json=s["source"]
                    )
                    db.add(sl)
                extracted_chunks = SemanticChunker.chunk_pptx_slides(slides, filename)
                
            elif file_type == "video_mp4" or fn_lower.endswith(".mp4") or "transcript" in fn_lower:
                text_content = file_bytes.decode("utf-8", errors="replace")
                segments = VideoParser.parse_transcript_text(text_content, filename)
                video_segments_count = len(segments)
                
                vid = Video(
                    document_id=doc.id,
                    title=f"Lecture Recording: {filename}",
                    duration_seconds=segments[-1]["end_seconds"] if segments else 0,
                    format="mp4"
                )
                db.add(vid)
                await db.flush()
                
                for seg in segments:
                    vs = VideoSegment(
                        video_id=vid.id,
                        segment_index=seg["segment_index"],
                        start_seconds=seg["start_seconds"],
                        end_seconds=seg["end_seconds"],
                        timestamp_formatted=seg["timestamp_formatted"],
                        transcript_text=seg["text"]
                    )
                    db.add(vs)
                extracted_chunks = SemanticChunker.chunk_video_segments(segments, filename)
                
            elif file_type == "docx" or file_type == "txt":
                sections = DOCXParser.parse_docx(file_bytes, filename) if file_type == "docx" else DOCXParser.parse_txt(file_bytes, filename)
                pages_count = len(sections)
                extracted_chunks = SemanticChunker.chunk_docx_sections(sections, filename)
                
            elif file_type == "image":
                img_data = ImageParser.parse(file_bytes, filename)
                extracted_chunks = [{
                    "content_type": "figure",
                    "topic": "System Architecture & Visual Artifacts",
                    "concept": img_data["diagram_type"],
                    "content": img_data["description"],
                    "source": img_data["source"]
                }]

            doc.progress_percent = 60.0
            await db.flush()

            # 3. Derive Taxonomy (Topics, Concepts, Prerequisites)
            logger.info(f"Deriving taxonomy and graph relations for {filename}...")
            taxonomy = TaxonomyExtractor.extract_taxonomy(extracted_chunks)
            
            # Map of concept name to DB Concept entity
            concept_db_map: Dict[str, Concept] = {}
            
            for t_info in taxonomy["topics"]:
                # Check if topic already exists for course
                t_res = await db.execute(
                    select(Topic).filter(Topic.course_id == course_id, Topic.name == t_info["name"])
                )
                topic_entity = t_res.scalars().first()
                if not topic_entity:
                    topic_entity = Topic(
                        course_id=course_id,
                        name=t_info["name"],
                        description=f"Course module covering core principles of {t_info['name']}.",
                        order_index=t_info["order_index"]
                    )
                    db.add(topic_entity)
                    await db.flush()
                    
                # Ensure concepts exist
                for c_info in taxonomy["concepts"]:
                    if c_info["topic_name"] == t_info["name"]:
                        c_res = await db.execute(
                            select(Concept).filter(Concept.topic_id == topic_entity.id, Concept.name == c_info["name"])
                        )
                        concept_entity = c_res.scalars().first()
                        if not concept_entity:
                            concept_entity = Concept(
                                topic_id=topic_entity.id,
                                name=c_info["name"],
                                summary=c_info["summary"],
                                difficulty_baseline=c_info["difficulty_baseline"]
                            )
                            db.add(concept_entity)
                            await db.flush()
                        concept_db_map[c_info["name"]] = concept_entity

            # 4. Create Prerequisite & Knowledge Relations
            for prereq in taxonomy["prerequisites"]:
                c_name = prereq["concept"]
                p_name = prereq["prerequisite"]
                if c_name in concept_db_map and p_name in concept_db_map:
                    cid = concept_db_map[c_name].id
                    pid = concept_db_map[p_name].id
                    # Check existing
                    pr_check = await db.execute(
                        select(Prerequisite).filter(Prerequisite.concept_id == cid, Prerequisite.prerequisite_concept_id == pid)
                    )
                    if not pr_check.scalars().first():
                        db.add(Prerequisite(concept_id=cid, prerequisite_concept_id=pid, strength=1.0))
                    
                    kr_check = await db.execute(
                        select(KnowledgeRelation).filter(
                            KnowledgeRelation.source_concept_id == pid,
                            KnowledgeRelation.target_concept_id == cid,
                            KnowledgeRelation.relation_type == "PREREQUISITE_OF"
                        )
                    )
                    if not kr_check.scalars().first():
                        db.add(KnowledgeRelation(source_concept_id=pid, target_concept_id=cid, relation_type="PREREQUISITE_OF"))

            doc.progress_percent = 80.0
            await db.flush()

            # 5. Persist Source-Addressable Knowledge Units
            logger.info(f"Persisting {len(extracted_chunks)} atomic knowledge units...")
            for ch in extracted_chunks:
                concept_id = None
                if ch.get("concept") in concept_db_map:
                    concept_id = concept_db_map[ch["concept"]].id
                    
                ku = KnowledgeUnit(
                    course_id=course_id,
                    document_id=doc.id,
                    concept_id=concept_id,
                    content_type=ch["content_type"],
                    topic_name=ch["topic"],
                    concept_name=ch["concept"],
                    content=ch["content"],
                    source_type=ch["source"]["type"],
                    source_file=filename,
                    source_location=ch["source"],
                    prerequisites_json=TaxonomyExtractor.DOMAIN_PREREQUISITES.get(ch["concept"], [])
                )
                db.add(ku)

            doc.status = "READY"
            doc.progress_percent = 100.0
            await db.commit()

            return {
                "document_id": doc.id,
                "status": "ready",
                "filename": filename,
                "pages": pages_count,
                "slides": slides_count,
                "video_segments": video_segments_count,
                "topics": len(taxonomy["topics"]),
                "concepts": len(taxonomy["concepts"]),
                "knowledge_units": len(extracted_chunks)
            }

        except Exception as e:
            logger.error(f"Failed processing document {filename}: {e}", exc_info=True)
            doc.status = "FAILED"
            doc.error_message = str(e)
            doc.progress_percent = 0.0
            await db.commit()
            raise

    @staticmethod
    def _infer_file_type(filename_lower: str) -> str:
        if filename_lower.endswith(".pdf"):
            return "pdf"
        elif filename_lower.endswith(".pptx") or filename_lower.endswith(".ppt"):
            return "pptx"
        elif filename_lower.endswith(".docx"):
            return "docx"
        elif filename_lower.endswith(".txt") or filename_lower.endswith(".md"):
            return "txt"
        elif any(filename_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".svg"]):
            return "image"
        elif filename_lower.endswith(".mp4") or "video" in filename_lower or "transcript" in filename_lower:
            return "video_mp4"
        return "txt"
