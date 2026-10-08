import io
import re
import zipfile
import xml.etree.ElementTree as ET
import logging
from typing import List, Dict, Any

logger = logging.getLogger("edupath.ingestion.pptx")

class PPTXParser:
    """Parses PPTX slides, notes, and titles preserving exact slide numbers."""

    @staticmethod
    def parse(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        slides = []
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as pptx:
                # Find all slide XML files and sort them numerically
                slide_names = [f for f in pptx.namelist() if re.match(r'ppt/slides/slide\d+\.xml', f)]
                slide_names.sort(key=lambda s: int(re.search(r'\d+', s).group()))
                
                for idx, s_name in enumerate(slide_names):
                    slide_num = idx + 1
                    xml_content = pptx.read(s_name)
                    tree = ET.fromstring(xml_content)
                    
                    # Extract text from drawingML / presentationML elements
                    texts = []
                    for node in tree.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t'):
                        if node.text:
                            texts.append(node.text.strip())
                            
                    full_slide_text = " ".join(texts)
                    
                    # Deduce slide title (first non-empty text element or fallback)
                    title = texts[0] if texts else f"Slide {slide_num}"
                    
                    # Check for diagrams / graphs
                    has_diagram = any(term in full_slide_text.lower() for term in [
                        "graph", "diagram", "chart", "flowchart", "cycle", "resource allocation", "deadlock"
                    ])
                    diagram_desc = None
                    if has_diagram:
                        diagram_desc = f"Slide {slide_num} presents visual concept diagrams related to: {title}"

                    # Try to extract speaker notes if present
                    speaker_notes = ""
                    note_name = f"ppt/notesSlides/notesSlide{slide_num}.xml"
                    if note_name in pptx.namelist():
                        try:
                            note_tree = ET.fromstring(pptx.read(note_name))
                            note_texts = [n.text.strip() for n in note_tree.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t') if n.text]
                            speaker_notes = " ".join(note_texts)
                        except Exception:
                            pass

                    slides.append({
                        "slide_number": slide_num,
                        "title": title,
                        "text": full_slide_text,
                        "speaker_notes": speaker_notes,
                        "has_diagram": has_diagram,
                        "diagram_description": diagram_desc,
                        "source": {
                            "type": "pptx",
                            "file": filename,
                            "slide": slide_num,
                            "title": title
                        }
                    })
        except Exception as e:
            logger.error(f"Error parsing PPTX {filename}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse presentation '{filename}': {str(e)}")
            
        return slides
