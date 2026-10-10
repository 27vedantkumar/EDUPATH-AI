import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileText,
  Presentation,
  Video,
  Sparkles,
  BookOpen,
  Play,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SourceExplorerPage = ({
  onAskAboutSource,
  onOpenUpload,
  initialSourceContext,
  refreshTrigger
}) => {
  const { currentCourse } = useAuth();
  const [sourcesData, setSourcesData] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingBanner, setPlayingBanner] = useState(null);

  useEffect(() => {
    loadSources();
  }, [currentCourse, refreshTrigger, initialSourceContext]);

  const loadSources = async () => {
    if (!currentCourse) return;
    try {
      setLoading(true);
      const data = await api.getSourceExplorer(currentCourse.id);
      setSourcesData(data);
      if (data && data.documents && data.documents.length > 0) {
        let targetDoc = data.documents[0];
        if (initialSourceContext?.selectedDocId) {
          const found = data.documents.find((d) => d.id === initialSourceContext.selectedDocId);
          if (found) targetDoc = found;
        } else if (initialSourceContext?.document) {
          const found = data.documents.find((d) =>
            d.filename.toLowerCase().includes(initialSourceContext.document.toLowerCase())
          );
          if (found) targetDoc = found;
        }
        setSelectedDoc(targetDoc);
        if (targetDoc.units && targetDoc.units.length > 0) {
          setSelectedUnit(targetDoc.units[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pptx':
      case 'slide':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'video_mp4':
      case 'video':
        return <Video className="w-4 h-4 text-rose-400" />;
      default:
        return <FileText className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto p-6 gap-6 animate-in fade-in">
      {/* Left Tree Navigator */}
      <div className="w-80 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col shrink-0">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Source Addressable KB
            </h2>
          </div>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              <span>Ingest</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {sourcesData?.documents?.map((doc) => {
            const isDocSelected = selectedDoc?.id === doc.id;
            return (
              <div key={doc.id} className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedDoc(doc);
                    if (doc.units && doc.units.length > 0) {
                      setSelectedUnit(doc.units[0]);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                    isDocSelected
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-950/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getDocIcon(doc.file_type)}
                    <span className="truncate">{doc.filename}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                    {doc.units?.length || 0} units
                  </span>
                </button>

                {isDocSelected && doc.units && (
                  <div className="pl-4 space-y-1 border-l border-slate-800 ml-2">
                    {doc.units.map((unit) => {
                      const isUnitSelected = selectedUnit?.id === unit.id;
                      return (
                        <button
                          key={unit.id}
                          onClick={() => {
                            setSelectedUnit(unit);
                            setPlayingBanner(null);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-[11px] transition-all ${
                            isUnitSelected
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                              : 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{unit.location_label}</span>
                          {unit.source?.timestamp_formatted && (
                            <span className="text-[10px] font-mono text-rose-400 flex items-center gap-0.5 shrink-0">
                              <Play className="w-2.5 h-2.5" />
                              {unit.source.timestamp_formatted}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content Viewer */}
      <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
        {selectedUnit ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                    {selectedDoc?.file_type}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedDoc?.filename}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedUnit.location_label}
                </h3>
              </div>

              <button
                onClick={() =>
                  onAskAboutSource &&
                  onAskAboutSource({
                    scopedDocument: selectedDoc?.filename,
                    initialQuery: `Explain "${selectedUnit.location_label}" from ${selectedDoc?.filename} in detail and highlight its key takeaways.`
                  })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Tutor About This</span>
              </button>
            </div>

            {/* Video Timestamp Player Banner if video segment */}
            {selectedUnit.source?.timestamp_start !== undefined && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Play className="w-5 h-5 fill-rose-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Video Timestamp Target: {selectedUnit.source.timestamp_formatted || '21:43'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Exact seek offset: {selectedUnit.source.timestamp_start}s • Indexed Speech-to-Text Segment
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setPlayingBanner(
                        `Playing ${selectedDoc?.filename} seeked directly to ${selectedUnit.source.timestamp_formatted || '21:43'} (${selectedUnit.source.timestamp_start}s)`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
                  >
                    Play at Timestamp
                  </button>
                </div>
                {playingBanner && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                    ▶ {playingBanner}
                  </div>
                )}
              </div>
            )}

            {/* Visual Description or Presenter Notes if slide */}
            {selectedUnit.source?.slide && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Presentation className="w-4 h-4" />
                  <span>Slide {selectedUnit.source.slide} Metadata & Visual Diagram</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {selectedUnit.source.figure ||
                    'Visual Diagram: Depicts Resource Allocation Graph demonstrating active deadlock conditions with processes and resources in a circular wait state.'}
                </p>
              </div>
            )}

            {/* Grounded Text Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Extracted & Verified Source Text:
              </span>
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedUnit.content}
              </div>
            </div>

            {/* Associated Concept & Prerequisite Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-slate-400 py-1">Linked Taxonomy:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                Topic: {selectedUnit.topic || selectedDoc?.topic || 'Deadlocks'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                Concept: {selectedUnit.concept || selectedDoc?.concepts?.[0] || "Safe State & Banker's Algorithm"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
                Unit ID: {selectedUnit.id}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600" />
            <span className="text-xs">Select a document or segment on the left to inspect source evidence.</span>
          </div>
        )}
      </div>
    </div>
  );
};
