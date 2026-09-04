import React from 'react';
import { Pencil, Book, X, AlertCircle, Library, Plus } from 'lucide-react';

interface EditBookModalProps {
  isOpen: boolean;
  bookTitle: string;
  characterCount: number;
  initialSeries?: string[];
  existingSeries?: string[];
  onClose: () => void;
  onSave: (oldTitle: string, newTitle: string, seriesList?: string[]) => Promise<void>;
  onRecordTagInteraction?: (type: 'book' | 'series', name: string) => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  bookTitle,
  characterCount,
  initialSeries = [],
  existingSeries = [],
  onClose,
  onSave,
  onRecordTagInteraction,
}) => {
  const [newTitle, setNewTitle] = React.useState('');
  const [series, setSeries] = React.useState<string[]>([]);
  const [seriesInput, setSeriesInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const lastOpenedBookRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (lastOpenedBookRef.current !== bookTitle) {
        lastOpenedBookRef.current = bookTitle;
        setNewTitle(bookTitle);
        setSeries([...initialSeries]);
        setSeriesInput('');
        setError(null);
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
      }
    } else {
      lastOpenedBookRef.current = null;
    }
  }, [isOpen, bookTitle, initialSeries]);

  if (!isOpen) return null;

  const handleAddSeries = (seriesToAdd?: string) => {
    const raw = seriesToAdd !== undefined ? seriesToAdd : seriesInput;
    if (!raw.trim()) return;

    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsed.length > 0) {
      setSeries((prev) => {
        const next = [...prev];
        parsed.forEach((item) => {
          if (!next.includes(item)) {
            next.push(item);
          }
        });
        return next;
      });

      parsed.forEach((s) => {
        onRecordTagInteraction?.('series', s);
      });
    }

    // Always clear the text entry box when clicking a tag or adding typed text
    setSeriesInput('');
  };

  const handleRemoveSeries = (idxToRemove: number) => {
    setSeries((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newTitle.trim();

    if (!cleanNew) {
      setError('Book title cannot be blank.');
      return;
    }

    let finalSeries = [...series];
    if (seriesInput.trim()) {
      const extra = seriesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      extra.forEach((es) => {
        if (!finalSeries.includes(es)) {
          finalSeries.push(es);
        }
      });
    }

    try {
      setIsSaving(true);
      setError(null);

      finalSeries.forEach((s) => onRecordTagInteraction?.('series', s));
      onRecordTagInteraction?.('book', cleanNew);

      await onSave(bookTitle, cleanNew, finalSeries);
      onClose();
    } catch (err: any) {
      console.error('Failed to update book:', err);
      setError(err?.message || 'Failed to update book. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter series suggestions by typed query
  const activeSeriesQuery = (
    seriesInput.includes(',') ? seriesInput.split(',').pop() || '' : seriesInput
  ).trim().toLowerCase();

  const seriesSuggestions = existingSeries
    .filter((s) => {
      if (series.includes(s)) return false;
      if (!activeSeriesQuery) return true;
      return s.toLowerCase().includes(activeSeriesQuery);
    })
    .sort((a, b) => {
      if (!activeSeriesQuery) return 0;
      const aStarts = a.toLowerCase().startsWith(activeSeriesQuery);
      const bStarts = b.toLowerCase().startsWith(activeSeriesQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 5);

  return (
    <div
      id="edit-book-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="edit-book-modal-dialog"
        className="relative w-full max-w-lg bg-[#FCFAF6] dark:bg-[#1E140C] text-[#38200F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#734A29] dark:bg-[#8D582D] text-[#FAF4EC] flex items-center justify-center border border-[#91623B] dark:border-[#AB7343]">
              <Pencil className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider font-heading text-[#FAF5EE]">
              Edit Book & Series
            </span>
          </div>
          <button
            id="close-edit-book-modal-btn"
            onClick={onClose}
            disabled={isSaving}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 font-sans-ui">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FBEAE8] dark:bg-[#3B1713] border border-[#E8ADA7] dark:border-[#6B2820] rounded-lg text-xs text-[#9B2C1E] dark:text-[#F29489]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="edit-book-title-input"
              className="block text-xs font-bold uppercase tracking-wider text-[#5C3E27] dark:text-[#D8BA9A]"
            >
              Book Title
            </label>
            <div className="relative">
              <input
                id="edit-book-title-input"
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. The Fellowship of the Ring"
                disabled={isSaving}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FFFDF9] dark:bg-[#25180F] border-2 border-[#D6C4AD] dark:border-[#4A3220] focus:border-[#734B28] dark:focus:border-[#C49366] focus:ring-2 focus:ring-[#C79D77]/40 rounded-lg text-[#331E10] dark:text-[#F6EFE5] placeholder-[#9E8674] text-sm font-sans-ui transition-all outline-hidden shadow-inner"
              />
              <Book className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C623E] dark:text-[#C49366]" />
            </div>
            <p className="text-xs text-[#7A614D] dark:text-[#A68F7B] pt-1">
              Updating this title will automatically update all references in the details of the{' '}
              <strong className="font-semibold text-[#482A14] dark:text-[#F3ECE4]">
                {characterCount} {characterCount === 1 ? 'character' : 'characters'}
              </strong>{' '}
              associated with this book.
            </p>
          </div>

          {/* Book Series Section */}
          <div className="bg-[#F2EAE0] dark:bg-[#24170E] p-3.5 rounded-xl border border-[#D8C7B2] dark:border-[#3E2919] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Library className="w-3.5 h-3.5 text-[#7A4B29] dark:text-[#C78B55]" />
                <span>Book Series Tags</span>
              </label>
            </div>

            {/* Current Series Tags */}
            {series.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {series.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAD5C3] dark:bg-[#381F14] text-[#4A1D0E] dark:text-[#FAD8C8] text-xs font-semibold border border-[#CCA78E] dark:border-[#5E3220] shadow-xs"
                  >
                    <Library className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F]" />
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeries(idx)}
                      className="hover:text-[#9E2A1E] dark:hover:text-[#FFA99F] p-0.5 rounded-full cursor-pointer transition-colors"
                      title="Remove series tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Series Input */}
            <div className="flex gap-2">
              <input
                id="edit-book-series-input"
                type="text"
                value={seriesInput}
                onChange={(e) => setSeriesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSeries();
                  }
                }}
                placeholder="Add to series (e.g. Dune Chronicles) and press Enter..."
                className="flex-1 px-3 py-2 bg-[#FFFDF9] dark:bg-[#2B1C12] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleAddSeries()}
                disabled={!seriesInput.trim()}
                className="px-3 py-2 bg-[#734A28] hover:bg-[#8D582D] text-[#FAF4EC] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
              >
                + Tag Series
              </button>
            </div>

            {/* Series Suggestions */}
            {seriesSuggestions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-[#846C56] dark:text-[#8E7966] text-xs font-medium">
                  {activeSeriesQuery ? 'Matching Series:' : 'Existing Series:'}
                </span>
                {seriesSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddSeries(sug)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E4D7C7] dark:bg-[#331F11] hover:bg-[#D5C4B0] dark:hover:bg-[#452B18] text-[#553821] dark:text-[#D1B8A0] border border-[#CBB9A4] dark:border-[#4A301B] transition-colors cursor-pointer text-xs"
                  >
                    <Plus className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F]" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            ) : (
              activeSeriesQuery && (
                <div className="pt-1 text-[11px] text-[#8C705B] dark:text-[#9A8472] italic">
                  No existing series matching "{activeSeriesQuery}". Click "+ Tag Series" or press Enter to add.
                </div>
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-edit-book-btn"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#EDE2D2] hover:bg-[#E0D2BE] dark:bg-[#332013] dark:hover:bg-[#422B19] text-[#4A2D17] dark:text-[#E8D4C1] text-xs font-semibold border border-[#CEBAA2] dark:border-[#4E3420] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-edit-book-btn"
              type="submit"
              disabled={isSaving || !newTitle.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6D4C2B] hover:bg-[#57391C] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FFFDF9] dark:text-[#180E07] text-xs font-bold uppercase tracking-wider shadow-md transition-all border border-[#4D3016] dark:border-[#C68A57] disabled:opacity-60 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Book'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
