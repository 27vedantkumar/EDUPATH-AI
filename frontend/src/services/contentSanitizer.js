/**
 * EduPath AI / StockSense Intelligence — Dedicated Content Sanitization & Human-Readable Educational Formatter
 *
 * Pipeline Stage:
 * Material Ingestion → Text Extraction → CONTENT SANITIZER → Semantic Understanding →
 * Phase Generation → Explanation Generation → UI Rendering
 *
 * Guarantees that PDF dictionary tokens (/Pages, /PageMode, /Type, /Catalog, /Producer,
 * /CreationDate, 31 0 R, R 40, ReportLab, ((anonymous)), etc.), parser logs, internal IDs,
 * and raw syntax NEVER leak into learner-facing UI.
 */

// Regex patterns matching PDF internal dictionary keys, indirect object references, and binary stream noise
const PDF_METADATA_PATTERNS = [
  /\/(?:PageMode|UseNone|UseOutlines|UseThumbs|Pages|Page|Type|Catalog|Creator|Producer|CreationDate|ModDate|Author|Title|Subject|Keywords|Filter|FlateDecode|ASCIIHexDecode|ASCII85Decode|LZWDecode|DCTDecode|Length|Resources|Font|BaseFont|Encoding|WinAnsiEncoding|MacRomanEncoding|Identity-H|ToUnicode|ProcSet|MediaBox|CropBox|BleedBox|TrimBox|ArtBox|Contents|Parent|Kids|Count|Outlines|Dest|Names|Dests|ViewerPreferences|OpenAction|StructTreeRoot|MarkInfo|Metadata|Subtype|Type1|TrueType|Type0|CIDFontType0|CIDFontType2|FontDescriptor|FontBBox|ItalicAngle|Ascent|Descent|CapHeight|StemV|Flags|Widths|FirstChar|LastChar|ExtGState|XObject|Image|Form|BitsPerComponent|ColorSpace|DeviceRGB|DeviceCMYK|DeviceGray|Annot|Annots|Link|Rect|Border|Action|URI)\b/gi,
  /\b\d+\s+\d+\s+R\b/g,
  /\b(?:\d+\s+R\s*){2,}/g,
  /\bR\s+\d+(?:\s+R\s+\d+)*\b/g,
  /\bD:\d{8,16}[+-Z0-9']*?\b/g,
  /\(\(anonymous\)\)/gi,
  /\((?:anonymous|unspecified|unknown)\)/gi,
  /ReportLab\s+PDF\s+Library[^\n.]*/gi,
  /www\.reportlab\.com[^\s)]*/gi,
  /\b(?:obj|endobj|stream|endstream|xref|trailer|startxref)\b/gi,
  /%PDF-\d\.\d/gi,
  /<[0-9A-Fa-f]{8,}>/g,
  /\[(?:\s*\d+\s+\d+\s+R\s*)+\]/g,
  /\b(?:doc_user_\d+|unit_\d+_\d+|chunk_\d+|node_user_\d+|fc_user_\d+)\b/g
];

// Filler phrases to strip so explanations start directly with the concept (Section 23)
const FILLER_PHRASES = [
  /in today's rapidly evolving technological landscape[,.\s]*/gi,
  /it is important to understand that\s+/gi,
  /let us embark on a fascinating journey[^.]*\.\s*/gi,
  /let us take a moment to understand[^.]*\.\s*/gi,
  /before we dive into[^,]*,\s*/gi
];

export class ContentSanitizer {
  /**
   * Checks whether a string contains raw PDF object/catalog artifacts or binary noise
   */
  static containsExtractionArtifacts(text = '') {
    if (!text || typeof text !== 'string') return false;
    if (
      /\/(?:Pages|PageMode|UseNone|Type|Catalog|Creator|Producer|CreationDate|ModDate|Filter|FlateDecode|Font|MediaBox|Parent|Kids)\b/i.test(
        text
      )
    ) {
      return true;
    }
    if (/\b\d+\s+0\s+R\b/.test(text) || /\b(?:\d+\s+R\s*){2,}/.test(text) || /\bR\s+\d+\s+R\b/.test(text)) {
      return true;
    }
    if (/ReportLab\s+PDF\s+Library/i.test(text) || /\(\(anonymous\)\)/i.test(text) || /\bD:\d{8,}/.test(text)) {
      return true;
    }
    return false;
  }

