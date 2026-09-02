import { FileSpreadsheet, Check, Download, Trash2, Search, Calculator, Plus, FileText, Sparkles, Edit3, ChevronRight, BookOpen } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Language, MeasurementRecord } from '../types';
import { PhysicsEquationKeyboard } from './PhysicsEquationKeyboard';
import { sanitizeCSVField } from '../utils/csv';

interface Props {
  lang: Language;
  records: MeasurementRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onUpdateNote: (id: string, note: string) => void;
}

export default function LabNotebook({ lang, records, onDeleteRecord, onClearAll, onUpdateNote }: Props) {
  const { t: tI18n } = useTranslation();
  const t = (tI18n('notebook', { returnObjects: true }) as any);
  const common = (tI18n('common', { returnObjects: true }) as any);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [activeNoteRecordId, setActiveNoteRecordId] = useState<string | null>(null);
  const [currentEditingNote, setCurrentEditingNote] = useState<string>('');
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);

  // Filtered records
  const filtered = records.filter((r) => {
    const text = `${r.experiment} ${r.variableName} ${JSON.stringify(r.parameters)} ${r.notes || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['ID', 'Experiment', 'Variable', 'Measured', 'Theoretical', 'Unit', '% Error', 'Parameters', 'Timestamp', 'Notes'];
    const rows = records.map((r) => [
      `"${sanitizeCSVField(r.id)}"`,
      `"${sanitizeCSVField(r.experiment)}"`,
      `"${sanitizeCSVField(r.variableName)}"`,
      r.measuredValue,
      r.theoreticalValue,
      `"${sanitizeCSVField(r.unit)}"`,
      r.percentError.toFixed(2),
      `"${sanitizeCSVField(Object.entries(r.parameters).map(([k, v]) => `${k}:${v}`).join('; '))}"`,
      `"${sanitizeCSVField(r.timestamp)}"`,
      `"${sanitizeCSVField(r.notes || '')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `physics_lab_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (records.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `physics_lab_records_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenKeyboardForRecord = (record: MeasurementRecord) => {
    setActiveNoteRecordId(record.id);
    setCurrentEditingNote(record.notes || '');
    setShowKeyboard(true);
  };

  const handleApplyNoteFromKeyboard = (newNoteVal: string) => {
    if (activeNoteRecordId) {
      onUpdateNote(activeNoteRecordId, newNoteVal);
    }
  };

  return (
    <div id="lab-notebook-view" className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">{t.title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">{t.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {records.length > 0 && (
            <>
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedCSV ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{t.exportCSV}</span>
              </button>
              <button
                id="export-json-btn"
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.exportJSON}</span>
              </button>
              <button
                id="clear-records-btn"
                onClick={onClearAll}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearAll}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Physics Equation Keyboard Drawer */}
      {showKeyboard && (
        <div className="animate-fade-in">
          <PhysicsEquationKeyboard
            lang={lang}
            value={currentEditingNote}
            onChange={(newVal) => {
              setCurrentEditingNote(newVal);
              handleApplyNoteFromKeyboard(newVal);
            }}
            onInsert={(sym) => {
              const updated = currentEditingNote + sym;
              setCurrentEditingNote(updated);
              handleApplyNoteFromKeyboard(updated);
            }}
            onClose={() => {
              setShowKeyboard(false);
              setActiveNoteRecordId(null);
            }}
            docked={true}
          />
        </div>
      )}

      {/* Search and Formula Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-records-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في السجلات أو التجربة أو الملاحظات...' : lang === 'ku' ? 'گەڕان لە تۆمارەکان، تاقیکردنەوە یان تێبینییەکان...' : 'Search logs, experiment, notes...'}
            className="w-full ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
          {t.errorFormula}
        </div>
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto shadow-inner">
            <FileSpreadsheet className="w-7 h-7 text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">{t.empty}</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {lang === 'ar'
                ? 'انتقل إلى أي تجربة واضغط على زر "تسجيل القياس في دفتر المختبر" لإدراج محاولة جديدة وحساب نسبة الدقة.'
                : 'Go to any simulation and click "Log to Lab Notebook" to record experimental data and calculate percent error.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300 font-semibold">
                <th className="p-3.5">{t.tableHeaders.time}</th>
                <th className="p-3.5">{t.tableHeaders.experiment}</th>
                <th className="p-3.5">{t.tableHeaders.variable}</th>
                <th className="p-3.5">{t.tableHeaders.measured}</th>
                <th className="p-3.5">{t.tableHeaders.theoretical}</th>
                <th className="p-3.5">{t.tableHeaders.error}</th>
                <th className="p-3.5">{t.tableHeaders.parameters}</th>
                <th className="p-3.5 min-w-[240px]">{t.tableHeaders.notes}</th>
                <th className="p-3.5 text-center">{t.tableHeaders.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((record) => {
                const error = record.percentError;
                const errorColor =
                  error < 1.0
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : error < 5.0
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

                const isEditing = activeNoteRecordId === record.id && showKeyboard;

                return (
                  <tr key={record.id} className={`hover:bg-zinc-900/50 transition-colors ${isEditing ? 'bg-indigo-950/20' : ''}`}>
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap font-mono text-[11px]">{record.timestamp}</td>
                    <td className="p-3.5 font-medium text-zinc-200 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700/60 text-[11px] font-mono">
                        {record.experiment}
                      </span>
                    </td>
                    <td className="p-3.5 text-sky-300 font-medium">{record.variableName}</td>
                    <td className="p-3.5 font-mono text-zinc-100 font-bold">
                      {record.measuredValue} {record.unit}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">
                      {record.theoreticalValue} {record.unit}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${errorColor}`}>
                        {record.percentError.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-zinc-400 font-mono">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Object.entries(record.parameters).map(([k, v]) => (
                          <span key={k} className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={record.notes || ''}
                          onChange={(e) => onUpdateNote(record.id, e.target.value)}
                          placeholder={t.addNotePlaceholder}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                        />
                        <button
                          onClick={() => handleOpenKeyboardForRecord(record)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-indigo-400 border border-zinc-800 hover:border-indigo-500/40 transition-colors shrink-0"
                          title={lang === 'ar' ? 'إدخال معادلات رياضية باللوحة' : 'Insert Equation with Keyboard'}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}