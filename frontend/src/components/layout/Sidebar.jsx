import React from 'react';
import {
  LayoutDashboard,
  MessageSquareText,
  Network,
  FolderTree,
  CheckSquare,
  Calendar,
  Layers,
  GraduationCap,
  Terminal,
  Gamepad2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar = ({ currentTab, onSelectTab }) => {
  const { themeConfig } = useTheme();

  const sections = [
    {
      title: 'LEARN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tutor', label: 'Grounded Tutor', icon: MessageSquareText, badge: '6 modes' },
        { id: 'graph', label: 'Knowledge Graph', icon: Network },
        { id: 'sources', label: 'Source Explorer', icon: FolderTree }
      ]
    },
    {
      title: 'PRACTICE',
      items: [
        { id: 'assessment', label: 'Assessment', icon: CheckSquare, badge: 'Diagnostic' },
        { id: 'planner', label: 'Study Planner', icon: Calendar, badge: 'Blitz' },
        { id: 'flashcards', label: 'Flashcards', icon: Layers, badge: 'SM-2' },
        { id: 'exams', label: 'Exam Simulator', icon: GraduationCap },
        { id: 'coding', label: 'Coding Lab', icon: Terminal }
      ]
    },
    {
      title: 'PLAY',
      items: [
        { id: 'games', label: 'Mini-Games', icon: Gamepad2, badge: '3 games' }
      ]
    }
  ];

  return (
    <aside
      style={{
        backgroundColor: themeConfig.bgCanvas,
        borderColor: themeConfig.borderCard
      }}
      className="w-64 border-r flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 transition-colors duration-200 overflow-y-auto"
    >
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
              {section.title}
            </span>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    backgroundColor: isActive ? themeConfig.activeTabBg : 'transparent',
                    color: isActive ? themeConfig.activeTabText : undefined
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        backgroundColor: isActive ? themeConfig.remediationBtnBg : undefined
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isActive
                          ? 'text-slate-950 font-bold border border-slate-900/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Source Grounding Status Card */}
      <div
        style={{
          backgroundColor: themeConfig.bgCard,
          borderColor: themeConfig.borderCard
        }}
        className="p-3.5 rounded-2xl border text-[11px] space-y-1 shadow-sm mt-4 transition-colors"
      >
        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Source grounding</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Zero-hallucination verification is active on every answer.
        </p>
      </div>
    </aside>
  );
};
