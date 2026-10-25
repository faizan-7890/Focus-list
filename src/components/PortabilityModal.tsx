import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import {
  exportTodosToCsv,
  exportTodosToJson,
  parseImportedTasks,
  type ImportMode,
  type TodoItem,
} from '../utils/todoLogic';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PortabilityModalProps {
  isOpen: boolean;
  initialTab?: 'export' | 'import';
  onClose: () => void;
  todos: TodoItem[];
  onDownloadJson: () => void;
  onDownloadCsv: () => void;
  onConfirmImport: (importedTodos: TodoItem[], mode: ImportMode) => void;
}

export const PortabilityModal: React.FC<PortabilityModalProps> = ({
  isOpen,
  initialTab = 'export',
  onClose,
  todos,
  onDownloadJson,
  onDownloadCsv,
  onConfirmImport,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const [rawImportText, setRawImportText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCopiedNotice(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const exportPreview = useMemo(() => {
    return exportFormat === 'json'
      ? exportTodosToJson(todos)
      : exportTodosToCsv(todos);
  }, [todos, exportFormat]);

  const validation = useMemo(() => {
    if (!rawImportText.trim()) return null;
    return parseImportedTasks(rawImportText);
  }, [rawImportText]);

  if (!isOpen) return null;

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportPreview);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      // Fallback if clipboard is restricted - do not show false success
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result ?? '');
      setRawImportText(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation || validation.validTodos.length === 0) return;
    onConfirmImport(validation.validTodos, importMode);
    setRawImportText('');
    setUploadedFileName(null);
    onClose();
  };

  const handleLoadSampleCsv = () => {
    setUploadedFileName(null);
    setRawImportText(
      [
        'Title,Status,Priority,Project,Due Date,Notes,Subtasks',
        '"Audit security headers and CSP",active,high,Work,2026-10-20,"Verify production response headers","[x] Check HSTS | [ ] Verify frame-ancestors"',
        '"Order winter running shoes",active,low,Errands,2026-10-22,"Waterproof trail model",""',
      ].join('\n')
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portability-modal-heading"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-stone-200 rounded-xl w-full max-w-2xl p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div>
            <h2
              id="portability-modal-heading"
              className="text-base font-semibold text-slate-900 font-display"
            >
              Data Portability — Backup & Import
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export tasks to JSON or CSV, or import tasks with live schema validation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close data portability modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          role="group"
          aria-label="Portability mode"
          className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg w-fit"
        >
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Backup ({todos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import & Validate</span>
          </button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4">
            {/* Direct Download Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <FileText
                      className="w-4 h-4 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>Full JSON Workspace Backup</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Lossless backup preserving task IDs, nested subtasks, notes, and custom ordering.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadJson}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download .JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <FileSpreadsheet
                      className="w-4 h-4 text-indigo-600"
                      aria-hidden="true"
                    />
                    <span>CSV Spreadsheet Export</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    RFC-4180 CSV table with pipe-encoded subtasks ready for Excel or Google Sheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadCsv}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download .CSV</span>
                </button>
              </div>
            </div>

            {/* Live Payload Preview & Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">
                    Serialized Preview:
                  </span>
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      exportFormat === 'json'
                        ? 'bg-slate-900 text-white'
                        : 'bg-stone-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      exportFormat === 'csv'
                        ? 'bg-slate-900 text-white'
                        : 'bg-stone-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CSV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-md inline-flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copiedNotice ? 'Copied to Clipboard' : 'Copy Text'}</span>
                </button>
              </div>

              <label htmlFor="export-preview-textarea" className="sr-only">
                Export data preview
              </label>
              <textarea
                id="export-preview-textarea"
                readOnly
                rows={6}
                value={exportPreview}
                className="w-full font-mono text-xs bg-stone-50 border border-stone-200 rounded-lg p-3 text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleImportSubmit} className="space-y-4">
            {/* File Upload or Sample Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-900">
                  Select a .json or .csv file
                </span>{' '}
                {uploadedFileName ? `(${uploadedFileName})` : 'or paste content below'}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                  id="import-file-upload"
                />
                <label
                  htmlFor="import-file-upload"
                  className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Choose File</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Paste Sample CSV
                </button>
              </div>
            </div>

            {/* Raw Input Textarea */}
            <div>
              <label
                htmlFor="import-raw-textarea"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                JSON or CSV Payload
              </label>
              <textarea
                id="import-raw-textarea"
                rows={5}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder="Paste exported JSON array or CSV rows (Title,Status,Priority,Project,Due Date,Notes,Subtasks)..."
                className="w-full font-mono text-xs bg-white border border-stone-300 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* Live Validation Summary */}
            {validation && (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {validation.validTodos.length > 0 ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertCircle
                        className="w-4 h-4 text-red-600"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      Validation Preview ({validation.sourceFormat.toUpperCase()})
                    </span>
                  </span>

                  <span className="font-mono text-slate-600 tabular-nums">
                    <strong>{validation.validTodos.length}</strong> valid tasks ·{' '}
                    <strong>{validation.totalSubtasks}</strong> subtasks
                  </span>
                </div>

                {validation.errors.length > 0 && (
                  <ul
                    role="alert"
                    className="space-y-1 text-xs text-red-600 pt-1 border-t border-stone-200"
                  >
                    {validation.errors.slice(0, 4).map((err, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <AlertCircle
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Import Mode Selector (Merge vs Replace) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2 text-xs">
                <label
                  htmlFor="import-mode-select"
                  className="text-slate-600 font-medium whitespace-nowrap"
                >
                  Import Mode:
                </label>
                <select
                  id="import-mode-select"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportMode)}
                  className="bg-stone-50 border border-stone-300 text-slate-900 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="merge">
                    Merge (Keep existing & prepend new tasks)
                  </option>
                  <option value="replace">
                    Replace (Overwrite current workspace)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!validation || validation.validTodos.length === 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
