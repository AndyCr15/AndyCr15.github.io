import React from 'react';
import { 
  X, 
  Download, 
  Book, 
  Library, 
  Users, 
  Check, 
  FileSpreadsheet, 
  Search,
  CheckCircle2
} from 'lucide-react';
import type { Character } from '../types';
import { generateCharactersCsv, downloadCsvFile } from '../lib/csv';
import { getCharacterSeries } from '../lib/grouping';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  existingBooks: string[];
  existingSeries: string[];
  bookSeriesMap?: Record<string, string[]>;
}

type ExportScope = 'all' | 'book' | 'series';

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  characters,
  existingBooks,
  existingSeries,
  bookSeriesMap = {},
}) => {
  const [scope, setScope] = React.useState<ExportScope>('all');
  const [selectedBook, setSelectedBook] = React.useState<string>(existingBooks[0] || '');
  const [selectedSeries, setSelectedSeries] = React.useState<string>(existingSeries[0] || '');
  const [bookSearchQuery, setBookSearchQuery] = React.useState<string>('');
  const [seriesSearchQuery, setSeriesSearchQuery] = React.useState<string>('');
  const [hasExported, setHasExported] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setHasExported(false);
      const defaultBook = existingBooks[0] || '';
      const defaultSeries = existingSeries[0] || '';
      if (!selectedBook && defaultBook) {
        setSelectedBook(defaultBook);
      }
      if (!selectedSeries && defaultSeries) {
        setSelectedSeries(defaultSeries);
      }
      setBookSearchQuery('');
      setSeriesSearchQuery('');
    }
  }, [isOpen, existingBooks, existingSeries]);

  // Helper count for books
  const getBookCharCount = React.useCallback((bookTitle: string) => {
    return characters.filter((c) => {
      const charBooks = Array.isArray(c.books) ? c.books : (c.book ? [c.book] : []);
      return charBooks.some((b) => b.trim().toLowerCase() === bookTitle.trim().toLowerCase());
    }).length;
  }, [characters]);

  // Helper count for series
  const getSeriesCharCount = React.useCallback((seriesName: string) => {
    return characters.filter((c) => {
      const charSeries = getCharacterSeries(c, bookSeriesMap);
      return charSeries.some((s) => s.trim().toLowerCase() === seriesName.trim().toLowerCase());
    }).length;
  }, [characters, bookSeriesMap]);

  // Rank and offer most likely books based on search input
  const rankedBooks = React.useMemo(() => {
    const q = bookSearchQuery.trim().toLowerCase();
    if (!q) {
      return existingBooks;
    }
    return [...existingBooks].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aExact = aLower === q ? 1 : 0;
      const bExact = bLower === q ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = aLower.startsWith(q) ? 1 : 0;
      const bStarts = bLower.startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      const aIncludes = aLower.includes(q) ? 1 : 0;
      const bIncludes = bLower.includes(q) ? 1 : 0;
      if (aIncludes !== bIncludes) return bIncludes - aIncludes;

      return a.localeCompare(b);
    }).filter((b) => b.toLowerCase().includes(q));
  }, [existingBooks, bookSearchQuery]);

  // Rank and offer most likely series based on search input
  const rankedSeries = React.useMemo(() => {
    const q = seriesSearchQuery.trim().toLowerCase();
    if (!q) {
      return existingSeries;
    }
    return [...existingSeries].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aExact = aLower === q ? 1 : 0;
      const bExact = bLower === q ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = aLower.startsWith(q) ? 1 : 0;
      const bStarts = bLower.startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      const aIncludes = aLower.includes(q) ? 1 : 0;
      const bIncludes = bLower.includes(q) ? 1 : 0;
      if (aIncludes !== bIncludes) return bIncludes - aIncludes;

      return a.localeCompare(b);
    }).filter((s) => s.toLowerCase().includes(q));
  }, [existingSeries, seriesSearchQuery]);

  // Filter characters to export based on user selection
  const charactersToExport = React.useMemo(() => {
    if (scope === 'all') {
      return characters;
    }
    if (scope === 'book') {
      if (!selectedBook) return [];
      return characters.filter((c) => {
        const charBooks = Array.isArray(c.books) ? c.books : (c.book ? [c.book] : []);
        return charBooks.some((b) => b.trim().toLowerCase() === selectedBook.trim().toLowerCase());
      });
    }
    if (scope === 'series') {
      if (!selectedSeries) return [];
      return characters.filter((c) => {
        const charSeries = getCharacterSeries(c, bookSeriesMap);
        return charSeries.some((s) => s.trim().toLowerCase() === selectedSeries.trim().toLowerCase());
      });
    }
    return characters;
  }, [characters, scope, selectedBook, selectedSeries, bookSeriesMap]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (charactersToExport.length === 0) return;

    const csvData = generateCharactersCsv(charactersToExport, bookSeriesMap);
    
    let filename = 'character-arc-all-characters.csv';
    if (scope === 'book' && selectedBook) {
      const cleanSlug = selectedBook.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      filename = `character-arc-book-${cleanSlug || 'export'}.csv`;
    } else if (scope === 'series' && selectedSeries) {
      const cleanSlug = selectedSeries.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      filename = `character-arc-series-${cleanSlug || 'export'}.csv`;
    }

    downloadCsvFile(csvData, filename);
    setHasExported(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto font-sans-ui">
      <div 
        className="relative w-full max-w-lg bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center border border-[#6D492A] dark:border-[#382312]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading tracking-wide">
                Export Characters to CSV
              </h2>
              <p className="text-xs text-[#CFB9A3] dark:text-[#A8927D]">
                Generate spreadsheet backups of your literary chronicles
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Scope Selector Options */}
          <div>
            <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider mb-2.5">
              Select Export Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option: All Characters */}
              <button
                type="button"
                id="export-scope-all-btn"
                onClick={() => setScope('all')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-[#EAE0D3] dark:bg-[#332013] border-[#8B5A36] dark:border-[#C49366] ring-2 ring-[#8B5A36]/30 shadow-xs'
                    : 'bg-[#F4ECE1] dark:bg-[#261910] border-[#D9C8B2] dark:border-[#422C1A] hover:border-[#BFAF9E]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Users className="w-4 h-4 text-[#8B5A36] dark:text-[#D49E6F]" />
                  {scope === 'all' && <Check className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />}
                </div>
                <span className="text-xs font-bold text-[#3D2310] dark:text-[#F4ECE1]">All Characters</span>
                <span className="text-[11px] text-[#7A614C] dark:text-[#A89481]">
                  {characters.length} total
                </span>
              </button>

              {/* Option: By Book */}
              <button
                type="button"
                id="export-scope-book-btn"
                onClick={() => setScope('book')}
                disabled={existingBooks.length === 0}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all disabled:opacity-40 cursor-pointer ${
                  scope === 'book'
                    ? 'bg-[#EAE0D3] dark:bg-[#332013] border-[#8B5A36] dark:border-[#C49366] ring-2 ring-[#8B5A36]/30 shadow-xs'
                    : 'bg-[#F4ECE1] dark:bg-[#261910] border-[#D9C8B2] dark:border-[#422C1A] hover:border-[#BFAF9E]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Book className="w-4 h-4 text-[#8B5A36] dark:text-[#D49E6F]" />
                  {scope === 'book' && <Check className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />}
                </div>
                <span className="text-xs font-bold text-[#3D2310] dark:text-[#F4ECE1]">By Book</span>
                <span className="text-[11px] text-[#7A614C] dark:text-[#A89481]">
                  {existingBooks.length} books available
                </span>
              </button>

              {/* Option: By Series */}
              <button
                type="button"
                id="export-scope-series-btn"
                onClick={() => setScope('series')}
                disabled={existingSeries.length === 0}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all disabled:opacity-40 cursor-pointer ${
                  scope === 'series'
                    ? 'bg-[#EAE0D3] dark:bg-[#332013] border-[#8B5A36] dark:border-[#C49366] ring-2 ring-[#8B5A36]/30 shadow-xs'
                    : 'bg-[#F4ECE1] dark:bg-[#261910] border-[#D9C8B2] dark:border-[#422C1A] hover:border-[#BFAF9E]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Library className="w-4 h-4 text-[#8B5A36] dark:text-[#D49E6F]" />
                  {scope === 'series' && <Check className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />}
                </div>
                <span className="text-xs font-bold text-[#3D2310] dark:text-[#F4ECE1]">By Series</span>
                <span className="text-[11px] text-[#7A614C] dark:text-[#A89481]">
                  {existingSeries.length} series available
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Search Box for Book Selection */}
          {scope === 'book' && (
            <div className="bg-[#F3EBE0] dark:bg-[#271910] p-4 rounded-xl border border-[#D8C7B2] dark:border-[#422B1A] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                  Search & Select Book:
                </label>
                {selectedBook && (
                  <span className="text-[11px] font-medium text-[#7A5538] dark:text-[#D4A373]">
                    Selected: <strong className="font-semibold">{selectedBook}</strong> ({getBookCharCount(selectedBook)} chars)
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B6B51] dark:text-[#A68971]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="export-book-search-input"
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="Type to search books (e.g. Dune, Fellowship, Hobbit)..."
                  className="w-full pl-9 pr-8 py-2 bg-[#FFFDF9] dark:bg-[#1E140C] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] focus:ring-1 focus:ring-[#734A28] rounded-lg text-sm text-[#382211] dark:text-[#F3ECE4] placeholder-[#9E8674] dark:placeholder-[#7A6451] outline-hidden shadow-inner"
                />
                {bookSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBookSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B6B51] hover:text-[#382211] dark:text-[#A68971] dark:hover:text-[#F3ECE4] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions List */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <p className="text-[11px] font-semibold text-[#8B6B51] dark:text-[#A68971] uppercase tracking-wider">
                  {bookSearchQuery ? 'Matching Books' : 'Available Books'}:
                </p>
                {rankedBooks.length === 0 ? (
                  <p className="text-xs text-[#8C6D53] dark:text-[#9A8472] italic py-2">
                    No books match "{bookSearchQuery}".
                  </p>
                ) : (
                  rankedBooks.map((b) => {
                    const isChosen = selectedBook.trim().toLowerCase() === b.trim().toLowerCase();
                    const count = getBookCharCount(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        id={`select-export-book-${b.replace(/[^a-zA-Z0-9]/g, '-')}`}
                        onClick={() => {
                          setSelectedBook(b);
                          setBookSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isChosen
                            ? 'bg-[#E7DAC9] dark:bg-[#382315] border-[#8B5A36] dark:border-[#C49366] text-[#331D0E] dark:text-[#FBF7F0] font-bold shadow-xs'
                            : 'bg-[#FAF5ED] dark:bg-[#1E140C] border-[#D8C7B0] dark:border-[#382312] text-[#4A301A] dark:text-[#D8C4B0] hover:bg-[#EFE6D8] dark:hover:bg-[#2B1B10]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Book className={`w-3.5 h-3.5 shrink-0 ${isChosen ? 'text-[#8B5A36] dark:text-[#D49E6F]' : 'text-[#8B7059] dark:text-[#99806A]'}`} />
                          <span className="truncate">{b}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isChosen
                              ? 'bg-[#D2BC9F] dark:bg-[#523520] text-[#3B220F] dark:text-[#F6ECE0]'
                              : 'bg-[#E7DBD0] dark:bg-[#2F1E13] text-[#694F3B] dark:text-[#B69F8B]'
                          }`}>
                            {count} {count === 1 ? 'char' : 'chars'}
                          </span>
                          {isChosen && <CheckCircle2 className="w-4 h-4 text-[#8B5A36] dark:text-[#C49366]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Interactive Search Box for Series Selection */}
          {scope === 'series' && (
            <div className="bg-[#F3EBE0] dark:bg-[#271910] p-4 rounded-xl border border-[#D8C7B2] dark:border-[#422B1A] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                  Search & Select Series:
                </label>
                {selectedSeries && (
                  <span className="text-[11px] font-medium text-[#7A5538] dark:text-[#D4A373]">
                    Selected: <strong className="font-semibold">{selectedSeries}</strong> ({getSeriesCharCount(selectedSeries)} chars)
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B6B51] dark:text-[#A68971]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="export-series-search-input"
                  type="text"
                  value={seriesSearchQuery}
                  onChange={(e) => setSeriesSearchQuery(e.target.value)}
                  placeholder="Type to search series (e.g. Lord of the Rings, Foundation)..."
                  className="w-full pl-9 pr-8 py-2 bg-[#FFFDF9] dark:bg-[#1E140C] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] focus:ring-1 focus:ring-[#734A28] rounded-lg text-sm text-[#382211] dark:text-[#F3ECE4] placeholder-[#9E8674] dark:placeholder-[#7A6451] outline-hidden shadow-inner"
                />
                {seriesSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSeriesSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B6B51] hover:text-[#382211] dark:text-[#A68971] dark:hover:text-[#F3ECE4] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions List */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <p className="text-[11px] font-semibold text-[#8B6B51] dark:text-[#A68971] uppercase tracking-wider">
                  {seriesSearchQuery ? 'Matching Book Series' : 'Available Book Series'}:
                </p>
                {rankedSeries.length === 0 ? (
                  <p className="text-xs text-[#8C6D53] dark:text-[#9A8472] italic py-2">
                    No series match "{seriesSearchQuery}".
                  </p>
                ) : (
                  rankedSeries.map((s) => {
                    const isChosen = selectedSeries.trim().toLowerCase() === s.trim().toLowerCase();
                    const count = getSeriesCharCount(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        id={`select-export-series-${s.replace(/[^a-zA-Z0-9]/g, '-')}`}
                        onClick={() => {
                          setSelectedSeries(s);
                          setSeriesSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isChosen
                            ? 'bg-[#E7DAC9] dark:bg-[#382315] border-[#8B5A36] dark:border-[#C49366] text-[#331D0E] dark:text-[#FBF7F0] font-bold shadow-xs'
                            : 'bg-[#FAF5ED] dark:bg-[#1E140C] border-[#D8C7B0] dark:border-[#382312] text-[#4A301A] dark:text-[#D8C4B0] hover:bg-[#EFE6D8] dark:hover:bg-[#2B1B10]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Library className={`w-3.5 h-3.5 shrink-0 ${isChosen ? 'text-[#8B5A36] dark:text-[#D49E6F]' : 'text-[#8B7059] dark:text-[#99806A]'}`} />
                          <span className="truncate">{s}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isChosen
                              ? 'bg-[#D2BC9F] dark:bg-[#523520] text-[#3B220F] dark:text-[#F6ECE0]'
                              : 'bg-[#E7DBD0] dark:bg-[#2F1E13] text-[#694F3B] dark:text-[#B69F8B]'
                          }`}>
                            {count} {count === 1 ? 'char' : 'chars'}
                          </span>
                          {isChosen && <CheckCircle2 className="w-4 h-4 text-[#8B5A36] dark:text-[#C49366]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Export Summary Box */}
          <div className="bg-[#EFE7DA] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#442E1C] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#DECEBC] dark:bg-[#3D2513] text-[#694223] dark:text-[#DDA675] shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-[#3E2411] dark:text-[#F5EDE3]">
                Ready to export {charactersToExport.length} {charactersToExport.length === 1 ? 'character' : 'characters'}
                {scope === 'book' && selectedBook ? ` from "${selectedBook}"` : ''}
                {scope === 'series' && selectedSeries ? ` from series "${selectedSeries}"` : ''}
              </p>
              <p className="text-[#6E5540] dark:text-[#A89481]">
                Columns included: <span className="font-mono text-[11px] text-[#54351B] dark:text-[#DFCBBA]">Name, Role, Books, Series, Description, Spoilers</span>
              </p>
              {charactersToExport.length > 0 && (
                <p className="text-[11px] text-[#8C6D53] dark:text-[#9A8472] italic truncate max-w-sm pt-0.5">
                  Sample: {charactersToExport.slice(0, 3).map((c) => c.name).join(', ')}
                  {charactersToExport.length > 3 ? ` + ${charactersToExport.length - 3} more` : ''}
                </p>
              )}
            </div>
          </div>

          {hasExported && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>CSV exported successfully! Download starting in your browser...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D5C2AA] dark:border-[#4E3420] text-[#54351B] dark:text-[#D1BAA3] hover:bg-[#EAE0D3] dark:hover:bg-[#2B1B10] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-export-csv-btn"
              onClick={handleExport}
              disabled={charactersToExport.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#84563C] hover:bg-[#966447] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
