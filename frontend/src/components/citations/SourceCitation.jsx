import React, { useState } from 'react';
import { FileText, Presentation, Video, Image as ImageIcon, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ContentSanitizer } from '../../services/contentSanitizer';

export const SourceCitation = ({ citation, onJump }) => {
  const [expanded, setExpanded] = useState(false);
  if (!citation) return null;

  const stype = (citation.source_type || 'pdf').toLowerCase();
  const doc = ContentSanitizer.cleanDocumentTitle(citation.document || citation.source_file || 'Course Source');
  const label = ContentSanitizer.cleanText(citation.location_label || 'Page 1');
  const excerpt = ContentSanitizer.cleanText(citation.excerpt || '');
  const relevance = Math.round((citation.relevance || 0.9) * 100);

  const getIcon = () => {
    switch (stype) {
      case 'pptx':
      case 'slide':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'video':
      case 'video_mp4':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'image':
      case 'figure':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-sky-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (stype) {
      case 'pptx':
      case 'slide':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'video':
      case 'video_mp4':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'image':
      case 'figure':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="my-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-slate-700 transition-all text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
            {getIcon()}
          </span>
          <div className="truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{doc}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono border ${getBadgeColor()}`}>
              {label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {relevance}% grounded
          </span>
          {onJump && (
            <button
              onClick={() => onJump(citation)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              title="Jump to Source in Course Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {excerpt && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {expanded && excerpt && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-950/40 p-2 rounded text-[11px] font-mono leading-relaxed">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-1">Source Excerpt:</span>
          "{excerpt}"
        </div>
      )}
    </div>
  );
};
