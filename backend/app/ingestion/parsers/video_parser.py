import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger("edupath.ingestion.video")

class VideoParser:
    """Parses video metadata, lecture recordings, and timestamped transcripts."""

    @staticmethod
    def format_timestamp(seconds: int) -> str:
        """Converts integer seconds into MM:SS or HH:MM:SS formatted string."""
        hrs = seconds // 3600
        mins = (seconds % 3600) // 60
        secs = seconds % 60
        if hrs > 0:
            return f"{hrs:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"

    @classmethod
    def parse_transcript_text(cls, transcript_text: str, filename: str) -> List[Dict[str, Any]]:
        """
        Parses structured transcript text with embedded timestamps into discrete segments.
        Supported formats include:
        - [21:43] Explanation of deadlock avoidance
        - 21:43 - 22:17: Banker's Algorithm overview
        - SRT / WebVTT timestamp styles
        """
        segments = []
        lines = transcript_text.strip().split("\n")
        
        # Regex to detect timestamp pattern like [21:43] or 21:43 or 00:21:43
        ts_pattern = re.compile(r'(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\b)?(?:\s*(?:-|–|-->)\s*(?:\[|\b)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\b)?)?')
        
        current_start = 0
        current_text = []
        current_label = "00:00"
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            match = ts_pattern.search(line_str)
            if match:
                # Flush previous segment if text exists
                if current_text:
                    seg_text = " ".join(current_text).strip()
                    end_sec = current_start + max(30, len(seg_text) // 5)
                    segments.append(cls._build_segment(
                        filename=filename,
                        segment_idx=len(segments) + 1,
                        start_sec=current_start,
                        end_sec=end_sec,
                        text=seg_text
                    ))
                    current_text = []
                    
                # Parse new timestamp
                ts_str = match.group(1)
                current_start = cls._parse_seconds(ts_str)
                # Remainder of line is transcript text
                cleaned_line = ts_pattern.sub('', line_str).strip(" :-")
                if cleaned_line:
                    current_text.append(cleaned_line)
            else:
                current_text.append(line_str)
                
        if current_text:
            seg_text = " ".join(current_text).strip()
            end_sec = current_start + max(30, len(seg_text) // 5)
            segments.append(cls._build_segment(
                filename=filename,
                segment_idx=len(segments) + 1,
                start_sec=current_start,
                end_sec=end_sec,
                text=seg_text
            ))
            
        return segments

    @classmethod
    def _parse_seconds(cls, ts_str: str) -> int:
        parts = [int(p) for p in ts_str.split(":")]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        elif len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return 0

    @classmethod
    def _build_segment(cls, filename: str, segment_idx: int, start_sec: int, end_sec: int, text: str) -> Dict[str, Any]:
        formatted_start = cls.format_timestamp(start_sec)
        formatted_end = cls.format_timestamp(end_sec)
        label = f"{formatted_start} - {formatted_end}"
        
        return {
            "segment_index": segment_idx,
            "start_seconds": start_sec,
            "end_seconds": end_sec,
            "timestamp_formatted": label,
            "text": text,
            "source": {
                "type": "video",
                "file": filename,
                "timestamp_start": start_sec,
                "timestamp_end": end_sec,
                "timestamp_formatted": label,
                "citation_label": f"Lecture Video — {formatted_start}"
            }
        }
