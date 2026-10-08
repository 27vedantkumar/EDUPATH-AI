# EduPath AI — Known Limitations & Engineering Boundaries

> **Transparent technical disclosure of system capabilities, constraints, and planned roadmaps.**

---

## 1. Multimodal Document Processing

| Format | Supported Features | Current Limitations |
|:---|:---|:---|
| **PDF** | Text extraction, page-level mapping, heading detection, embedded image extraction. | Scanned PDFs with poor contrast require high-res OCR; complex multi-column tables may merge adjacent columns if bounding boxes overlap. |
| **PPT / PPTX** | Slide-by-slide text, presenter speaker notes, shapes, title extraction. | Highly customized vector shapes or animated SmartArt diagrams are represented by extracted text and shape hierarchies rather than visual vector re-rendering. |
| **DOCX** | Full headings, sections, paragraphs, tables, bullet hierarchies. | Macro-enabled (`.docm`) or legacy pre-2007 binary (`.doc`) files must be converted to standard `.docx` before ingestion. |
| **Video (MP4)** | Audio extraction, speech-to-text transcript generation with millisecond timestamp markers (`HH:MM:SS`). | In offline environments without external Whisper or speech cloud services, a timestamped transcript generator extracts or aligns text markers. Extremely noisy classroom audio may yield lower transcription confidence. |
| **Images** | OCR text extraction, captioning, figure linkage to topics/concepts. | Handwriting recognition on cursive whiteboard notes is dependent on image resolution and lighting conditions. |

---

## 2. AI Providers & Grounding Constraints

1. **Grounding Gate Strictness**: In "Course Grounded Mode", if similarity and relevance scores fall below the threshold (default: 0.68), the system strictly refuses to answer rather than guessing. While this prevents hallucinations, queries using obscure synonyms not present in the course text may be conservatively rejected.
2. **Offline Fallback Engine**: When no cloud API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) is provided, the platform operates in deterministic **Demo / Offline Mode**. In this mode, pre-indexed course evidence and deterministic reasoning are utilized; generative capabilities for unindexed random topics are constrained.
3. **Citation Precision**: Citations are pinpointed to the exact page, slide, or video timestamp range. Deep internal sub-bounding-box visual highlighting in PDF viewers is subject to browser PDF renderer support.

---

## 3. Code Execution Sandbox Constraints

1. **Supported Languages**: Python and JavaScript are fully sandboxed. C, C++, and Java are supported in development environments where native system toolchains (`gcc`, `javac`) are pre-installed; otherwise, structural compilation checks are enforced.
2. **Network Isolation**: By design, code executing in the sandbox has no external network access (`AF_INET`/`AF_INET6` sockets are blocked). Code requiring network calls (e.g. `requests.get`) will fail with a security violation.
3. **Resource Caps**: Executions are strictly limited to 4 seconds wall-clock time and 128 MB RAM to protect the host against denial-of-service and infinite loops.
