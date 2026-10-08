import io
import zipfile
import xml.etree.ElementTree as ET
import logging
from typing import List, Dict, Any

logger = logging.getLogger("edupath.ingestion.docx")

class DOCXParser:
    """Extracts sections, headings, and paragraphs with source coordinates from DOCX/TXT files."""

    @staticmethod
    def parse_docx(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        results = []
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
                xml_content = docx.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                
                current_heading = "General Overview"
                current_section_idx = 1
                current_paras = []
                
                for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                    para_text = "".join(texts).strip()
                    if not para_text:
                        continue
                        
                    # Check if paragraph looks like a heading
                    if len(para_text) < 80 and (para_text.isupper() or para_text.endswith(":") or para_text.startswith("#")):
                        if current_paras:
                            results.append({
                                "section_index": current_section_idx,
                                "heading": current_heading,
                                "text": "\n".join(current_paras),
                                "source": {
                                    "type": "docx",
                                    "file": filename,
                                    "section": current_section_idx,
                                    "heading": current_heading
                                }
                            })
                            current_section_idx += 1
                            current_paras = []
                        current_heading = para_text.lstrip("#").strip()
                    else:
                        current_paras.append(para_text)
                        
                if current_paras:
                    results.append({
                        "section_index": current_section_idx,
                        "heading": current_heading,
                        "text": "\n".join(current_paras),
                        "source": {
                            "type": "docx",
                            "file": filename,
                            "section": current_section_idx,
                            "heading": current_heading
                        }
                    })
        except Exception as e:
            logger.error(f"Error parsing DOCX {filename}: {e}", exc_info=True)
            # Fallback to UTF-8 decoding
            return DOCXParser.parse_txt(file_bytes, filename)
            
        return results

    @staticmethod
    def parse_txt(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        content = file_bytes.decode("utf-8", errors="replace")
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        
        results = []
        for idx, p in enumerate(paragraphs):
            results.append({
                "section_index": idx + 1,
                "heading": f"Section {idx + 1}",
                "text": p,
                "source": {
                    "type": "txt",
                    "file": filename,
                    "section": idx + 1
                }
            })
        return results if results else [{
            "section_index": 1,
            "heading": "Document Content",
            "text": content.strip(),
            "source": {"type": "txt", "file": filename, "section": 1}
        }]
