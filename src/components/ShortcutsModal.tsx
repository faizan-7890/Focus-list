import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ShortcutsModalProps {
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  items: Array<{ keys: string[]; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Anywhere',
    items: [
      { keys: ['Ctrl/⌘', 'K'], description: 'Open the command palette' },
      { keys: ['N'], description: 'Focus the new task input' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['?'], description: 'Show this shortcuts list' },
      { keys: ['Ctrl/⌘', 'Z'], description: 'Undo the last action' },
      { keys: ['Ctrl/⌘', 'Shift', 'Z'], description: 'Redo (or Ctrl/⌘ + Y)' },
      { keys: ['Esc'], description: 'Close any dialog' },
    ],
  },
  {
    title: 'Command palette',
    items: [
      { keys: ['↑', '↓'], description: 'Move through commands' },
      { keys: ['Enter'], description: 'Run the highlighted command' },
    ],
  },
  {
    title: 'Zen mode',
    items: [
      { keys: ['Space'], description: 'Start or pause the timer' },
      { keys: ['R'], description: 'Reset the interval' },
      { keys: ['M'], description: 'Mute or unmute chimes' },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(modalRef, true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-heading"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
          <h2
            id="shortcuts-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display"
          >
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="icon-btn icon-btn-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li
                  key={item.description}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.description}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {item.keys.map((key) => (
                      <kbd
                        key={key}
                        className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded px-1.5 py-0.5"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
