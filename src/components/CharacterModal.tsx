import React from 'react';
import { 
  X, 
  Feather, 
  AlertCircle, 
  Plus, 
  Book,
  BookOpen, 
  Library,
  AlertTriangle,
  EyeOff,
  Lock,
  FileText,
  Check
} from 'lucide-react';
import type { Character } from '../types';
import { CHARACTER_ROLES, EXCLUDED_ROLES } from '../types';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Character | null;
  defaultBook?: string;
  defaultSeries?: string;
  existingBooks: string[];
  existingSeries?: string[];
  bookSeriesMap?: Record<string, string[]>;
  allCharacters?: Character[];
  onRecordTagInteraction?: (type: 'book' | 'series', name: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultBook = '',
  existingBooks,
  existingSeries = [],
  bookSeriesMap = {},
  allCharacters = [],
  onRecordTagInteraction,
}) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [spoilers, setSpoilers] = React.useState('');
  const [books, setBooks] = React.useState<string[]>([]);
  const [role, setRole] = React.useState('');
  const [showCustomRoleInput, setShowCustomRoleInput] = React.useState(false);
  const [customRoleText, setCustomRoleText] = React.useState('');

  // Input field for adding new books
  const [bookInput, setBookInput] = React.useState('');

  // Spoiler box show/hide state (same system as reader views)
  const [isSpoilerRevealed, setIsSpoilerRevealed] = React.useState(false);
  const [isPressingSpoiler, setIsPressingSpoiler] = React.useState(false);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = React.useRef(false);

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const spoilerInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      // The spoiler area is closed by default
      setIsSpoilerRevealed(false);
      setIsPressingSpoiler(false);
      setShowCustomRoleInput(false);
      setCustomRoleText('');
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setSpoilers(initialData.spoilers || '');
        
        // Populate books array (support new array format and legacy string)
        if (Array.isArray(initialData.books) && initialData.books.length > 0) {
          setBooks([...initialData.books]);
        } else if (initialData.book && initialData.book.trim()) {
          setBooks([initialData.book.trim()]);
        } else {
          setBooks([]);
        }

        setRole(initialData.role || '');
      } else {
        setName('');
        setDescription('');
        setSpoilers('');
        setBooks(defaultBook ? [defaultBook.trim()] : []);
        setRole('');
      }
      setBookInput('');
      setErrorMessage(null);

      // Focus Character Name box when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialData, defaultBook]);

  // When spoiler is opened, move cursor and focus to spoiler box
  React.useEffect(() => {
    if (isOpen && isSpoilerRevealed) {
      setTimeout(() => {
        if (spoilerInputRef.current) {
          spoilerInputRef.current.focus();
          const len = spoilerInputRef.current.value.length;
          spoilerInputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  }, [isSpoilerRevealed, isOpen]);

  // Book tag management
  const handleAddBook = (bookTitleToAdd?: string) => {
    const raw = bookTitleToAdd !== undefined ? bookTitleToAdd : bookInput;
    if (!raw.trim()) return;

    // Support comma-separated multiple books
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

      // Record interaction timestamp for the added books and their series
      parsed.forEach((b) => {
        onRecordTagInteraction?.('book', b);
        const associatedSeries = getSeriesForBook(b);
        associatedSeries.forEach((s) => onRecordTagInteraction?.('series', s));
      });
    }

    // When clicking a tag suggestion (bookTitleToAdd !== undefined), leave the text in the box as requested.
    // When adding via the "+ Add" button or Enter key (bookTitleToAdd === undefined), clear the text input.
    if (bookTitleToAdd === undefined) {
      setBookInput('');
    }
  };

  const handleRemoveBook = (indexToRemove: number) => {
    setBooks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a character name.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a description of the character.');
      return;
    }

    // Clear the book text box when Update / Save Character is clicked
    setBookInput('');

    // Save only explicitly added book tags (do NOT auto-add whatever text was left in the text box)
    const finalBooks = [...books];

    if (finalBooks.length > 0) {
      finalBooks.forEach((b) => {
        onRecordTagInteraction?.('book', b);
        const associatedSeries = getSeriesForBook(b);
        associatedSeries.forEach((s) => onRecordTagInteraction?.('series', s));
      });
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        spoilers: spoilers.trim(),
        books: finalBooks,
        role: role.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save character. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Press and hold logic for spoiler toggle (same system as reader views)
  const startSpoilerPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isLongPressTriggeredRef.current = false;
    setIsPressingSpoiler(true);

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsSpoilerRevealed((prev) => !prev);
      setIsPressingSpoiler(false);
    }, 400);
  };

  const endSpoilerPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressingSpoiler(false);
  };

  const handleSpoilerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    setIsSpoilerRevealed((prev) => !prev);
  };

  // Filter book suggestions: match books whose titles fit what has been typed so far,
  // AND also match books that belong to any series fitting what has been typed so far.
  const activeBookQuery = (
    bookInput.includes(',') ? bookInput.split(',').pop() || '' : bookInput
  ).trim().toLowerCase();

  // Helper to retrieve all series for any given book title
  const getSeriesForBook = React.useCallback(
    (bookTitle: string): string[] => {
      const clean = bookTitle.trim();
      const sSet = new Set<string>();
      if (bookSeriesMap && Array.isArray(bookSeriesMap[clean])) {
        bookSeriesMap[clean].forEach((s) => {
          if (s && s.trim()) sSet.add(s.trim());
        });
      }
      if (allCharacters && allCharacters.length > 0) {
        allCharacters.forEach((c) => {
          const cBooks = Array.isArray(c.books) && c.books.length > 0 ? c.books : (c.book ? [c.book] : []);
          if (cBooks.includes(clean) && Array.isArray(c.series)) {
            c.series.forEach((s) => {
              if (s && s.trim()) sSet.add(s.trim());
            });
          }
        });
      }
      return Array.from(sSet);
    },
    [bookSeriesMap, allCharacters]
  );

  // Collect candidate books from existingBooks and bookSeriesMap
  const allCandidateBooks = React.useMemo(() => {
    const set = new Set<string>(existingBooks);
    if (bookSeriesMap) {
      Object.keys(bookSeriesMap).forEach((b) => {
        if (b && b.trim()) set.add(b.trim());
      });
    }
    return Array.from(set);
  }, [existingBooks, bookSeriesMap]);

  interface BookSuggestionItem {
    title: string;
    matchedBySeries: boolean;
    seriesNames: string[];
    matchingSeriesName?: string;
  }

  const bookSuggestions = React.useMemo(() => {
    const list: BookSuggestionItem[] = [];

    allCandidateBooks.forEach((bookTitle) => {
      // Don't suggest books already added to this character
      if (books.includes(bookTitle)) return;

      const seriesList = getSeriesForBook(bookTitle);

      if (!activeBookQuery) {
        list.push({
          title: bookTitle,
          matchedBySeries: false,
          seriesNames: seriesList,
        });
        return;
      }

      const titleMatches = bookTitle.toLowerCase().includes(activeBookQuery);
      const matchingSeries = seriesList.find((s) =>
        s.toLowerCase().includes(activeBookQuery)
      );

      if (titleMatches || matchingSeries) {
        list.push({
          title: bookTitle,
          matchedBySeries: !titleMatches && !!matchingSeries,
          seriesNames: seriesList,
          matchingSeriesName: matchingSeries,
        });
      }
    });

    return list
      .sort((a, b) => {
        if (!activeBookQuery) return 0;

        const aTitleStarts = a.title.toLowerCase().startsWith(activeBookQuery);
        const bTitleStarts = b.title.toLowerCase().startsWith(activeBookQuery);
        if (aTitleStarts && !bTitleStarts) return -1;
        if (!aTitleStarts && bTitleStarts) return 1;

        const aTitleIncludes = a.title.toLowerCase().includes(activeBookQuery);
        const bTitleIncludes = b.title.toLowerCase().includes(activeBookQuery);
        if (aTitleIncludes && !bTitleIncludes) return -1;
        if (!aTitleIncludes && bTitleIncludes) return 1;

        if (a.matchingSeriesName && !b.matchingSeriesName) return -1;
        if (!a.matchingSeriesName && b.matchingSeriesName) return 1;

        return a.title.localeCompare(b.title);
      })
      .slice(0, 5);
  }, [allCandidateBooks, books, activeBookQuery, getSeriesForBook]);

  // All character role options (NOT limited to 5). Combines standard roles, library roles, initialData, and current role
  const availableRoles = React.useMemo(() => {
    const set = new Set<string>(CHARACTER_ROLES);
    if (allCharacters && allCharacters.length > 0) {
      allCharacters.forEach((c) => {
        if (c.role && c.role.trim() && !EXCLUDED_ROLES.has(c.role.trim().toLowerCase())) {
          set.add(c.role.trim());
        }
      });
    }
    if (initialData?.role && initialData.role.trim() && !EXCLUDED_ROLES.has(initialData.role.trim().toLowerCase())) {
      set.add(initialData.role.trim());
    }
    if (role && role.trim() && !EXCLUDED_ROLES.has(role.trim().toLowerCase())) {
      set.add(role.trim());
    }
    return Array.from(set);
  }, [allCharacters, initialData, role]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Book Spine Header */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center border border-[#6D492A] dark:border-[#382312]">
              <Feather className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-heading tracking-wide">
              {initialData ? 'Edit Character Record' : 'Record New Character'}
            </h2>
          </div>
          <button
            id="close-character-modal-btn"
            onClick={onClose}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with scrolling */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 font-sans-ui overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-[#FBEAE8] dark:bg-[#3A1410] border border-[#E8ADA7] dark:border-[#6B241C] rounded-lg text-xs text-[#9B2C1E] dark:text-[#F08B7F] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider mb-1.5">
              Character Name <span className="text-[#9E2A1E] dark:text-[#E06758]">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="character-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elizabeth Bennet, Gandalf, Paul Atreides"
              className="w-full px-3.5 py-2.5 bg-[#FFFDF9] dark:bg-[#291B11] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] focus:ring-2 focus:ring-[#C79D77]/40 rounded-lg text-sm text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider mb-1.5">
              Description & Character Notes <span className="text-[#9E2A1E] dark:text-[#E06758]">*</span>
            </label>
            <textarea
              id="character-desc-input"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe their personality, appearance, history, traits, key relationships, or memorable quotes..."
              className="w-full px-3.5 py-2.5 bg-[#FFFDF9] dark:bg-[#291B11] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] focus:ring-2 focus:ring-[#C79D77]/40 rounded-lg text-sm text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner leading-relaxed"
            />
          </div>

          {/* Spoilers Field (Interactive Reveal/Conceal System matching Reader Views) */}
          <div className="bg-[#F8EFEB] dark:bg-[#261614] p-3.5 rounded-xl border border-[#DFB8B2] dark:border-[#4D231F] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#8C2317] dark:text-[#F29489] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C53F32] dark:text-[#E86D61]" />
                <span>Spoilers & Sensitive Notes</span>
                <span className="text-[10px] lowercase font-normal text-[#8A5B55] dark:text-[#BA8984]">(optional)</span>
              </label>
              <span className="flex items-center gap-1.5 text-[11px] font-sans-ui">
                {spoilers.trim().length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#8C2317] dark:text-[#F29489] font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#C53F32] dark:text-[#E86D61]" />
                    <span>{spoilers.trim().length} chars noted</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#8A5B55] dark:text-[#BA8984] opacity-75">
                    <FileText className="w-3.5 h-3.5 opacity-40" />
                    <span>No spoilers</span>
                  </span>
                )}
              </span>
            </div>

            {/* Interactive SPOILERS Toggle Button */}
            <div className="relative">
              <button
                type="button"
                id="modal-toggle-spoiler-btn"
                onClick={handleSpoilerClick}
                onMouseDown={startSpoilerPress}
                onMouseUp={endSpoilerPress}
                onMouseLeave={endSpoilerPress}
                onTouchStart={startSpoilerPress}
                onTouchEnd={endSpoilerPress}
                onTouchCancel={endSpoilerPress}
                title={isSpoilerRevealed ? "Click or hold SPOILERS to conceal" : "Click or hold SPOILERS to reveal and edit"}
                className={`relative overflow-hidden w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg font-sans-ui text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                  isSpoilerRevealed
                    ? 'bg-[#FBECEB] dark:bg-[#341614] border-[#E8AAA4] dark:border-[#6B241E] text-[#8C2317] dark:text-[#F29489] hover:bg-[#F7D8D5] dark:hover:bg-[#421B19]'
                    : 'bg-[#F2E5D4] dark:bg-[#281A10] border-[#D6BFAB] dark:border-[#482E1A] text-[#693E1B] dark:text-[#E2BD96] hover:bg-[#E8D9C5] dark:hover:bg-[#332014]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${isSpoilerRevealed ? 'text-[#C53F32] dark:text-[#E86D61]' : 'text-[#8C5224] dark:text-[#C78B55]'}`} />
                  <span className="font-heading font-extrabold tracking-wider uppercase">
                    SPOILERS
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans-ui font-semibold ${
                      isSpoilerRevealed
                        ? 'bg-[#F4D2CE] dark:bg-[#521E19] text-[#7A1E14] dark:text-[#FFA99F]'
                        : 'bg-[#E2D2BE] dark:bg-[#382315] text-[#54351B] dark:text-[#D1BAA3]'
                    }`}
                  >
                    {isSpoilerRevealed ? 'Revealed' : 'Veiled'}
                  </span>
                  {spoilers.trim().length > 0 ? (
                    <span
                      title="Spoiler content exists"
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-sans-ui font-medium bg-[#FADBD8] dark:bg-[#4D1D18] text-[#932519] dark:text-[#FFA096]"
                    >
                      <FileText className="w-3 h-3 text-[#B02F21] dark:text-[#FF877A]" />
                      <span>Has content</span>
                    </span>
                  ) : (
                    <span
                      title="No spoiler content"
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-sans-ui text-[#8A6A51] dark:text-[#A68F7A] opacity-75"
                    >
                      <FileText className="w-3 h-3 opacity-40" />
                      <span>Empty</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-normal text-[#8A6A51] dark:text-[#A68F7A]">
                  {isSpoilerRevealed ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Tap/hold to conceal</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Tap/hold to reveal & edit</span>
                    </>
                  )}
                </div>

                {/* Progress bar during long press */}
                {isPressingSpoiler && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D2BBA3] dark:bg-[#4E3420] overflow-hidden">
                    <div className="h-full bg-[#8E3224] dark:bg-[#E86D61] animate-[progress_0.4s_linear_forwards]" />
                  </div>
                )}
              </button>
            </div>

            {/* Revealed Textarea */}
            {isSpoilerRevealed && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <textarea
                  ref={spoilerInputRef}
                  id="character-spoilers-input"
                  rows={3}
                  value={spoilers}
                  onChange={(e) => setSpoilers(e.target.value)}
                  placeholder="Record major plot twists, character deaths, secret lineage, climaxes, endings... (stays veiled by default to prevent accidental reading)"
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] dark:bg-[#1C0F0D] border border-[#DCB0AA] dark:border-[#57231E] focus:border-[#A83224] dark:focus:border-[#E86D61] focus:ring-2 focus:ring-[#E86D61]/30 rounded-lg text-sm text-[#382211] dark:text-[#F3ECE4] placeholder-[#B58B85] dark:placeholder-[#8C5D58] outline-hidden shadow-inner leading-relaxed"
                />
                <p className="text-[10px] text-[#8C4A42] dark:text-[#C4847D] italic">
                  Tip: When you close or save, this content is protected and only revealed on deliberate interaction.
                </p>
              </div>
            )}
          </div>

          {/* Books Field (Multiple Books Support) */}
          <div className="bg-[#F2EAE0] dark:bg-[#24170E] p-3.5 rounded-xl border border-[#D8C7B2] dark:border-[#3E2919] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                <Book className="w-3.5 h-3.5 text-[#7A4B29] dark:text-[#C78B55]" />
                <span>Books (Add Multiple Books)</span>
                <span className="text-[10px] lowercase font-normal text-[#8A715C] dark:text-[#9E8672]">(optional)</span>
              </label>
              <span className="text-[11px] text-[#7A624E] dark:text-[#A6907D] font-medium">
                {books.length} {books.length === 1 ? 'book' : 'books'} tagged
              </span>
            </div>

            {/* Existing tags */}
            {books.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {books.map((b, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#DFD0BE] dark:bg-[#3D2513] text-[#3D2511] dark:text-[#EFE5DB] text-xs font-medium border border-[#C6B39E] dark:border-[#583921] shadow-xs"
                  >
                    <BookOpen className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F]" />
                    <span className="truncate max-w-[200px]">{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(idx)}
                      className="text-[#7A5A43] hover:text-[#9B2C1E] dark:text-[#BFA895] dark:hover:text-[#F08B7F] p-0.5 rounded-full"
                      title="Remove book"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Book Input */}
            <div className="flex gap-2">
              <input
                id="character-book-input"
                type="text"
                value={bookInput}
                onChange={(e) => setBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBook();
                  }
                }}
                placeholder="Type book title(s), separated by commas, and click Add..."
                className="flex-1 px-3 py-2 bg-[#FFFDF9] dark:bg-[#2B1C12] border border-[#D5C2AA] dark:border-[#4E3420] focus:border-[#734A28] dark:focus:border-[#C49366] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleAddBook()}
                disabled={!bookInput.trim()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#84563C] hover:bg-[#966447] text-[#FAF6F0] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            {bookSuggestions.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-[#846C56] dark:text-[#8E7966] font-medium">
                  {activeBookQuery ? 'Matching Books & Series:' : 'Suggestions:'}
                </span>
                {bookSuggestions.map((sug) => {
                  const displaySeries = sug.matchingSeriesName || (sug.seriesNames.length > 0 ? sug.seriesNames[0] : null);
                  return (
                    <button
                      key={sug.title}
                      type="button"
                      onClick={() => handleAddBook(sug.title)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#E4D7C7] dark:bg-[#331F11] hover:bg-[#D5C4B0] dark:hover:bg-[#452B18] text-[#553821] dark:text-[#D1B8A0] border border-[#CBB9A4] dark:border-[#4A301B] transition-colors cursor-pointer"
                      title={displaySeries ? `Book in series "${displaySeries}"` : `Add book "${sug.title}"`}
                    >
                      <Plus className="w-3 h-3 text-[#7B4E2D] dark:text-[#D49E6F] shrink-0" />
                      <span className="font-medium">{sug.title}</span>
                      {displaySeries && (
                        <span className="text-[10px] text-[#846347] dark:text-[#BA9E85] font-normal opacity-85">
                          ({displaySeries})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              activeBookQuery && (
                <div className="pt-1 text-[11px] text-[#8C705B] dark:text-[#9A8472] italic">
                  No existing books or series matching "{activeBookQuery}". Click "Add" or press Enter to add.
                </div>
              )
            )}
          </div>

          {/* Role Field - Click and Highlight (All options, not limited to 5) */}
          <div className="bg-[#EDE2D2] dark:bg-[#25170E] p-3.5 rounded-xl border border-[#D5C2AA] dark:border-[#3D2616] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#452813] dark:text-[#D8BA9A] uppercase tracking-wider">
                Character Role / Archetype <span className="text-[10px] lowercase font-normal text-[#8A715C] dark:text-[#9E8672]">(optional)</span>
              </label>
              {role ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-[#7A5B3E] dark:text-[#BA9B7D]">Selected:</span>
                  <span className="font-bold text-[#4D2F15] dark:text-[#F3ECE4] bg-[#E0CFBD] dark:bg-[#382312] px-2 py-0.5 rounded-md">
                    {role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRole('')}
                    className="text-[11px] text-[#A63C2E] dark:text-[#E87569] hover:underline cursor-pointer ml-1"
                    title="Clear selected role"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-[#8A715C] dark:text-[#9E8672]">
                  Click to select
                </span>
              )}
            </div>

            {/* Clickable Role Pills - Click to select & highlight */}
            <div className="flex flex-wrap gap-1.5 pt-0.5" role="group" aria-label="Character Roles">
              {availableRoles.map((r) => {
                const isSelected = role.trim().toLowerCase() === r.toLowerCase();
                return (
                  <button
                    key={r}
                    id={`role-btn-${r.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => setRole(isSelected ? '' : r)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border shadow-xs active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#5C371B] dark:bg-[#C48749] text-[#FFFDF9] dark:text-[#180E07] border-[#442710] dark:border-[#E8A564] ring-2 ring-[#704624]/30 dark:ring-[#C48749]/40 font-bold'
                        : 'bg-[#FFFDF9] dark:bg-[#1E140C] text-[#553820] dark:text-[#D1BEAA] hover:bg-[#F6EFE5] dark:hover:bg-[#2B1B10] border-[#D5C2AA] dark:border-[#472E1B]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#FFFDF9] dark:text-[#180E07]" />}
                    <span>{r}</span>
                  </button>
                );
              })}

              {/* Custom Role Adder */}
              <button
                type="button"
                onClick={() => setShowCustomRoleInput((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#704C2E] dark:text-[#C49E7C] border border-dashed border-[#C5B09A] dark:border-[#523A25] hover:bg-[#E2D4C2] dark:hover:bg-[#332014] transition-colors cursor-pointer"
                title="Add a custom role"
              >
                <Plus className="w-3 h-3" />
                <span>Custom...</span>
              </button>
            </div>

            {/* Inline Custom Role Input if opened */}
            {showCustomRoleInput && (
              <div className="flex gap-2 pt-1.5">
                <input
                  id="custom-role-input"
                  type="text"
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customRoleText.trim()) {
                        setRole(customRoleText.trim());
                        setCustomRoleText('');
                        setShowCustomRoleInput(false);
                      }
                    }
                  }}
                  placeholder="e.g. Captain, Spy, Alchemist..."
                  className="flex-1 px-3 py-1.5 bg-[#FFFDF9] dark:bg-[#1C120B] border border-[#D5C2AA] dark:border-[#4E3420] rounded-lg text-xs text-[#382211] dark:text-[#F3ECE4] placeholder-[#A6917E] dark:placeholder-[#7D6652] outline-hidden shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customRoleText.trim()) {
                      setRole(customRoleText.trim());
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

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#DCCBB5] dark:border-[#382312] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#E2D6C5] dark:bg-[#2D1C11] hover:bg-[#D5C6B2] dark:hover:bg-[#3D2516] text-[#4F331A] dark:text-[#D8C4B0] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-character-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#664327] hover:bg-[#7D5331] dark:bg-[#A86E3E] dark:hover:bg-[#BC7E49] text-[#FAF6F0] dark:text-[#180E07] text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
            >
              <Feather className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : initialData ? 'Update Character' : 'Save Character'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
