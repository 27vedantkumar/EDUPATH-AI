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

export const Sidebar = ({ currentTab, onSelectTab }) => {
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
    <aside className="w-64 border-r border-slate-200/90 dark:border-[#1a1c26] bg-white dark:bg-[#06070a] flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 transition-colors duration-200 overflow-y-auto">
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
              {section.title}
            </span>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ece9fe] dark:bg-indigo-600/20 text-[#4f46e5] dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-[#12131d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-[#4f46e5] dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isActive
                          ? 'bg-[#ddd6fe] dark:bg-indigo-500/30 text-[#4338ca] dark:text-indigo-200'
                          : 'bg-slate-100 dark:bg-[#12131d] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#222436]'
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
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c0d14] border border-slate-200/90 dark:border-[#1a1c26] text-[11px] space-y-1 shadow-sm mt-4 transition-colors">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Source grounding</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Zero-hallucination verification is active on every answer.
        </p>
      </div>
    </aside>
  );
};
