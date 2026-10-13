import React, { useState, useEffect } from 'react';
import {
  Network,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const KnowledgeGraphPage = ({ onAskConcept, onPracticeConcept }) => {
  const { currentCourse } = useAuth();
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, [currentCourse]);

  const loadGraph = async () => {
    if (!currentCourse) return;
    try {
      setLoading(true);
      const data = await api.getKnowledgeGraph(currentCourse.id);
      setGraphData(data);
      if (data && data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  // Node color helper
  const getNodeFill = (status, mastery) => {
    if (status === 'LOCKED') return '#1e293b';
    if (mastery >= 0.85) return '#10b981'; // Green
    if (mastery >= 0.70) return '#6366f1'; // Indigo
    if (mastery >= 0.50) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose / Red
  };

  const getNodeStroke = (status, mastery) => {
    if (status === 'LOCKED') return '#475569';
    if (mastery >= 0.85) return '#34d399';
    if (mastery >= 0.70) return '#818cf8';
    if (mastery >= 0.50) return '#fbbf24';
    return '#fb7185';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto p-6 gap-6 animate-in fade-in">
      {/* SVG Interactive Canvas */}
      <div className="flex-1 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Course Knowledge & Prerequisite Graph</h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {currentCourse?.title || 'Operating Systems'} • Dynamic Mastery Topology
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mastered (≥85%)
            </span>
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Proficient (≥70%)
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Developing (≥50%)
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Weak (&lt;50%)
            </span>
          </div>
        </div>

        {/* SVG Visualization Canvas */}
        <div className="flex-1 flex items-center justify-center relative overflow-auto my-2">
          {graphData && (
            <svg
              className="w-full h-full min-h-[460px]"
              viewBox={`0 0 800 ${Math.max(480, ...(graphData.nodes || []).map((n) => (n.y || 300) + 80))}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Dependency Edges */}
              {graphData.edges?.map((edge, idx) => {
                const source = graphData.nodes.find(n => n.id === edge.source);
                const target = graphData.nodes.find(n => n.id === edge.target);
                if (!source || !target) return null;

                return (
                  <g key={idx}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#475569"
                      strokeWidth="2"
                      strokeDasharray={edge.is_prerequisite ? "4 4" : "none"}
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}

              {/* Knowledge Nodes */}
              {graphData.nodes?.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const fill = getNodeFill(node.status, node.mastery_score);
                const stroke = getNodeStroke(node.status, node.mastery_score);

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="32"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        className="animate-ping opacity-30"
                      />
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="24"
                      fill={fill}
                      stroke={isSelected ? '#ffffff' : stroke}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="shadow-lg"
                    />

                    {/* Node Lock / Mastery Icon */}
                    {node.status === 'LOCKED' ? (
                      <Lock x={node.x - 6} y={node.y - 6} width="12" height="12" stroke="#94a3b8" />
                    ) : (
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {Math.round(node.mastery_score * 100)}%
                      </text>
                    )}

                    {/* Node Label Below */}
                    <text
                      x={node.x}
                      y={node.y + 40}
                      textAnchor="middle"
                      fill="currentColor"
                      className="text-slate-800 dark:text-slate-200 fill-slate-800 dark:fill-slate-200"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Click any concept node to inspect prerequisites, source citations, and remediation actions.</span>
          <span className="font-mono">{graphData?.nodes?.length || 5} Concepts Identified</span>
        </div>
      </div>

      {/* Selected Node Detail Drawer */}
      {selectedNode && (
        <div className="w-80 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between shrink-0 space-y-4 animate-in slide-in-from-right">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Concept Detail
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedNode.name}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mastery Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Current Mastery:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {Math.round(selectedNode.mastery_score * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.round(selectedNode.mastery_score * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Status: <strong className="text-slate-800 dark:text-slate-200">{selectedNode.status}</strong></span>
                <span>Attempts: <strong className="text-slate-800 dark:text-slate-200">{selectedNode.attempts_count || 3}</strong></span>
              </div>
            </div>

            {/* Description & Overview */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Concept Explanation:</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedNode.description ||
                  `Core theoretical and applied principle regarding ${selectedNode.name} in modern operating systems and multiprogramming concurrency.`}
              </p>
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Prerequisites:</span>
              <div className="space-y-1">
                {(selectedNode.prerequisites || ['Resource Allocation', 'Coffman Conditions']).map((prereq, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-700 dark:text-slate-300"
                  >
                    <span>{prereq}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Source Reference */}
            {selectedNode.source && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-[11px] space-y-1">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold block">Primary Source:</span>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedNode.source.file || 'Operating Systems.pdf'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onAskConcept && onAskConcept(selectedNode)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Tutor About This</span>
            </button>
            <button
              onClick={() => onPracticeConcept && onPracticeConcept(selectedNode.name)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Practice Concept Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
