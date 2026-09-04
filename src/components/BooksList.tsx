import React from 'react';
import type { Character } from '../types';
import { filterBookGroups, normalizeForAlphabeticalSort } from '../lib/grouping';
import { CharacterCard } from './CharacterCard';
import { ScrollToTopFab } from './ScrollToTopFab';
import { Book, Library, Plus, ChevronDown, ChevronUp, Users, Pencil, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';

interface BooksListProps {
  characters: Character[];
  searchQuery: string;
  titlesOnly?: boolean;
  readingList?: string[];
  bookSeriesMap?: Record<string, string[]>;
  onToggleReadingNow?: (bookTitle: string) => void;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
  onSelect: (character: Character) => void;
  onAddCharacterToBook: (bookTitle: string, seriesName?: string) => void;
  onEditBook: (bookTitle: string, characterCount: number) => void;
  onDeleteBook: (bookTitle: string, characterCount: number) => void;
}

export const BooksList: React.FC<BooksListProps> = ({
  characters,
  searchQuery,
  titlesOnly = false,
  readingList = [],
  bookSeriesMap = {},
  onToggleReadingNow,
  onEdit,
  onDelete,
  onSelect,
  onAddCharacterToBook,
  onEditBook,
  onDeleteBook,
}) => {
  // State for filtering to only currently reading books
  const [onlyCurrentlyReading, setOnlyCurrentlyReading] = React.useState(false);

  const allBookGroups = React.useMemo(() => {
    return filterBookGroups(characters, searchQuery, titlesOnly, bookSeriesMap);
  }, [characters, searchQuery, titlesOnly, bookSeriesMap]);

  const bookGroups = React.useMemo(() => {
    if (!onlyCurrentlyReading) return allBookGroups;
    return allBookGroups.filter((g) => readingList.includes(g.bookTitle));
  }, [allBookGroups, onlyCurrentlyReading, readingList]);

  // Track expanded/collapsed book sections; strictly defaults to all collapsed
  const [expandedBooks, setExpandedBooks] = React.useState<Record<string, boolean>>({});

  const toggleBook = (bookTitle: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookTitle]: !prev[bookTitle],
    }));
  };

  const currentlyReadingCount = allBookGroups.filter((g) => readingList.includes(g.bookTitle)).length;

  // Alphabet jump bar enabled when there are more than 20 books
  const showAlphabet = bookGroups.length > 20;

  const alphabetMap = React.useMemo(() => {
    const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    const map = new Map<string, { count: number; firstBook: string }>();

    letters.forEach((l) => {
      map.set(l, { count: 0, firstBook: '' });
    });

    bookGroups.forEach((group) => {
      const norm = normalizeForAlphabeticalSort(group.bookTitle);
      const firstChar = (norm[0] || '').toUpperCase();
      const letter = firstChar >= 'A' && firstChar <= 'Z' ? firstChar : '#';
      const existing = map.get(letter);
      if (existing) {
        if (!existing.firstBook) {
          existing.firstBook = group.bookTitle;
        }
        existing.count += 1;
      }
    });

    return map;
  }, [bookGroups]);

  const [activeLetter, setActiveLetter] = React.useState<string | null>(null);

  // Track the visible book letter section as the reader scrolls
  React.useEffect(() => {
    if (!showAlphabet) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const letter = entry.target.getAttribute('data-letter');
            if (letter) {
              setActiveLetter(letter);
            }
          }
        });
      },
      {
        rootMargin: '-110px 0px -60% 0px',
        threshold: 0,
      }
    );

    const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    letters.forEach((letter) => {
      const el = document.getElementById(`book-letter-anchor-${letter}`);
      if (el) {
        el.setAttribute('data-letter', letter);
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [showAlphabet, bookGroups]);

  const handleJumpToLetter = (letter: string) => {
    const target = alphabetMap.get(letter);
    if (!target || !target.firstBook) return;

    setActiveLetter(letter);
    const element = document.getElementById(`book-letter-anchor-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderCurrentlyReadingBtn = () => (
    <button
      id="toggle-currently-reading-filter-btn"
      type="button"
      aria-pressed={onlyCurrentlyReading}
      onClick={() => setOnlyCurrentlyReading((prev) => !prev)}
      className={`inline-flex items-center gap-1.5 px-3 h-7 sm:h-8 rounded-lg text-xs font-semibold border shadow-xs transition-all cursor-pointer select-none ${
        onlyCurrentlyReading
          ? 'bg-[#6D4C2B] text-[#FFFDF9] border-[#4D3016] dark:bg-[#C48749] dark:text-[#180E07] dark:border-[#E2A668] ring-2 ring-[#6D4C2B]/30 font-bold'
          : 'bg-[#FAF5ED] dark:bg-[#2D1E13] hover:bg-[#FFFFFF] dark:hover:bg-[#3D291B] text-[#54351B] dark:text-[#E8D4C1] border-[#D5C2AA] dark:border-[#4B3420]'
      }`}
      title={onlyCurrentlyReading ? 'Show all books' : 'Filter to books currently being read'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          onlyCurrentlyReading
            ? 'bg-[#98FF98] dark:bg-[#180E07]'
            : 'bg-[#9C826E] dark:bg-[#7D6452]'
        }`}
      />
      {onlyCurrentlyReading ? (
        <BookmarkCheck className="w-3.5 h-3.5 text-[#F5E6D3] dark:text-[#180E07]" />
      ) : (
        <Bookmark className="w-3.5 h-3.5 text-[#8C5E3B] dark:text-[#D49E6F]" />
      )}
      <span className="whitespace-nowrap">Currently Reading</span>
      {currentlyReadingCount > 0 && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            onlyCurrentlyReading
              ? 'bg-[#4E3118] text-[#FFFDF9] dark:bg-[#180E07] dark:text-[#F3ECE4]'
              : 'bg-[#E0D1BF] dark:bg-[#422B19] text-[#5C3E27] dark:text-[#D8BA9A]'
          }`}
        >
          {currentlyReadingCount}
        </span>
      )}
    </button>
  );

  if (allBookGroups.length === 0) {
    return (
      <div className="bg-[#FAF4EB] dark:bg-[#20150D] border border-[#DFCBB5] dark:border-[#382312] rounded-2xl p-12 text-center my-8 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-[#EDE1D1] dark:bg-[#332013] text-[#7A5131] dark:text-[#D49E6F] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#CEB89F] dark:border-[#4E3420]">
          <Book className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#3B2211] dark:text-[#F3ECE4] font-heading mb-2">
          {searchQuery ? 'No Matching Books Found' : 'No Books in Your Journal Yet'}
        </h3>
        <p className="text-sm text-[#73553F] dark:text-[#B69F8B] mb-6 font-sans-ui max-w-md mx-auto">
          {searchQuery
            ? titlesOnly
              ? `No books found with title containing "${searchQuery}". (Titles Only search active)`
              : `No books match "${searchQuery}". Try a different title or search term.`
            : 'Record your first character with their book title to see your library organized here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alphabet Quick Jump Bar - when > 20 books; vertically aligned with Currently Reading button */}
      {showAlphabet ? (
        <div
          id="books-alphabet-jump-bar"
          className="sticky top-[72px] z-20 bg-[#F8F4EE]/95 dark:bg-[#1A110A]/95 backdrop-blur-md border border-[#DFCBB5] dark:border-[#382312] rounded-xl p-2.5 sm:p-3 shadow-sm transition-colors flex flex-wrap items-center justify-between gap-2.5 font-sans-ui"
        >
          {/* Alphabet Jump Buttons */}
          <div
            className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-1.5 flex-1 min-w-[260px]"
            role="navigation"
            aria-label="Alphabetical Book Jump Index"
          >
            {['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letter) => {
              const info = alphabetMap.get(letter);
              const hasBooks = (info?.count || 0) > 0;
              const isActive = activeLetter === letter;

              return (
                <button
                  key={letter}
                  id={`alphabet-jump-${letter === '#' ? 'hash' : letter.toLowerCase()}`}
                  type="button"
                  disabled={!hasBooks}
                  onClick={() => handleJumpToLetter(letter)}
                  title={
                    hasBooks
                      ? `Jump to books starting with ${letter} (${info?.count} ${info?.count === 1 ? 'book' : 'books'})`
                      : `No books starting with ${letter}`
                  }
                  aria-label={`Jump to books starting with letter ${letter}`}
                  className={`min-w-6 h-7 sm:min-w-7 sm:h-8 px-1 rounded-md text-xs font-bold font-sans-ui transition-all flex items-center justify-center ${
                    !hasBooks
                      ? 'text-[#B6A391] dark:text-[#5E4837] opacity-35 cursor-not-allowed border border-transparent select-none'
                      : isActive
                      ? 'bg-[#6D4C2B] text-[#FFFDF9] dark:bg-[#D49E6F] dark:text-[#180E07] ring-2 ring-[#6D4C2B]/40 shadow-xs cursor-pointer'
                      : 'bg-[#FAF5ED] dark:bg-[#25180F] hover:bg-[#FFFFFF] dark:hover:bg-[#382316] text-[#4A2D17] dark:text-[#E8D4C1] border border-[#D5C2AA] dark:border-[#4B3420] shadow-2xs hover:shadow-xs cursor-pointer'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Currently Reading Button - vertically aligned alongside the alphabet */}
          <div className="shrink-0 flex items-center">
            {renderCurrentlyReadingBtn()}
          </div>
        </div>
      ) : (
        /* When alphabet bar is not active (<= 20 books or searching), place Currently Reading in a compact right-aligned row */
        <div className="flex items-center justify-end">
          {renderCurrentlyReadingBtn()}
        </div>
      )}

      {/* Empty State if filter yields 0 books */}
      {bookGroups.length === 0 && onlyCurrentlyReading && (
        <div className="bg-[#FAF4EB] dark:bg-[#20150D] border border-[#DFCBB5] dark:border-[#382312] rounded-2xl p-10 text-center my-6 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 bg-[#EDE1D1] dark:bg-[#332013] text-[#7A5131] dark:text-[#D49E6F] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#CEB89F] dark:border-[#4E3420]">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#3B2211] dark:text-[#F3ECE4] font-heading mb-1.5">
            No Books Marked as "Reading Now"
          </h3>
          <p className="text-xs text-[#73553F] dark:text-[#B69F8B] mb-5 font-sans-ui">
            Click the <strong className="text-[#4E3118] dark:text-[#F6EFE5]">"Reading Now"</strong> button on any book title bar to bookmark it to your active reading shelf.
          </p>
          <button
            type="button"
            onClick={() => setOnlyCurrentlyReading(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#764E2F] hover:bg-[#5E3B20] text-[#FFFDF9] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>View All Books</span>
          </button>
        </div>
      )}

      {/* List of Books */}
      <div className="space-y-6">
        {bookGroups.map((group) => {
          const isExpanded = !!expandedBooks[group.bookTitle];
          const isUnspecified = group.bookTitle === 'Unspecified Book';
          const seriesList = Array.isArray(group.series) ? group.series : [];
          const isReadingNow = readingList.includes(group.bookTitle);

          const norm = normalizeForAlphabeticalSort(group.bookTitle);
          const firstChar = (norm[0] || '').toUpperCase();
          const letter = firstChar >= 'A' && firstChar <= 'Z' ? firstChar : '#';
          const isFirstOfLetter = alphabetMap.get(letter)?.firstBook === group.bookTitle;

          return (
            <React.Fragment key={group.bookTitle}>
              {/* Section Header & Anchor for Alphabet Jump */}
              {showAlphabet && isFirstOfLetter && (
                <div
                  id={`book-letter-anchor-${letter}`}
                  data-letter={letter}
                  className="pt-2 pb-1 scroll-mt-36 flex items-center gap-3 select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#59371C] dark:bg-[#A86E3E] text-[#FFFDF9] dark:text-[#180E07] flex items-center justify-center font-bold font-sans-ui text-sm shadow-xs">
                    {letter}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D6C3AB] dark:from-[#4B3420] to-transparent" />
                  <span className="text-xs text-[#826650] dark:text-[#BAA38F] font-sans-ui">
                    {alphabetMap.get(letter)?.count} {alphabetMap.get(letter)?.count === 1 ? 'book' : 'books'}
                  </span>
                </div>
              )}

              <div
                className="bg-[#FAF6F0] dark:bg-[#1E140C] border-2 border-[#DBC9B3] dark:border-[#3E2919] rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Book Header Bar */}
                <div
                  onClick={() => toggleBook(group.bookTitle)}
                  className="bg-gradient-to-r from-[#F0E6D8] via-[#E8DCCB] to-[#F0E6D8] dark:from-[#2B1C12] dark:via-[#26170E] dark:to-[#2B1C12] p-4 sm:p-5 border-b border-[#D8C5AE] dark:border-[#382312] cursor-pointer select-none flex flex-wrap items-center justify-between gap-3 hover:bg-[#EAE0D1] dark:hover:bg-[#332014] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#613D22] dark:bg-[#8D582D] text-[#FAF4EC] flex items-center justify-center shadow-xs shrink-0">
                      <Book className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-[#351E0E] dark:text-[#F6EFE5] font-heading truncate">
                        {group.bookTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 font-sans-ui text-xs">
                        {seriesList.length > 0 &&
                          seriesList.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EAD5C3] dark:bg-[#381F14] text-[#4A1D0E] dark:text-[#FAD8C8] border border-[#CCA78E] dark:border-[#5E3220] font-medium"
                            >
                              <Library className="w-3 h-3 text-[#8C3B1F] dark:text-[#F39572]" />
                              <span>Series: {s}</span>
                            </span>
                          ))}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E6DACB] dark:bg-[#382312] text-[#5C3E27] dark:text-[#D8BA9A] font-medium">
                          <Users className="w-3 h-3" />
                          <span>
                            {group.characters.length}{' '}
                            {group.characters.length === 1 ? 'character' : 'characters'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div
                    className="flex items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isUnspecified && (
                      <>
                        <button
                          id={`edit-book-${group.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          type="button"
                          onClick={() => onEditBook(group.bookTitle, group.characters.length)}
                          title={`Edit "${group.bookTitle}" title`}
                          aria-label="Edit book title"
                          className="p-1.5 text-[#6D4C32] hover:text-[#351E0E] dark:text-[#C7A382] dark:hover:text-[#F6EFE5] hover:bg-[#DBCABA] dark:hover:bg-[#382312] rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          id={`delete-book-${group.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          type="button"
                          onClick={() => onDeleteBook(group.bookTitle, group.characters.length)}
                          title={`Delete "${group.bookTitle}" from library`}
                          aria-label="Delete book"
                          className="p-1.5 text-[#8F2618] hover:text-[#B92F1F] dark:text-[#E07A6C] dark:hover:text-[#F29489] hover:bg-[#F5D8D4] dark:hover:bg-[#401C17] rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Reading Now Button (Positioned between delete and Add Character) */}
                        <button
                          id={`reading-now-book-${group.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          type="button"
                          aria-pressed={isReadingNow}
                          onClick={() => onToggleReadingNow && onToggleReadingNow(group.bookTitle)}
                          title={
                            isReadingNow
                              ? `Remove "${group.bookTitle}" from Currently Reading shelf`
                              : `Mark "${group.bookTitle}" as Currently Reading`
                          }
                          aria-label="Toggle currently reading status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-sans-ui border shadow-2xs transition-all cursor-pointer ${
                            isReadingNow
                              ? 'bg-[#6D4C2B] text-[#FFFDF9] border-[#4D3016] dark:bg-[#C48749] dark:text-[#180E07] dark:border-[#E2A668] ring-1 ring-[#6D4C2B]/30'
                              : 'bg-[#FAF5ED] dark:bg-[#25180F] hover:bg-[#FFFFFF] dark:hover:bg-[#352215] text-[#5C3E27] dark:text-[#D8BA9A] border-[#D5C2AA] dark:border-[#4B3420]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReadingNow
                                ? 'bg-[#98FF98] dark:bg-[#180E07]'
                                : 'bg-[#9C826E] dark:bg-[#7D6452]'
                            }`}
                          />
                          {isReadingNow ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-[#F5E6D3] dark:text-[#180E07]" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5 text-[#8C5E3B] dark:text-[#D49E6F]" />
                          )}
                          <span className="hidden sm:inline">
                            {isReadingNow ? 'Reading Now' : 'Mark as Reading'}
                          </span>
                        </button>
                      </>
                    )}

                    <button
                      id={`add-char-to-book-${group.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      type="button"
                      onClick={() =>
                        onAddCharacterToBook(
                          isUnspecified ? '' : group.bookTitle,
                          seriesList[0] || ''
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#6D4C2B] hover:bg-[#57391C] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FFFDF9] dark:text-[#180E07] text-xs font-semibold font-sans-ui shadow-xs transition-colors border border-[#4D3016] dark:border-[#C68A57] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Character</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBook(group.bookTitle)}
                      className="p-1.5 text-[#6D4C32] dark:text-[#C7A382] hover:bg-[#D4C3AC] dark:hover:bg-[#382312] rounded-md transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Book Content - Characters in this Book */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-[#FAF6F0] dark:bg-[#1E140C]">
                    {group.characters.length === 0 ? (
                      <div className="text-center py-6 text-[#826650] dark:text-[#B69F8B] text-xs font-sans-ui">
                        No characters recorded in this book yet. Click "Add Character" to add the first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.characters.map((character) => (
                          <CharacterCard
                            key={character.id}
                            character={character}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSelect={onSelect}
                            bookSeriesMap={bookSeriesMap}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating Action Button to return to top */}
      <ScrollToTopFab />
    </div>
  );
};
