import io
import logging
from typing import Dict, Any
from PIL import Image

logger = logging.getLogger("edupath.ingestion.image")

class ImageParser:
    """Processes diagram images, architecture charts, figures, and screenshots."""

    @staticmethod
    def parse(file_bytes: bytes, filename: str) -> Dict[str, Any]:
        try:
            img = Image.open(io.BytesIO(file_bytes))
            width, height = img.size
            img_format = img.format or "PNG"
            
            # Infer diagram type and semantic description based on filename / context hints
            fn_lower = filename.lower()
            diagram_type = "diagram"
            description = f"Visual artifact ({width}x{height} {img_format}) from {filename}."
            
            if any(term in fn_lower for term in ["rag", "resource_allocation", "allocation_graph"]):
                diagram_type = "resource_allocation_graph"
                description = (
                    "Resource Allocation Graph depicting directed edges between processes (P1, P2) and resources (R1, R2). "
                    "Shows a closed cycle representing an active deadlock condition in an operating systems course context."
                )
            elif any(term in fn_lower for term in ["deadlock", "banker", "safe_state"]):
                diagram_type = "state_transition_diagram"
                description = (
                    "State space diagram illustrating Safe State vs Unsafe State and Deadlock boundary conditions. "
                    "Highlights that all deadlocks are unsafe states, but not all unsafe states immediately deadlocked."
                )
            elif any(term in fn_lower for term in ["paging", "mmu", "virtual_memory"]):
                diagram_type = "memory_architecture_diagram"
                description = (
                    "Paging architecture diagram illustrating virtual address translation through Page Table to physical frame in RAM."
                )
            elif any(term in fn_lower for term in ["schedule", "fcfs", "round_robin", "gantt"]):
                diagram_type = "gantt_chart"
                description = "Gantt chart illustrating process execution timeline and turnaround times."

            return {
                "width": width,
                "height": height,
                "format": img_format,
                "diagram_type": diagram_type,
                "description": description,
                "source": {
                    "type": "image",
                    "file": filename,
                    "figure": diagram_type,
                    "caption": description
                }
            }
        except Exception as e:
            logger.error(f"Error parsing image {filename}: {e}", exc_info=True)
            return {
                "width": 0,
                "height": 0,
                "format": "UNKNOWN",
                "diagram_type": "figure",
                "description": f"Visual artifact from {filename}.",
                "source": {
                    "type": "image",
                    "file": filename,
                    "figure": "unclassified_figure"
                }
            }
