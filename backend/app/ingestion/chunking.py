import re
from typing import List, Dict, Any

class SemanticChunker:
    """
    Chunks extracted multimodal units into retrieval-ready knowledge units
    without ever losing their underlying source coordinates.
    """

    @classmethod
    def chunk_pdf_pages(cls, pages: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        chunks = []
        for p in pages:
            text = p["text"]
            if not text:
                continue
            
            # Paragraph-based chunking within page
            paragraphs = [para.strip() for para in text.split("\n\n") if len(para.strip()) > 30]
            if not paragraphs:
                paragraphs = [text]
                
            for p_idx, para in enumerate(paragraphs):
                # Detect likely topic/concept keywords
                topic, concept = cls._detect_topic_and_concept(para)
                chunks.append({
                    "content_type": "text",
                    "topic": topic,
                    "concept": concept,
                    "content": para,
                    "source": {
                        "type": "pdf",
                        "file": filename,
                        "page": p["page_number"],
                        "total_pages": p.get("total_pages", 1),
                        "citation_label": f"📄 {filename} — Page {p['page_number']}"
                    }
                })
        return chunks

    @classmethod
    def chunk_pptx_slides(cls, slides: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        chunks = []
        for s in slides:
            text = s["text"]
            if not text and not s.get("diagram_description"):
                continue
                
            content = text
            if s.get("speaker_notes"):
                content += f"\n[Presenter Notes]: {s['speaker_notes']}"
            if s.get("diagram_description"):
                content += f"\n[Visual Description]: {s['diagram_description']}"
                
            topic, concept = cls._detect_topic_and_concept(content, fallback_title=s.get("title"))
            
            chunks.append({
                "content_type": "slide",
                "topic": topic,
                "concept": concept,
                "content": content.strip(),
                "source": {
                    "type": "pptx",
                    "file": filename,
                    "slide": s["slide_number"],
                    "title": s.get("title", f"Slide {s['slide_number']}"),
                    "citation_label": f"📊 {filename} — Slide {s['slide_number']}"
                }
            })
        return chunks

    @classmethod
    def chunk_video_segments(cls, segments: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        chunks = []
        for seg in segments:
            text = seg["text"]
            if not text:
                continue
            topic, concept = cls._detect_topic_and_concept(text)
            chunks.append({
                "content_type": "video_transcript",
                "topic": topic,
                "concept": concept,
                "content": text,
                "source": {
                    "type": "video",
                    "file": filename,
                    "start_seconds": seg["start_seconds"],
                    "end_seconds": seg["end_seconds"],
                    "timestamp_formatted": seg["timestamp_formatted"],
                    "citation_label": f"🎥 {filename} — {seg['timestamp_formatted'].split(' - ')[0]}"
                }
            })
        return chunks

    @classmethod
    def chunk_docx_sections(cls, sections: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        chunks = []
        for sec in sections:
            text = sec["text"]
            if not text:
                continue
            topic, concept = cls._detect_topic_and_concept(text, fallback_title=sec.get("heading"))
            chunks.append({
                "content_type": "text",
                "topic": topic,
                "concept": concept,
                "content": text,
                "source": {
                    "type": "docx",
                    "file": filename,
                    "section": sec.get("section_index", 1),
                    "heading": sec.get("heading", "General"),
                    "citation_label": f"📝 {filename} — Section {sec.get('section_index', 1)}"
                }
            })
        return chunks

    @classmethod
    def _detect_topic_and_concept(cls, text: str, fallback_title: str = None) -> (str, str):
        t_lower = text.lower()
        
        # Taxonomy rule matches for computer science / operating systems
        if "deadlock" in t_lower:
            topic = "Deadlocks"
            if "banker" in t_lower or "safety algorithm" in t_lower:
                concept = "Banker's Algorithm"
            elif "safe state" in t_lower:
                concept = "Safe State"
            elif "prevention" in t_lower or "mutual exclusion" in t_lower or "hold and wait" in t_lower:
                concept = "Deadlock Prevention"
            elif "avoidance" in t_lower:
                concept = "Deadlock Avoidance"
            elif "resource allocation graph" in t_lower or "rag" in t_lower:
                concept = "Resource Allocation Graph"
            else:
                concept = "Deadlock Conditions"
            return topic, concept
            
        elif "process" in t_lower or "thread" in t_lower or "pcb" in t_lower:
            topic = "Processes & Threads"
            if "thread" in t_lower:
                concept = "Multithreading & Concurrency"
            elif "context switch" in t_lower:
                concept = "Context Switching"
            elif "pcb" in t_lower or "process control block" in t_lower:
                concept = "Process Control Block"
            else:
                concept = "Process Lifecycle"
            return topic, concept
            
        elif "schedul" in t_lower or "fcfs" in t_lower or "sjf" in t_lower or "round robin" in t_lower:
            topic = "CPU Scheduling"
            if "round robin" in t_lower:
                concept = "Round Robin Scheduling"
            elif "sjf" in t_lower or "shortest job" in t_lower:
                concept = "Shortest Job First"
            elif "fcfs" in t_lower:
                concept = "First-Come First-Served"
            else:
                concept = "Scheduling Criteria"
            return topic, concept

        elif "memory" in t_lower or "paging" in t_lower or "segmentation" in t_lower or "virtual" in t_lower:
            topic = "Memory Management"
            if "paging" in t_lower or "page table" in t_lower:
                concept = "Paging & Address Translation"
            elif "virtual memory" in t_lower or "page fault" in t_lower:
                concept = "Virtual Memory & Page Faults"
            elif "segmentation" in t_lower:
                concept = "Segmentation"
            else:
                concept = "Memory Allocation"
            return topic, concept

        # Fallback heuristic
        title = fallback_title or "Foundations"
        return "Core Fundamentals", title
