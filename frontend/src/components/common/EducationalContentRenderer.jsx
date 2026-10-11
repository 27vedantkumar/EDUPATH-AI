import React from 'react';
import { ContentSanitizer } from '../../services/contentSanitizer';

/**
 * Parses inline formatting (**bold**, *italic*, `code`) into clean React elements
 * without ever exposing raw Markdown asterisks or backticks to the learner.
 */
function renderInlineTokens(text = '') {
  if (!text) return null;

  // Tokenize by **bold**, *italic*, and `code`
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  const parts = String(text).split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-indigo-200 font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="font-mono text-emerald-300 bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * EduPath AI — Clean Educational Lesson Renderer
 *
 * Enforces Section 6 Typography Rules:
 * - Single consistent base font scale (text-sm / 14px) throughout educational content
 * - Visual hierarchy via bold headings (**Main Topic**), italic terms (*Important Term*),
 *   spacing, subtle borders, and separated Example / Formula blocks
 * - Zero raw PDF metadata, zero raw Markdown symbols (###, **, *) exposed
 */
export const EducationalContentRenderer = ({ content = '', className = '' }) => {
  const sanitized = ContentSanitizer.sanitizeText(content);

  if (!sanitized) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 space-y-2">
        <div className="font-bold text-white">We couldn&apos;t fully read this material</div>
        <p className="text-slate-300 leading-relaxed">
          Some parts of the uploaded material could not be interpreted correctly. Please try another file or upload a clearer version.
        </p>
      </div>
    );
  }

  // Split into blocks by double newline or single lines
  const rawLines = sanitized
    .replace(/^#{1,6}\s*(.+)$/gm, '**$1**') // Normalize any ### headings into **Bold Topic** at the same base font size
    .split('\n');

  const elements = [];
  let idx = 0;

  while (idx < rawLines.length) {
    const line = rawLines[idx].trim();

    if (!line) {
      idx++;
      continue;
    }

    // Ignore decorative ASCII dividers
    if (/^[━─═\-_]{4,}$/.test(line)) {
      idx++;
      continue;
    }

    // Code block ```...```
    if (line.startsWith('```')) {
      const codeLines = [];
      idx++;
      while (idx < rawLines.length && !rawLines[idx].trim().startsWith('```')) {
        codeLines.push(rawLines[idx]);
        idx++;
      }
      idx++; // skip closing ```
      elements.push(
        <pre
          key={`code_${idx}`}
          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-300 overflow-x-auto leading-relaxed"
        >
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // Standalone Main Topic or Section Heading: **Heading**
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      const headingText = line.slice(2, -2).trim();
      const isExampleHeading = /^example$/i.test(headingText);

      // If it's an **Example** section, group the immediately following paragraph into a separated example card
      if (isExampleHeading && idx + 1 < rawLines.length) {
        let nextIdx = idx + 1;
        while (nextIdx < rawLines.length && !rawLines[nextIdx].trim()) nextIdx++;
        if (nextIdx < rawLines.length && !/^\*\*[^*]+\*\*$/.test(rawLines[nextIdx].trim())) {
          const exampleBody = rawLines[nextIdx].trim();
          elements.push(
            <div
              key={`ex_${idx}`}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1.5"
            >
              <div className="text-sm font-bold text-white">Example</div>
              <div className="text-sm text-slate-200 leading-relaxed">
                {renderInlineTokens(exampleBody)}
              </div>
            </div>
          );
          idx = nextIdx + 1;
          continue;
        }
      }

      elements.push(
        <div key={`h_${idx}`} className="pt-2 first:pt-0 text-sm font-bold text-white">
          {headingText}
        </div>
      );
      idx++;
      continue;
    }

    // Standalone Important Term: *Important Term*
    if (/^\*[^*]+\*$/.test(line)) {
      const termText = line.slice(1, -1).trim();
      const isSourceLine = /^Source:/i.test(termText);
      elements.push(
        <div
          key={`term_${idx}`}
          className={
            isSourceLine
              ? 'pt-2 text-sm italic text-slate-400 border-t border-slate-800/70'
              : 'pt-1 text-sm italic text-indigo-200 font-medium'
          }
        >
          {termText}
        </div>
      );
      idx++;
      continue;
    }

    // Formula line
    if (/^(?:Formula:|Key Formula:)/i.test(line) || (line.includes('=') && line.length < 110 && !line.endsWith('.'))) {
      const cleanFormula = line.replace(/^(?:Formula:|Key Formula:)\s*/i, '').replace(/`/g, '');
      elements.push(
        <div
          key={`f_${idx}`}
          className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-sm text-emerald-300"
        >
          {cleanFormula}
        </div>
      );
      idx++;
      continue;
    }

    // Bullet item (convert to clean spaced paragraph or subtle list item without clutter)
    if (/^[•\-]\s+/.test(line)) {
      const bulletBody = line.replace(/^[•\-]\s+/, '');
      elements.push(
        <div key={`b_${idx}`} className="text-sm text-slate-200 leading-relaxed pl-3 border-l-2 border-slate-800">
          {renderInlineTokens(bulletBody)}
        </div>
      );
      idx++;
      continue;
    }

    // Standard educational paragraph (consistent text-sm base scale)
    elements.push(
      <p key={`p_${idx}`} className="text-sm text-slate-200 leading-relaxed">
        {renderInlineTokens(line)}
      </p>
    );
    idx++;
  }

  return <div className={`space-y-3 font-sans text-sm ${className}`}>{elements}</div>;
};
