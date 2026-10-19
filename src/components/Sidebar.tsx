import React from 'react';
import {
  Briefcase,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Command,
  Download,
  Flag,
  Layers,
  RotateCcw,
  ShoppingBag,
  Upload,
  User,
} from 'lucide-react';
import type { Category, TodoStats, ViewFilter } from '../utils/todoLogic';

interface SidebarProps {
  activeView: ViewFilter;
  onSelectView: (view: ViewFilter) => void;
  stats: TodoStats;
  onClearCompleted: () => void;
  onResetDemo: () => void;
  onOpenCommandPalette: () => void;
  onOpenPortability: (tab: 'export' | 'import') => void;
}

const CATEGORY_META: Array<{
  id: Category;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'Work',
    label: 'Work',
    icon: <Briefcase className="w-4 h-4 text-indigo-600" aria-hidden="true" />,
  },
  {
    id: 'Personal',
    label: 'Personal',
    icon: <User className="w-4 h-4 text-emerald-600" aria-hidden="true" />,
  },
  {
    id: 'Errands',
    label: 'Errands',
    icon: <ShoppingBag className="w-4 h-4 text-amber-600" aria-hidden="true" />,
  },
  {
    id: 'Study',
    label: 'Study',
    icon: <BookOpen className="w-4 h-4 text-sky-600" aria-hidden="true" />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  stats,
  onClearCompleted,
  onResetDemo,
  onOpenCommandPalette,
  onOpenPortability,
}) => {
  const smartViews: Array<{
    id: ViewFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'all',
      label: 'All Tasks',
      count: stats.active,
      icon: <Layers className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'today',
      label: 'Due Today',
      count: stats.dueTodayOrOverdue,
      icon: <Calendar className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'upcoming',
      label: 'Scheduled',
      count: stats.scheduledActive,
      icon: <Clock className="w-4 h-4" aria-hidden="true" />,
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      count: stats.highPriorityActive,
      icon: <Flag className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <aside
      aria-label="Task lists and workspace summary"
      className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-stone-200/90 flex flex-col justify-between p-3.5 sm:p-5"
    >
      {/* Mobile Compact Switcher (visible below lg) */}
      <div className="lg:hidden space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {smartViews.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`font-mono tabular-nums ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
          {CATEGORY_META.map((cat) => {
            const isActive = activeView === cat.id;
            const count = stats.byCategory[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectView(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`font-mono tabular-nums ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Full Navigation (visible lg and up) */}
      <div className="hidden lg:block space-y-6">
        {/* Executive Workspace Identity Card + Quick Command Trigger */}
        <div className="space-y-3 border-b border-stone-200/80 pb-4">
          <div className="flex items-center gap-3 px-2">
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-display font-bold text-xs tracking-wider shrink-0"
            >
              FL
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate font-display">
                Personal Workspace
              </p>
              <p className="text-xs text-slate-500 truncate">
                Daily Priority Planner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200/80 text-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <span className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Command Palette</span>
            </span>
            <kbd className="font-mono text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Smart Views */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 px-2.5 mb-2">
            Smart Views
          </h2>
          <nav aria-label="Smart views" className="space-y-1">
            {smartViews.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Project Categories */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 px-2.5 mb-2">
            Projects
          </h2>
          <nav aria-label="Project categories" className="space-y-1">
            {CATEGORY_META.map((cat) => {
              const isActive = activeView === cat.id;
              const count = stats.byCategory[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectView(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'brightness-150' : ''}>
                      {cat.icon}
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Progress, Data Portability & Quick Actions Footer (Desktop) */}
      <div className="hidden lg:block pt-5 mt-6 border-t border-stone-200/80 space-y-4">
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1.5 text-slate-800">
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-600"
                aria-hidden="true"
              />
              Completion Rate
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {stats.completed}/{stats.total} ({stats.completionRate}%)
            </span>
          </div>
          <div
            className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={stats.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall task completion progress"
          >
            <div
              className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${stats.completionRate / 100})` }}
            />
          </div>
        </div>

        {/* JSON / CSV Backup & Import Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onOpenPortability('export')}
            className="py-2 px-2.5 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPortability('import')}
            className="py-2 px-2.5 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import</span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {stats.completed > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors text-left flex items-center justify-between whitespace-nowrap shrink-0"
            >
              <span>Clear Completed Tasks</span>
              <span className="font-mono tabular-nums text-slate-500">
                {stats.completed}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onResetDemo}
            className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restore Sample Tasks</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