  /**
   * Sanitizes a single line or paragraph of text, removing all PDF/parser artifacts
   * while preserving legitimate educational numbers (e.g., "3 phases", "Process 1", "CPU Burst = 5 ms").
   */
  static sanitizeText(rawText = '') {
    if (!rawText || typeof rawText !== 'string') return '';

    let cleaned = rawText;

    // 1. Remove HTML tags if any leaked
    cleaned = cleaned.replace(/<\/?[a-z][^>]*>/gi, ' ');

    // 2. Remove all PDF dictionary keys, object refs (31 0 R, 40 R 50 R), ReportLab metadata, timestamps
    for (const pattern of PDF_METADATA_PATTERNS) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    // 3. Remove standalone "/Word" PDF name objects (while keeping legitimate math like "s / (q + s)")
    cleaned = cleaned.replace(/(^|\s)\/[A-Z][A-Za-z0-9_-]+/g, ' ');

    // 4. Remove empty parentheses or double parentheses left behind by PDF strings
    cleaned = cleaned.replace(/\(\s*\)/g, ' ').replace(/\(\(+|\)\)+/g, ' ');

    // 5. Remove literal "undefined" or "[object Object]"
    cleaned = cleaned.replace(/\bundefined\b/g, '').replace(/\[object Object\]/g, '');

    // 6. Remove conversational filler phrases
    for (const filler of FILLER_PHRASES) {
      cleaned = cleaned.replace(filler, '');
    }

    // 7. Normalize whitespace while preserving paragraph breaks
    cleaned = cleaned
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter((line) => {
        if (!line) return false;
        // Reject lines that are mostly symbols, isolated numbers/letters, or PDF operators (BT, ET, Tf, Td, Tm)
        if (/^(?:BT|ET|Tf|Td|Tm|TJ|Tj|cm|rg|RG|re|f|S|Q|q|W|n|\d+|\W+)$/.test(line)) return false;
        // Count real alphabetic words of 3+ letters
        const realWords = line.match(/\b[A-Za-z]{3,}\b/g) || [];
        return realWords.length >= 2;
      })
      .join('\n\n');

    return cleaned.trim();
  }

  /**
   * Validates whether extracted text from a binary file (like a PDF) is genuinely human-readable
   * educational prose rather than leftover uncompressed header strings.
   */
  static extractCleanEducationalProse(rawBinaryString = '') {
    if (!rawBinaryString || typeof rawBinaryString !== 'string') return '';

    // Split into candidate lines/blocks first
    const candidateBlocks = rawBinaryString.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:?!()\-'"+=]{40,400}/g) || [];
    const validSentences = [];

    for (const block of candidateBlocks) {
      // Immediately discard any block that contains PDF dictionary or stream markers
      if (this.containsExtractionArtifacts(block)) continue;
      if (
        /\b(?:xml|font|obj|endobj|stream|endstream|xref|FlateDecode|schemas|openxmlformats|Content_Types|Producer|Creator|Catalog|PageMode|UseNone|MediaBox|Resources|ProcSet|WinAnsiEncoding|Subtype|FontDescriptor)\b/i.test(
          block
        )
      ) {
        continue;
      }

      const sanitized = this.sanitizeText(block);
      if (!sanitized || sanitized.length < 45) continue;

      // Verify natural language word density (must contain common English stop/connecting words)
      const hasNaturalGrammar = /\b(?:the|and|for|that|with|from|this|are|is|was|were|can|will|into|between|when|where|which|how|why|process|system|design|user|data|time|phase|stage|model|method|question|answer)\b/i.test(
        sanitized
      );
      const wordCount = (sanitized.match(/\b[A-Za-z]{3,}\b/g) || []).length;

      if (hasNaturalGrammar && wordCount >= 7) {
        validSentences.push(sanitized);
      }
    }

    // Deduplicate identical sentences
    const unique = [...new Set(validSentences)].slice(0, 15);
    return unique.join('\n\n');
  }

  /**
   * Formats a clean, human-readable document title from a filename
   * e.g., "Design_Thinking_Mixed_152_MCQs.pdf" -> "Design Thinking Mixed 152 MCQs"
   */
  static formatCleanSourceName(filename = '') {
    if (!filename) return 'Course Study Material';
    return String(filename)
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Formats a clean source citation label (Section 10)
   * GOOD: "Source: Design Thinking Mixed 152 MCQs" or "Source: Design Thinking Mixed 152 MCQs — Page 11"
   */
  static formatSourceReference(filename = '', locationLabel = '') {
    const cleanDoc = this.formatCleanSourceName(filename);
    if (!locationLabel) return `Source: ${cleanDoc}`;

    // Extract only clean Page / Slide / Timestamp if present
    const pageMatch = String(locationLabel).match(/\b(?:Page|Slide)\s+\d+\b/i);
    const timeMatch = String(locationLabel).match(/\b\d{1,2}:\d{2}\b/);

    if (pageMatch) {
      return `Source: ${cleanDoc} — ${pageMatch[0]}`;
    }
    if (timeMatch) {
      return `Source: ${cleanDoc} — ${timeMatch[0]}`;
    }
    return `Source: ${cleanDoc}`;
  }
}
