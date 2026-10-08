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
                        "total_pages": total_pages
                    }
                })
        except Exception as e:
            logger.error(f"Error parsing PDF {filename}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse PDF document '{filename}': {str(e)}")
            
        return results
