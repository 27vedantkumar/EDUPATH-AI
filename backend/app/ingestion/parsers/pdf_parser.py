import io
import logging
from typing import List, Dict, Any
from pypdf import PdfReader

logger = logging.getLogger("edupath.ingestion.pdf")

class PDFParser:
    """Extracts text and page-level metadata from PDF files."""

    @staticmethod
    def parse(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        results = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            total_pages = len(reader.pages)
            
            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                text = page.extract_text() or ""
                clean_text = text.strip()
                
                # Check for figure/diagram references in page text
                has_figures = any(term in clean_text.lower() for term in ["figure", "fig.", "diagram", "chart", "graph", "table"])
                
                results.append({
                    "page_number": page_num,
                    "total_pages": total_pages,
                    "text": clean_text,
                    "has_figures": has_figures,
                    "source": {
                        "type": "pdf",
                        "file": filename,
                        "page": page_num,
                    }
                })
            return results
        except Exception as e:
            # Check for textual fallback if file contains plain text content
            try:
                text_content = file_bytes.decode("utf-8", errors="ignore").strip()
                if text_content and len(text_content) > 10:
                    logger.warning(f"File {filename} is not binary PDF; falling back to formatted text pages.")
                    raw_pages = [p.strip() for p in text_content.split("\f") if p.strip()]
                    if len(raw_pages) <= 1:
                        paragraphs = text_content.split("\n\n")
                        current_chunk = []
                        current_len = 0
                        raw_pages = []
                        for para in paragraphs:
                            current_chunk.append(para)
                            current_len += len(para)
                            if current_len >= 800:
                                raw_pages.append("\n\n".join(current_chunk))
                                current_chunk = []
                                current_len = 0
                        if current_chunk:
                            raw_pages.append("\n\n".join(current_chunk))
                    
                    total_pages = max(1, len(raw_pages))
                    results = []
                    for idx, p_text in enumerate(raw_pages):
                        p_num = idx + 1
                        has_figures = any(term in p_text.lower() for term in ["figure", "fig.", "diagram", "chart", "graph", "table"])
                        results.append({
                            "page_number": p_num,
                            "total_pages": total_pages,
                            "text": p_text,
                            "has_figures": has_figures,
                            "source": {
                                "type": "pdf",
                                "file": filename,
                                "page": p_num,
                                "total_pages": total_pages
                            }
                        })
                    return results
            except Exception:
                pass
            logger.error(f"Error parsing PDF {filename}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse PDF document '{filename}': {str(e)}")
            
        return results
