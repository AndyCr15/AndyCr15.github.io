import React from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  PlusCircle, 
  Book, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import type { Character } from '../types';
import { parseCharactersCsv, CsvCharacterRow } from '../lib/csv';
import type { ImportResolutionMode } from '../lib/firebase';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    rows: CsvCharacterRow[],
    mode: ImportResolutionMode
  ) => Promise<{ added: number; updated: number; skipped: number }>;
  existingCharacters: Character[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCharacters,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<CsvCharacterRow[]>([]);
  const [parseErrors, setParseErrors] = React.useState<string[]>([]);
  const [importMode, setImportMode] = React.useState<ImportResolutionMode>('add_new_only');
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    added: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset state on open
  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedRows([]);
      setParseErrors([]);
      setImportMode('add_new_only');
      setIsImporting(false);
      setImportResult(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Lookup map of existing character names
  const existingNamesSet = React.useMemo(() => {
    const s = new Set<string>();
    existingCharacters.forEach((c) => s.add(c.name.trim().toLowerCase()));
    return s;
  }, [existingCharacters]);

  // Statistics on parsed rows
  const stats = React.useMemo(() => {
    let newCount = 0;
    let existingCount = 0;
    parsedRows.forEach((row) => {
      if (existingNamesSet.has(row.name.trim().toLowerCase())) {
        existingCount++;
      } else {
        newCount++;
      }
    });
    return {
      total: parsedRows.length,
      newCount,
      existingCount,
    };
  }, [parsedRows, existingNamesSet]);

  if (!isOpen) return null;

  const handleProcessFile = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const { rows, errors } = parseCharactersCsv(content);
        setParsedRows(rows);
        setParseErrors(errors);
      }
    };
    reader.onerror = () => {
      setParseErrors(['Failed to read the file. Please check file permissions.']);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0 || isImporting) return;

    try {
      setIsImporting(true);
      const res = await onImport(parsedRows, importMode);
      setImportResult(res);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Import failed:', err);
      setParseErrors([err.message || 'Import process encountered an unexpected error.']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto font-sans-ui">
      <div 
        className="relative w-full max-w-2xl bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center border border-[#6D492A] dark:border-[#382312]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading tracking-wide">
                Import Characters from CSV
              </h2>
              <p className="text-xs text-[#CFB9A3] dark:text-[#A8927D]">
                Load character dossiers from spreadsheet files
              </p>
            </div>
          </div>
          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* File Upload Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#8B5A36] bg-[#EBE1D4] dark:bg-[#332014]'
                : file
                ? 'border-[#8B5A36]/60 bg-[#F4EDE2] dark:bg-[#281A11]'
                : 'border-[#D5C2AA] dark:border-[#4A3220] hover:border-[#8B5A36] bg-[#F7F2EA] dark:bg-[#23170E]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8DCCF] dark:bg-[#3B2516] text-[#694223] dark:text-[#DDA675] flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-[#3E2411] dark:text-[#F5EDE3]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#7A614C] dark:text-[#A89481]">
                    {(file.size / 1024).toFixed(1)} KB • Click or drop another file to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-[#3E2411] dark:text-[#F5EDE3]">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-[#7A614C] dark:text-[#A89481] mt-0.5">
                    Supports headers: Name, Role, Books, Series, Description, Spoilers
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error messages if parsing failed */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 bg-[#FBEAE8] dark:bg-[#3A1410] border border-[#E8ADA7] dark:border-[#6B241C] rounded-xl text-xs text-[#9B2C1E] dark:text-[#F08B7F] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>CSV Processing Notices</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Choices and Preview if file parsed */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Import Mode Strategy Selector */}
              <div>
                <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider mb-2">
                  Choose Conflict & Overwrite Strategy:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Add New Only */}
                  <button
                    type="button"
                    id="import-mode-add-new-btn"
                    onClick={() => setImportMode('add_new_only')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'add_new_only'
                        ? 'bg-[#EAE0D3] dark:bg-[#332013] border-[#8B5A36] dark:border-[#C49366] ring-2 ring-[#8B5A36]/30 shadow-xs'
                        : 'bg-[#F4ECE1] dark:bg-[#261910] border-[#D9C8B2] dark:border-[#422C1A] hover:border-[#BFAF9E]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#3D2310] dark:text-[#F4ECE1]">
                        <PlusCircle className="w-4 h-4 text-[#8B5A36] dark:text-[#D49E6F]" />
                        <span>Only Add New Characters</span>
                      </div>
                      {importMode === 'add_new_only' && (
                        <Check className="w-4 h-4 text-[#8B5A36] dark:text-[#C49366]" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B5038] dark:text-[#A89481] leading-relaxed mb-2">
                      Preserves your existing characters as-is. Skips any character whose name is already in your journal.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-[11px] font-semibold text-[#54351B] dark:text-[#DFCBBA]">
                      <span className="px-2 py-0.5 rounded bg-[#DDCFBE] dark:bg-[#442B1A]">
                        +{stats.newCount} will be added
                      </span>
                      {stats.existingCount > 0 && (
                        <span className="text-[#8C6D53] dark:text-[#A68F7B]">
                          ({stats.existingCount} skipped)
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Option 2: Overwrite Current Characters */}
                  <button
                    type="button"
                    id="import-mode-overwrite-btn"
                    onClick={() => setImportMode('overwrite_existing')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'overwrite_existing'
                        ? 'bg-[#EAE0D3] dark:bg-[#332013] border-[#8B5A36] dark:border-[#C49366] ring-2 ring-[#8B5A36]/30 shadow-xs'
                        : 'bg-[#F4ECE1] dark:bg-[#261910] border-[#D9C8B2] dark:border-[#422C1A] hover:border-[#BFAF9E]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#3D2310] dark:text-[#F4ECE1]">
                        <RefreshCw className="w-4 h-4 text-[#8B5A36] dark:text-[#D49E6F]" />
                        <span>Overwrite Current Characters</span>
                      </div>
                      {importMode === 'overwrite_existing' && (
                        <Check className="w-4 h-4 text-[#8B5A36] dark:text-[#C49366]" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B5038] dark:text-[#A89481] leading-relaxed mb-2">
                      Updates existing characters with latest CSV notes, roles, spoilers & books, plus adds new characters.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-[11px] font-semibold text-[#54351B] dark:text-[#DFCBBA]">
                      <span className="px-2 py-0.5 rounded bg-[#DDCFBE] dark:bg-[#442B1A]">
                        +{stats.newCount} new
                      </span>
                      {stats.existingCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-[#E4D1BA] dark:bg-[#4E311B] text-[#783D12] dark:text-[#F2B980]">
                          ⟳ {stats.existingCount} updated
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                    Dossier Preview ({parsedRows.length} found)
                  </span>
                  <span className="text-[11px] text-[#7A614C] dark:text-[#A89481]">
                    Showing first {Math.min(5, parsedRows.length)} records
                  </span>
                </div>

                <div className="border border-[#D5C2AA] dark:border-[#422C1A] rounded-xl overflow-hidden bg-[#FAF6F0] dark:bg-[#180F09]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#EFE7DA] dark:bg-[#25180F] border-b border-[#D5C2AA] dark:border-[#422C1A] text-[#54351B] dark:text-[#D8BA9A]">
                        <th className="py-2 px-3 font-bold">Character</th>
                        <th className="py-2 px-3 font-bold">Books</th>
                        <th className="py-2 px-3 font-bold">Spoilers</th>
                        <th className="py-2 px-3 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5D8] dark:divide-[#2F1F14]">
                      {parsedRows.slice(0, 5).map((row, idx) => {
                        const isExisting = existingNamesSet.has(row.name.trim().toLowerCase());
                        return (
                          <tr key={idx} className="hover:bg-[#F3ECE1] dark:hover:bg-[#20140D]">
                            <td className="py-2 px-3">
                              <span className="font-bold text-[#3E2411] dark:text-[#F5EDE3]">
                                {row.name}
                              </span>
                              {row.role && (
                                <span className="text-[10px] text-[#8C6D53] dark:text-[#9A8472] ml-1.5">
                                  ({row.role})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 max-w-[140px] truncate text-[#6E5540] dark:text-[#BFAF9E]">
                              {row.books.length > 0 ? row.books.join(', ') : '—'}
                            </td>
                            <td className="py-2 px-3">
                              {row.spoilers ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FBEAE8] dark:bg-[#3D1815] text-[#9E2A1E] dark:text-[#F08B7F] font-semibold border border-[#E8ADA7] dark:border-[#5C231E]">
                                  Included
                                </span>
                              ) : (
                                <span className="text-[#A6907D] text-[10px]">None</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {isExisting ? (
                                importMode === 'overwrite_existing' ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                                    Overwrite
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold">
                                    Skip
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                                  Add New
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {importResult && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Import successfully processed!</span>
              </div>
              <p>
                Added {importResult.added} new character records
                {importResult.updated > 0 ? `, updated ${importResult.updated} existing characters` : ''}
                {importResult.skipped > 0 ? `, skipped ${importResult.skipped} existing records` : ''}.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#EFE7DA]/70 dark:bg-[#150D07] border-t border-[#D5C2AA] dark:border-[#382312] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#D5C2AA] dark:border-[#4E3420] text-[#54351B] dark:text-[#D1BAA3] hover:bg-[#EAE0D3] dark:hover:bg-[#2B1B10] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            id="confirm-import-csv-btn"
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || isImporting || Boolean(importResult)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#84563C] hover:bg-[#966447] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>
              {isImporting
                ? 'Importing...'
                : importMode === 'add_new_only'
                ? `Import ${stats.newCount} New Characters`
                : `Import & Overwrite (${parsedRows.length})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
