import React from 'react';
import { 
  X, 
  Book, 
  Library, 
  Users, 
  Search, 
  Check, 
  Plus, 
  AlertCircle, 
  Feather,
  BookOpen,
  UserCheck,
  Sparkles
} from 'lucide-react';
import type { Character } from '../types';
import { CHARACTER_ROLES, EXCLUDED_ROLES } from '../types';
import { getCharacterSeries } from '../lib/grouping';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBook: (
    bookTitle: string,
    seriesName: string | string[] | undefined,
    selectedCharacterIds: string[],
    newCharacters?: { name: string; role?: string; description?: string }[]
  ) => Promise<void>;
  existingBooks: string[];
  existingSeries: string[];
  allCharacters: Character[];
  bookSeriesMap?: Record<string, string[]>;
  onRecordTagInteraction?: (type: 'book' | 'series', name: string) => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onSaveBook,
  existingBooks,
  existingSeries,
  allCharacters,
  bookSeriesMap = {},
  onRecordTagInteraction,
}) => {
  const [books, setBooks] = React.useState<string[]>([]);
  const [bookInput, setBookInput] = React.useState('');
  const [series, setSeries] = React.useState<string[]>([]);
  const [seriesInput, setSeriesInput] = React.useState('');
  const [filterBySeriesOnly, setFilterBySeriesOnly] = React.useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = React.useState<Set<string>>(new Set());
  const [characterSearch, setCharacterSearch] = React.useState('');
  
  // Quick inline new character state
  const [newCharName, setNewCharName] = React.useState('');
  const [newCharRole, setNewCharRole] = React.useState('');
  const [showCustomRoleInput, setShowCustomRoleInput] = React.useState(false);
  const [customRoleText, setCustomRoleText] = React.useState('');
  const [newCharactersList, setNewCharactersList] = React.useState<{ name: string; role?: string; description?: string }[]>([]);

  const bookTitleInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setBooks([]);
      setBookInput('');
      setSeries([]);
      setSeriesInput('');
      setFilterBySeriesOnly(false);
      setSelectedCharacterIds(new Set());
      setCharacterSearch('');
      setNewCharName('');
      setNewCharRole('');
      setShowCustomRoleInput(false);
      setCustomRoleText('');
      setNewCharactersList([]);
      setErrorMessage(null);

      // Focus and cursor in Book title box
      setTimeout(() => {
        bookTitleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Book tag management
  const handleAddBook = (bookTitleToAdd?: string) => {
    const raw = bookTitleToAdd !== undefined ? bookTitleToAdd : bookInput;
    if (!raw.trim()) return;

    const parsed = raw
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    if (parsed.length > 0) {
      setBooks((prev) => {
        const next = [...prev];
        parsed.forEach((item) => {
          if (!next.includes(item)) {
            next.push(item);
          }
        });
        return next;
      });

      parsed.forEach((b) => {
        onRecordTagInteraction?.('book', b);
        if (bookSeriesMap && Array.isArray(bookSeriesMap[b])) {
          bookSeriesMap[b].forEach((s) => onRecordTagInteraction?.('series', s));
        }
      });
    }

    // Always clear text entry box
    setBookInput('');
  };

  const handleRemoveBook = (indexToRemove: number) => {
    setBooks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Current active books (both tagged chips and any currently typed books)
  const parsedBooks = React.useMemo(() => {
    const list = [...books];
    if (bookInput.trim()) {
      const extra = bookInput
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
      extra.forEach((eb) => {
        if (!list.includes(eb)) {
          list.push(eb);
        }
      });
    }
    return list;
  }, [books, bookInput]);

  // Series tag management
  const handleAddSeries = (seriesTitleToAdd?: string) => {
    const raw = seriesTitleToAdd !== undefined ? seriesTitleToAdd : seriesInput;
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
      // If at least one Series is selected, the filter checkbox is ticked by default
      setFilterBySeriesOnly(true);

      parsed.forEach((s) => {
        onRecordTagInteraction?.('series', s);
      });
    }

    // Always clear text entry box
    setSeriesInput('');
  };

  const handleRemoveSeries = (indexToRemove: number) => {
    setSeries((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (next.length === 0) {
        setFilterBySeriesOnly(false);
      }
      return next;
    });
  };

  // Toggle selection of existing character
  const toggleCharacter = (charId: string) => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      if (next.has(charId)) {
        next.delete(charId);
      } else {
        next.add(charId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      filteredCharacters.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleSelectAllInSeries = () => {
    if (series.length === 0) return;
    const lowerSeriesList = series.map((s) => s.toLowerCase());
    const seriesChars = allCharacters.filter((c) => {
      const charSeries = getCharacterSeries(c, bookSeriesMap);
      return charSeries.some((s) => lowerSeriesList.includes(s.toLowerCase()));
    });
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      seriesChars.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedCharacterIds(new Set());
  };

  // Add inline new character
  const handleAddNewCharacter = () => {
    const trimmed = newCharName.trim();
    if (!trimmed) return;
    const targetBookDesc = parsedBooks.length > 0 ? parsedBooks.join(', ') : 'New Book';
    setNewCharactersList((prev) => [
      ...prev,
      {
        name: trimmed,
        role: newCharRole.trim() || 'Protagonist',
        description: `Character introduced in "${targetBookDesc}"`,
      },
    ]);
    setNewCharName('');
    setNewCharRole('');
    setShowCustomRoleInput(false);
    setCustomRoleText('');
  };

  const handleRemoveNewCharacter = (index: number) => {
    setNewCharactersList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // All character roles (NOT limited to 5) for quick character creation
  const availableRoles = React.useMemo(() => {
    const set = new Set<string>(CHARACTER_ROLES);
    if (allCharacters && allCharacters.length > 0) {
      allCharacters.forEach((c) => {
        if (c.role && c.role.trim() && !EXCLUDED_ROLES.has(c.role.trim().toLowerCase())) {
          set.add(c.role.trim());
        }
      });
    }
    if (newCharRole && newCharRole.trim() && !EXCLUDED_ROLES.has(newCharRole.trim().toLowerCase())) {
      set.add(newCharRole.trim());
    }
    return Array.from(set);
  }, [allCharacters, newCharRole]);

  // Filter existing characters (Search + optional Series filter)
  const filteredCharacters = allCharacters.filter((char) => {
    const charSeries = getCharacterSeries(char, bookSeriesMap);

    // Check series filter if active
    if (filterBySeriesOnly && series.length > 0) {
      const lowerSeriesList = series.map((s) => s.toLowerCase());
      const hasSeries = charSeries.some((s) => lowerSeriesList.includes(s.toLowerCase()));
      if (!hasSeries) return false;
    }

    if (!characterSearch.trim()) return true;
    const q = characterSearch.toLowerCase().trim();
    const nameMatch = char.name.toLowerCase().includes(q);
    const roleMatch = char.role ? char.role.toLowerCase().includes(q) : false;
    const booksMatch = Array.isArray(char.books) && char.books.some((b) => b.toLowerCase().includes(q));
    const seriesMatch = charSeries.some((s) => s.toLowerCase().includes(q));
    return nameMatch || roleMatch || booksMatch || seriesMatch;
  });

  const seriesCharacterCount = series.length > 0
    ? allCharacters.filter((c) => {
        const lowerSeriesList = series.map((s) => s.toLowerCase());
        const charSeries = getCharacterSeries(c, bookSeriesMap);
        return charSeries.some((s) => lowerSeriesList.includes(s.toLowerCase()));
      }).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalBooks = [...books];
    if (bookInput.trim()) {
      const extraBooks = bookInput
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
      extraBooks.forEach((eb) => {
        if (!finalBooks.includes(eb)) {
          finalBooks.push(eb);
        }
      });
    }

    if (finalBooks.length === 0) {
      setErrorMessage('Please enter at least one book title.');
      return;
    }

    const selectedIds = Array.from(selectedCharacterIds);
    if (selectedIds.length === 0 && newCharactersList.length === 0) {
      setErrorMessage('Please select at least one character to add to this book, or create a new character below.');
      return;
    }

    // Auto-commit any pending typed series
    let finalSeries = [...series];
    if (seriesInput.trim()) {
      const extraSeries = seriesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      extraSeries.forEach((es) => {
        if (!finalSeries.includes(es)) {
          finalSeries.push(es);
        }
      });
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      finalBooks.forEach((b) => onRecordTagInteraction?.('book', b));
      finalSeries.forEach((s) => onRecordTagInteraction?.('series', s));

      await onSaveBook(
        finalBooks.join(', '),
        finalSeries.length > 0 ? finalSeries : undefined,
        selectedIds,
        newCharactersList
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to save book and attach characters:', err);
      setErrorMessage(err.message || 'Failed to save book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Book title suggestions (filter out already tagged ones, prioritize startsWith, max 5)
  const activeBookQuery = (
    bookInput.includes(',') ? bookInput.split(',').pop() || '' : bookInput
  ).trim().toLowerCase();

  const bookSuggestions = existingBooks
    .filter((b) => {
      if (books.includes(b)) return false;
      if (!activeBookQuery) return true;
      return b.toLowerCase().includes(activeBookQuery);
    })
    .sort((a, b) => {
      if (!activeBookQuery) return 0;
      const aStarts = a.toLowerCase().startsWith(activeBookQuery);
      const bStarts = b.toLowerCase().startsWith(activeBookQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 5);

  // Series suggestions (filter out already tagged ones, prioritize startsWith, max 5)
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

  const selectedCount = selectedCharacterIds.size + newCharactersList.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center border border-[#6D492A] dark:border-[#382312]">
              <Book className="w-4 h-4 text-[#E7D2BC]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading tracking-wide">
                Add Book & Assign Characters
              </h2>
              <p className="text-xs text-[#D6C4B0] dark:text-[#9F8873] font-sans-ui">
                Create one or multiple books (separated by commas) and assign characters
              </p>
            </div>
          </div>
          <button
            id="close-add-book-modal-btn"
            onClick={onClose}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 font-sans-ui overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-[#FBEAE8] dark:bg-[#3A1410] border border-[#E8ADA7] dark:border-[#6B241C] rounded-lg text-xs text-[#9B2C1E] dark:text-[#F08B7F] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Book Title(s) Field with Tag System & Multi-Book Support */}
          <div className="bg-[#F2EAE0] dark:bg-[#24170E] p-3.5 rounded-xl border border-[#D8C7B2] dark:border-[#3E2919] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Book className="w-3.5 h-3.5 text-[#7A4B29] dark:text-[#C78B55]" />
                <span>Book Title(s) <span className="text-[#9E2A1E] dark:text-[#E06758]">*</span></span>
              </label>
              <span className="text-[11px] text-[#7A5A43] dark:text-[#A68F7B]">
                Type title & click Add or pick suggestions below
              </span>
            </div>

            {/* Selected Book Tags */}
            {books.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {books.map((b, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EADCCB] dark:bg-[#382314] text-[#4E311A] dark:text-[#E8D4C1] text-xs font-semibold border border-[#D5C0A8] dark:border-[#4E3420] shadow-xs"
                  >
                    <BookOpen className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F]" />
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(idx)}
                      className="hover:text-[#9E2A1E] dark:hover:text-[#FFA99F] p-0.5 rounded-full cursor-pointer transition-colors"
                      title="Remove book"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Book input */}
            <div className="flex gap-2">
              <input
                ref={bookTitleInputRef}
                id="new-book-title-input"
                type="text"
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddBook();
                  }
                }}
                placeholder="Type book title(s), separated by commas, and click '+ Add Book'..."
                className="flex-1 px-3 py-2 bg-[#FFFDF9] dark:bg-[#2B1C12] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleAddBook()}
                disabled={!bookInput.trim()}
                className="px-3 py-2 bg-[#734A28] hover:bg-[#8D582D] text-[#FAF4EC] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
              >
                + Add Book
              </button>
            </div>

            {/* Book Title Suggestions */}
            {bookSuggestions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-[#846C56] dark:text-[#8E7966] text-xs font-medium">
                  {activeBookQuery ? 'Matching Books:' : 'Book Suggestions:'}
                </span>
                {bookSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddBook(sug)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E4D7C7] dark:bg-[#331F11] hover:bg-[#D5C4B0] dark:hover:bg-[#452B18] text-[#553821] dark:text-[#D1B8A0] border border-[#CBB9A4] dark:border-[#4A301B] transition-colors cursor-pointer text-xs"
                    title={`Click to add "${sug}"`}
                  >
                    <Plus className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F]" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            ) : (
              activeBookQuery && (
                <div className="pt-1 text-[11px] text-[#8C705B] dark:text-[#9A8472] italic">
                  No existing books matching "{activeBookQuery}". Press Enter or click "+ Add Book" to add it.
                </div>
              )
            )}
          </div>

          {/* Book Series Field with Tag System & Multi-Series Support */}
          <div className="bg-[#F2EAE0] dark:bg-[#24170E] p-3.5 rounded-xl border border-[#D8C7B2] dark:border-[#3E2919] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Library className="w-3.5 h-3.5 text-[#7A4B29] dark:text-[#C78B55]" />
                <span>Book Series (Add Multiple Series as Tags)</span>
                <span className="text-[10px] lowercase font-normal text-[#8A715C] dark:text-[#9E8672]">(optional)</span>
              </label>
            </div>

            {/* Selected Series Tags */}
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
            
            {/* Series Input for typing custom series tags */}
            <div className="flex gap-2">
              <input
                id="new-book-series-input"
                type="text"
                value={seriesInput}
                onChange={(e) => setSeriesInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSeries();
                  } else if (e.key === ',') {
                    e.preventDefault();
                    handleAddSeries();
                  }
                }}
                placeholder="Type a series name and press Enter or click '+ Tag Series'..."
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

            {/* Quick Series Tag Suggestions */}
            {seriesSuggestions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-[#846C56] dark:text-[#8E7966] text-xs font-medium">
                  {activeSeriesQuery ? 'Matching Series:' : 'Series Suggestions:'}
                </span>
                {seriesSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddSeries(sug)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E4D7C7] dark:bg-[#331F11] hover:bg-[#D5C4B0] dark:hover:bg-[#452B18] text-[#553821] dark:text-[#D1B8A0] border border-[#CBB9A4] dark:border-[#4A301B] transition-colors cursor-pointer text-xs"
                    title={`Click to add "${sug}" as a series tag`}
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

            {/* Filter Characters by Selected Series Option (Default ticked when at least one series selected) */}
            {series.length > 0 && (
              <div className="pt-2 border-t border-[#DFCEBB] dark:border-[#382312] flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#52331B] dark:text-[#E2CBB4]">
                  <input
                    type="checkbox"
                    checked={filterBySeriesOnly}
                    onChange={(e) => setFilterBySeriesOnly(e.target.checked)}
                    className="rounded text-[#664327] focus:ring-[#7D5331]"
                  />
                  <span>
                    Filter character list to selected series ({seriesCharacterCount} characters found)
                  </span>
                </label>

                {seriesCharacterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllInSeries}
                    className="text-xs px-2.5 py-1 rounded bg-[#DFD0BD] dark:bg-[#382414] hover:bg-[#D1C0AB] dark:hover:bg-[#482E19] text-[#4E311A] dark:text-[#FAF6F0] font-semibold transition-colors cursor-pointer"
                  >
                    + Select All in Selected Series
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search & Select Multiple Characters */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-[#7A4B29] dark:text-[#C78B55]" />
                <span>Select Characters in {parsedBooks.length > 1 ? 'These Books' : 'this Book'}</span>
                <span className="text-[#9E2A1E] dark:text-[#E06758]">*</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#543319] dark:text-[#E8D4C1] bg-[#E8DCCB] dark:bg-[#2C1C11] px-2 py-0.5 rounded-md border border-[#D0C0AC] dark:border-[#442B17]">
                  {selectedCount} selected
                </span>
                {filteredCharacters.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[#734A28] dark:text-[#D49E6F] hover:underline cursor-pointer font-medium"
                  >
                    Select All ({filteredCharacters.length})
                  </button>
                )}
                {selectedCharacterIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[#9E2A1E] dark:text-[#E06758] hover:underline cursor-pointer font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter / Search input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A715C] dark:text-[#8E7864]">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-characters-for-book-input"
                type="text"
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                placeholder="Search characters by name, role, book, or series..."
                className="w-full pl-9 pr-8 py-2 bg-[#FFFDF9] dark:bg-[#291B11] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
              />
              {characterSearch && (
                <button
                  type="button"
                  onClick={() => setCharacterSearch('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8A715C] hover:text-[#382211] dark:hover:text-[#FAF6F0]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selected Characters Pills */}
            {(selectedCharacterIds.size > 0 || newCharactersList.length > 0) && (
              <div className="p-2.5 bg-[#EDE2D2] dark:bg-[#25170E] rounded-lg border border-[#D8C7B0] dark:border-[#3D2616] flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {Array.from(selectedCharacterIds).map((id: string) => {
                  const char = allCharacters.find((c) => c.id === id);
                  if (!char) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#664327] dark:bg-[#8D582D] text-[#FAF6F0] text-xs font-medium shadow-xs"
                    >
                      <UserCheck className="w-3 h-3 text-[#EED8C5]" />
                      <span className="truncate max-w-[150px]">{char.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleCharacter(id)}
                        className="hover:text-[#FFA99F] p-0.5 rounded-full cursor-pointer"
                        title="Remove selection"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {newCharactersList.map((nc, idx) => (
                  <span
                    key={`new-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#4E5C31] dark:bg-[#5C7036] text-[#FAF6F0] text-xs font-medium shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{nc.name} (New)</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewCharacter(idx)}
                      className="hover:text-[#FFA99F] p-0.5 rounded-full cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Characters Checklist */}
            <div className="border border-[#D5C2AA] dark:border-[#422C1A] rounded-xl bg-[#FFFDF9] dark:bg-[#23170E] max-h-48 overflow-y-auto divide-y divide-[#EAE0D3] dark:divide-[#332014] shadow-inner">
              {filteredCharacters.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8A715C] dark:text-[#A68F7B]">
                  {allCharacters.length === 0
                    ? 'No characters in journal yet. You can create a new character below!'
                    : filterBySeriesOnly && series.length > 0
                    ? `No characters found in selected series. Uncheck the series filter or create a new character below.`
                    : `No characters matching "${characterSearch}"`}
                </div>
              ) : (
                filteredCharacters.map((char) => {
                  const isSelected = selectedCharacterIds.has(char.id);
                  const charBooks = Array.isArray(char.books) ? char.books : (char.book ? [char.book] : []);
                  const charSeries = getCharacterSeries(char, bookSeriesMap);

                  return (
                    <label
                      key={char.id}
                      className={`flex items-center justify-between p-2.5 cursor-pointer select-none transition-colors ${
                        isSelected
                          ? 'bg-[#F4ECE0] dark:bg-[#332013]'
                          : 'hover:bg-[#FAF4EB] dark:hover:bg-[#2B1B10]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Checkbox */}
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[#664327] border-[#4A2D16] text-[#FAF6F0]'
                              : 'border-[#BAA58F] dark:border-[#523A25] bg-[#FFFFFF] dark:bg-[#1C120A]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Name, Role, and Series/Books tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#382211] dark:text-[#F3ECE4] truncate">
                              {char.name}
                            </span>
                            {char.role && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#E5DACE] dark:bg-[#3D2919] text-[#553820] dark:text-[#D5BEA8]">
                                {char.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#866D57] dark:text-[#9F8873] truncate">
                            {charSeries.length > 0 && (
                              <span className="text-[#7A6B34] dark:text-[#D4B96F]">
                                Series: {charSeries.join(', ')}
                              </span>
                            )}
                            {charBooks.length > 0 && (
                              <span>
                                {charSeries.length > 0 ? '• ' : ''}Books: {charBooks.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => toggleCharacter(char.id)}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Inline New Character Creation */}
          <div className="bg-[#EFE5D7] dark:bg-[#24170E] p-3.5 rounded-xl border border-[#D5C2AA] dark:border-[#3E2818] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Plus className="w-3.5 h-3.5 text-[#5F4024] dark:text-[#C78B55]" />
                <span>Add a Brand New Character to {parsedBooks.length > 1 ? 'These Books' : 'this Book'}</span>
              </label>
              {newCharRole && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-[#7A5B3E] dark:text-[#BA9B7D]">Selected Role:</span>
                  <span className="font-bold text-[#4D2F15] dark:text-[#F3ECE4] bg-[#E0CFBD] dark:bg-[#382312] px-2 py-0.5 rounded-md text-xs">
                    {newCharRole}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewCharRole('')}
                    className="text-[11px] text-[#A63C2E] dark:text-[#E87569] hover:underline cursor-pointer ml-1"
                    title="Clear selected role"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="inline-new-character-name"
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCharacter();
                  }
                }}
                placeholder="Character name (e.g. Samwise Gamgee)"
                className="flex-1 px-3 py-2 bg-[#FFFDF9] dark:bg-[#2B1C12] border border-[#D5C2AA] dark:border-[#4E3420] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
              />
              <button
                type="button"
                onClick={handleAddNewCharacter}
                disabled={!newCharName.trim()}
                className="px-4 py-2 bg-[#664327] hover:bg-[#7D5331] text-[#FAF6F0] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
              >
                + Add Character
              </button>
            </div>

            {/* Character Role Selection: Click & Highlight, all options, not limited to 5 */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-[#634327] dark:text-[#C7A380] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Select Character Role:</span>
                <span className="text-[10px] lowercase font-normal text-[#8A715C] dark:text-[#9E8672]">
                  {newCharRole ? 'click active to deselect' : 'click to assign'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Character Role selection">
                {availableRoles.map((r) => {
                  const isSelected = newCharRole.trim().toLowerCase() === r.toLowerCase();
                  return (
                    <button
                      key={r}
                      id={`inline-role-btn-${r.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => setNewCharRole(isSelected ? '' : r)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none border shadow-xs active:scale-[0.97] ${
                        isSelected
                          ? 'bg-[#5C371B] dark:bg-[#C48749] text-[#FFFDF9] dark:text-[#180E07] border-[#442710] dark:border-[#E8A564] ring-2 ring-[#704624]/30 dark:ring-[#C48749]/40 font-bold'
                          : 'bg-[#FFFDF9] dark:bg-[#1E140C] text-[#553820] dark:text-[#D1BEAA] hover:bg-[#F6EFE5] dark:hover:bg-[#2B1B10] border-[#D5C2AA] dark:border-[#472E1B]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3] text-[#FFFDF9] dark:text-[#180E07]" />}
                      <span>{r}</span>
                    </button>
                  );
                })}

                {/* Custom Role Option */}
                <button
                  type="button"
                  onClick={() => setShowCustomRoleInput((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#704C2E] dark:text-[#C49E7C] border border-dashed border-[#C5B09A] dark:border-[#523A25] hover:bg-[#E2D4C2] dark:hover:bg-[#332014] transition-colors cursor-pointer"
                  title="Enter a custom role"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom...</span>
                </button>
              </div>

              {/* Inline Custom Role Input if opened */}
              {showCustomRoleInput && (
                <div className="flex gap-2 pt-2">
                  <input
                    id="inline-custom-role-input"
                    type="text"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customRoleText.trim()) {
                          setNewCharRole(customRoleText.trim());
                          setCustomRoleText('');
                          setShowCustomRoleInput(false);
                        }
                      }
                    }}
                    placeholder="Type custom role (e.g. Healer)..."
                    className="flex-1 px-3 py-1.5 bg-[#FFFDF9] dark:bg-[#1C120B] border border-[#D5C2AA] dark:border-[#4E3420] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customRoleText.trim()) {
                        setNewCharRole(customRoleText.trim());
                        setCustomRoleText('');
                        setShowCustomRoleInput(false);
                      }
                    }}
                    disabled={!customRoleText.trim()}
                    className="px-3 py-1.5 bg-[#664327] hover:bg-[#7D5331] text-[#FAF6F0] rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Set Role
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#DCCBB5] dark:border-[#382312] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#E2D6C5] dark:bg-[#2D1C11] hover:bg-[#D5C6B2] dark:hover:bg-[#3D2516] text-[#4F331A] dark:text-[#D8C4B0] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-book-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#664327] hover:bg-[#7D5331] dark:bg-[#A86E3E] dark:hover:bg-[#BC7E49] text-[#FAF6F0] dark:text-[#180E07] text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Book className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : parsedBooks.length > 1 ? `Save ${parsedBooks.length} Books & Characters` : 'Save Book & Characters'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
