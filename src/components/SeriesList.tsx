import React from 'react';
import type { Character } from '../types';
import { filterSeriesGroups } from '../lib/grouping';
import { CharacterCard } from './CharacterCard';
import { ScrollToTopFab } from './ScrollToTopFab';
import { 
  Library, 
  Book, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Users,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

interface SeriesListProps {
  characters: Character[];
  searchQuery: string;
  titlesOnly?: boolean;
  seriesOrders?: Record<string, string[]>;
  bookTimestamps?: Record<string, number>;
  readingList?: string[];
  bookSeriesMap?: Record<string, string[]>;
  onToggleReadingNow?: (bookTitle: string) => void;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
  onSelect: (character: Character) => void;
  onAddCharacterToSeries: (seriesName: string, bookTitle?: string) => void;
  onEditBook: (bookTitle: string, characterCount: number) => void;
  onDeleteBook: (bookTitle: string, characterCount: number) => void;
  onMoveBookInSeries: (seriesName: string, bookTitle: string, direction: 'up' | 'down') => void;
}

export const SeriesList: React.FC<SeriesListProps> = ({
  characters,
  searchQuery,
  titlesOnly = false,
  seriesOrders = {},
  bookTimestamps = {},
  readingList = [],
  bookSeriesMap = {},
  onToggleReadingNow,
  onEdit,
  onDelete,
  onSelect,
  onAddCharacterToSeries,
  onEditBook,
  onDeleteBook,
  onMoveBookInSeries,
}) => {
  const seriesGroups = React.useMemo(() => {
    return filterSeriesGroups(characters, searchQuery, titlesOnly, seriesOrders, bookTimestamps, bookSeriesMap);
  }, [characters, searchQuery, titlesOnly, seriesOrders, bookTimestamps, bookSeriesMap]);

  // Group by books toggle (defaults to true / ON by default)
  const [groupByBooks, setGroupByBooks] = React.useState(true);

  // Defaults to all series collapsed
  const [expandedSeries, setExpandedSeries] = React.useState<Record<string, boolean>>({});

  // Track expanded/collapsed book sections inside series (key: "seriesName:::bookTitle")
  const [expandedBooksInSeries, setExpandedBooksInSeries] = React.useState<Record<string, boolean>>({});

  const toggleSeries = (seriesName: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [seriesName]: !prev[seriesName],
    }));
  };

  const toggleBookInSeries = (seriesName: string, bookTitle: string) => {
    const key = `${seriesName}:::${bookTitle}`;
    setExpandedBooksInSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (seriesGroups.length === 0) {
    return (
      <div className="bg-[#FAF4EB] dark:bg-[#20150D] border border-[#DFCBB5] dark:border-[#382312] rounded-2xl p-12 text-center my-8 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-[#EDE1D1] dark:bg-[#332013] text-[#7A5131] dark:text-[#D49E6F] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#CEB89F] dark:border-[#4E3420]">
          <Library className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#3B2211] dark:text-[#F3ECE4] font-heading mb-2">
          {searchQuery ? 'No Matching Book Series Found' : 'No Book Series Recorded Yet'}
        </h3>
        <p className="text-sm text-[#73553F] dark:text-[#B69F8B] mb-6 font-sans-ui max-w-md mx-auto">
          {searchQuery
            ? titlesOnly
              ? `No book series found with title containing "${searchQuery}". (Titles Only search active)`
              : `No book series found matching "${searchQuery}".`
            : 'When you record characters with a book series, they will be organized into series chronicles here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Banner & Controls Toolbar */}
      <div className="bg-[#EFE5D6] dark:bg-[#23170F] border border-[#D8C6AF] dark:border-[#3B2516] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 font-sans-ui">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-[#6B5320] dark:text-[#D4B96F]" />
          <span className="text-sm font-semibold text-[#482A14] dark:text-[#F3ECE4]">
            {seriesGroups.length} {seriesGroups.length === 1 ? 'Book Series' : 'Book Series'} Alphabetically Listed
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Group by Books Toggle Button */}
          <button
            id="toggle-group-by-books-btn"
            type="button"
            aria-pressed={groupByBooks}
            onClick={() => setGroupByBooks((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-xs transition-all cursor-pointer select-none ${
              groupByBooks
                ? 'bg-[#6D4C2B] text-[#FFFDF9] border-[#4D3016] dark:bg-[#C48749] dark:text-[#180E07] dark:border-[#E2A668] ring-2 ring-[#6D4C2B]/30 font-bold'
                : 'bg-[#FAF5ED] dark:bg-[#2D1E13] hover:bg-[#FFFFFF] dark:hover:bg-[#3D291B] text-[#54351B] dark:text-[#E8D4C1] border-[#D5C2AA] dark:border-[#4B3420]'
            }`}
            title={
              groupByBooks
                ? 'Group by Books: ON (Books in series order)'
                : 'Group by Books: OFF (All characters alphabetical)'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                groupByBooks
                  ? 'bg-[#98FF98] dark:bg-[#180E07]'
                  : 'bg-[#9C826E] dark:bg-[#7D6452]'
              }`}
            />
            <Book
              className={`w-3.5 h-3.5 ${
                groupByBooks
                  ? 'text-[#F5E6D3] dark:text-[#180E07]'
                  : 'text-[#8C5E3B] dark:text-[#D49E6F]'
              }`}
            />
            <span>Group by Books</span>
          </button>
        </div>
      </div>

      {/* Series List */}
      <div className="space-y-8">
        {seriesGroups.map((series) => {
          const isExpanded = !!expandedSeries[series.seriesName];
          const isStandalone = series.seriesName === 'Standalone / No Series';

          return (
            <div
              key={series.seriesName}
              className="bg-[#FAF6F0] dark:bg-[#1E140C] border-2 border-[#D6C5AF] dark:border-[#3E2919] rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Series Banner */}
              <div
                onClick={() => toggleSeries(series.seriesName)}
                className="bg-gradient-to-r from-[#ECE2D0] via-[#E4D7C2] to-[#ECE2D0] dark:from-[#2B1E12] dark:via-[#26170E] dark:to-[#2B1E12] p-5 border-b-2 border-[#D1BFA6] dark:border-[#382312] cursor-pointer select-none flex flex-wrap items-center justify-between gap-3 hover:bg-[#E2D5BE] dark:hover:bg-[#332014] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[#543E19] dark:bg-[#7D5B24] text-[#FAF5EC] flex items-center justify-center shadow-xs shrink-0">
                    <Library className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-[#35230F] dark:text-[#F6EFE5] font-heading truncate">
                      {series.seriesName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 font-sans-ui text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DAD0BD] dark:bg-[#38281B] text-[#423315] dark:text-[#E2D5B4] font-medium">
                        <Book className="w-3 h-3" />
                        <span>
                          {series.books.length} {series.books.length === 1 ? 'Book' : 'Books'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DAD0BD] dark:bg-[#38281B] text-[#423315] dark:text-[#E2D5B4] font-medium">
                        <Users className="w-3 h-3" />
                        <span>
                          {series.totalCharacters}{' '}
                          {series.totalCharacters === 1 ? 'character' : 'characters'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div
                  className="flex items-center justify-end gap-2 flex-wrap w-full sm:w-auto ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isStandalone && (
                    <button
                      id={`add-char-to-series-${series.seriesName.replace(/\s+/g, '-')}`}
                      onClick={() => onAddCharacterToSeries(series.seriesName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6D4C2B] hover:bg-[#57391C] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FFFDF9] dark:text-[#180E07] text-xs font-semibold font-sans-ui shadow-xs transition-colors border border-[#4D3016] dark:border-[#C68A57]"
                    >
                      <Users className="w-3.5 h-3.5 text-[#F3E7D8] dark:text-[#180E07]" />
                      <span className="hidden sm:inline">Add Character</span>
                    </button>
                  )}
                  <button
                    onClick={() => toggleSeries(series.seriesName)}
                    className="p-1.5 text-[#6D4C32] dark:text-[#C7A382] hover:bg-[#D4C3AC] dark:hover:bg-[#382312] rounded-md transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Series Content */}
              {isExpanded && (
                <div className="p-5 sm:p-6 space-y-6 bg-[#FAF6F0] dark:bg-[#1E140C]">
                  {groupByBooks ? (
                    <>
                      {/* Grouped by Books (ordered by custom series order or earliest added) */}
                      {series.books.map((bookGroup, bIdx) => {
                        const isFirstBook = bIdx === 0;
                        const isLastBook = bIdx === series.books.length - 1;
                        const isBookExpanded =
                          !!expandedBooksInSeries[
                            `${series.seriesName}:::${bookGroup.bookTitle}`
                          ];

                        return (
                          <div
                            key={bookGroup.bookTitle}
                            className="bg-[#F3ECE0] dark:bg-[#251910] border border-[#DFCBB5] dark:border-[#3E2919] rounded-xl overflow-hidden shadow-xs transition-all"
                          >
                            <div
                              onClick={() =>
                                toggleBookInSeries(
                                  series.seriesName,
                                  bookGroup.bookTitle
                                )
                              }
                              className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#EDE3D4] dark:bg-[#2D1E13] border-b border-[#D8C7B0] dark:border-[#382312] cursor-pointer hover:bg-[#E5DAC8] dark:hover:bg-[#352317] transition-colors select-none"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Book className="w-4 h-4 text-[#7A5435] dark:text-[#D49E6F] shrink-0" />
                                <h4 className="font-heading font-bold text-base text-[#382211] dark:text-[#F3ECE4] truncate">
                                  {bookGroup.bookTitle}
                                </h4>
                                <span className="text-xs font-sans-ui text-[#7A614D] dark:text-[#A68F7B] shrink-0">
                                  ({bookGroup.characters.length})
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-end gap-1 sm:gap-1.5 w-full sm:w-auto ml-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Up Arrow */}
                                <button
                                  id={`move-up-${series.seriesName.replace(/[^a-zA-Z0-9]/g, '-')}-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  disabled={isFirstBook}
                                  onClick={() =>
                                    onMoveBookInSeries(
                                      series.seriesName,
                                      bookGroup.bookTitle,
                                      'up'
                                    )
                                  }
                                  title={
                                    isFirstBook
                                      ? 'Book is already at the top of the series'
                                      : `Move "${bookGroup.bookTitle}" higher in series`
                                  }
                                  aria-label="Move book up in series"
                                  className={`p-1.5 rounded-md transition-all ${
                                    isFirstBook
                                      ? 'opacity-30 cursor-not-allowed text-[#9E8674] dark:text-[#6E5544]'
                                      : 'text-[#6D4C32] dark:text-[#C7A382] hover:text-[#351E0E] dark:hover:text-[#F6EFE5] hover:bg-[#DBCABA] dark:hover:bg-[#382312] cursor-pointer'
                                  }`}
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                {/* Down Arrow */}
                                <button
                                  id={`move-down-${series.seriesName.replace(/[^a-zA-Z0-9]/g, '-')}-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  disabled={isLastBook}
                                  onClick={() =>
                                    onMoveBookInSeries(
                                      series.seriesName,
                                      bookGroup.bookTitle,
                                      'down'
                                    )
                                  }
                                  title={
                                    isLastBook
                                      ? 'Book is already at the bottom of the series'
                                      : `Move "${bookGroup.bookTitle}" lower in series`
                                  }
                                  aria-label="Move book down in series"
                                  className={`p-1.5 rounded-md transition-all ${
                                    isLastBook
                                      ? 'opacity-30 cursor-not-allowed text-[#9E8674] dark:text-[#6E5544]'
                                      : 'text-[#6D4C32] dark:text-[#C7A382] hover:text-[#351E0E] dark:hover:text-[#F6EFE5] hover:bg-[#DBCABA] dark:hover:bg-[#382312] cursor-pointer'
                                  }`}
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Book */}
                                <button
                                  id={`edit-series-book-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  onClick={() =>
                                    onEditBook(
                                      bookGroup.bookTitle,
                                      bookGroup.characters.length
                                    )
                                  }
                                  title={`Edit "${bookGroup.bookTitle}" title`}
                                  aria-label="Edit book title"
                                  className="p-1.5 text-[#6D4C32] hover:text-[#351E0E] dark:text-[#C7A382] dark:hover:text-[#F6EFE5] hover:bg-[#DBCABA] dark:hover:bg-[#382312] rounded-md transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Book */}
                                <button
                                  id={`delete-series-book-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  onClick={() =>
                                    onDeleteBook(
                                      bookGroup.bookTitle,
                                      bookGroup.characters.length
                                    )
                                  }
                                  title={`Delete "${bookGroup.bookTitle}" from library`}
                                  aria-label="Delete book"
                                  className="p-1.5 text-[#8F2618] hover:text-[#B92F1F] dark:text-[#E07A6C] dark:hover:text-[#F29489] hover:bg-[#F5D8D4] dark:hover:bg-[#401C17] rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Reading Now button */}
                                {(() => {
                                  const isReading = readingList.includes(bookGroup.bookTitle);
                                  return (
                                    <button
                                      id={`reading-now-series-book-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                      type="button"
                                      aria-pressed={isReading}
                                      onClick={() => onToggleReadingNow && onToggleReadingNow(bookGroup.bookTitle)}
                                      title={
                                        isReading
                                          ? `Currently marked as Reading Now (Click to remove)`
                                          : `Mark "${bookGroup.bookTitle}" as Reading Now`
                                      }
                                      aria-label="Toggle Reading Now status"
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold font-sans-ui transition-all border shadow-xs cursor-pointer select-none whitespace-nowrap ${
                                        isReading
                                          ? 'bg-[#6D4C2B] text-[#FFFDF9] border-[#4D3016] dark:bg-[#C48749] dark:text-[#180E07] dark:border-[#E2A668] ring-1 ring-[#6D4C2B]/30 font-bold'
                                          : 'bg-[#FAF5ED] text-[#6E5038] border-[#D5C2AA] dark:bg-[#2D1E13] dark:text-[#C7AB93] dark:border-[#4E3420] hover:bg-[#F0E6D8] dark:hover:bg-[#382312]'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isReading
                                            ? 'bg-[#98FF98] dark:bg-[#180E07]'
                                            : 'bg-[#A8907D] dark:bg-[#6D5340]'
                                        }`}
                                      />
                                      {isReading ? (
                                        <BookmarkCheck className="w-3 h-3 text-[#F5E6D3] dark:text-[#180E07]" />
                                      ) : (
                                        <Bookmark className="w-3 h-3 text-[#8C5E3B] dark:text-[#D49E6F]" />
                                      )}
                                      <span className="hidden sm:inline">Reading Now</span>
                                    </button>
                                  );
                                })()}

                                {/* Add Character to Series Book */}
                                <button
                                  id={`add-char-to-series-book-${series.seriesName.replace(/[^a-zA-Z0-9]/g, '-')}-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  onClick={() => onAddCharacterToSeries(series.seriesName, bookGroup.bookTitle)}
                                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md bg-[#6D4C2B] hover:bg-[#57391C] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FFFDF9] dark:text-[#180E07] text-[11px] font-semibold font-sans-ui shadow-xs transition-colors border border-[#4D3016] dark:border-[#C68A57] cursor-pointer"
                                  title={`Add character to "${bookGroup.bookTitle}" in this series`}
                                >
                                  <Plus className="w-3 h-3 text-[#F3E7D8] dark:text-[#180E07]" />
                                  <span className="hidden sm:inline">Add Character</span>
                                </button>

                                {/* Twistie */}
                                <button
                                  id={`toggle-series-book-${series.seriesName.replace(/[^a-zA-Z0-9]/g, '-')}-${bookGroup.bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                  type="button"
                                  onClick={() =>
                                    toggleBookInSeries(
                                      series.seriesName,
                                      bookGroup.bookTitle
                                    )
                                  }
                                  className="p-1 text-[#6D4C32] dark:text-[#C7A382] hover:bg-[#DBCABA] dark:hover:bg-[#382312] rounded-md transition-colors cursor-pointer"
                                >
                                  {isBookExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isBookExpanded && (
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {bookGroup.characters.map((character) => (
                                    <CharacterCard
                                      key={character.id}
                                      character={character}
                                      searchQuery={searchQuery}
                                      bookSeriesMap={bookSeriesMap}
                                      onEdit={onEdit}
                                      onDelete={onDelete}
                                      onSelect={onSelect}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Standalone Characters in Series */}
                      {series.standaloneCharacters.length > 0 && (() => {
                        const isStandaloneExpanded =
                          !!expandedBooksInSeries[
                            `${series.seriesName}:::__standalone__`
                          ];

                        return (
                          <div className="bg-[#F3ECE0] dark:bg-[#251910] border border-[#DFCBB5] dark:border-[#3E2919] rounded-xl overflow-hidden shadow-xs transition-all">
                            <div
                              onClick={() =>
                                toggleBookInSeries(
                                  series.seriesName,
                                  '__standalone__'
                                )
                              }
                              className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#EDE3D4] dark:bg-[#2D1E13] border-b border-[#D8C7B0] dark:border-[#382312] cursor-pointer hover:bg-[#E5DAC8] dark:hover:bg-[#352317] transition-colors select-none"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Users className="w-4 h-4 text-[#7A5435] dark:text-[#D49E6F] shrink-0" />
                                <h4 className="font-heading font-bold text-base text-[#382211] dark:text-[#F3ECE4] truncate">
                                  {series.books.length > 0
                                    ? 'General Series Characters'
                                    : 'Characters'}
                                </h4>
                                <span className="text-xs font-sans-ui text-[#7A614D] dark:text-[#A68F7B] shrink-0">
                                  ({series.standaloneCharacters.length})
                                </span>
                              </div>
                              <div className="p-1 text-[#6D4C32] dark:text-[#C7A382]">
                                {isStandaloneExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>

                            {isStandaloneExpanded && (
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {series.standaloneCharacters.map(
                                    (character) => (
                                      <CharacterCard
                                        key={character.id}
                                        character={character}
                                        searchQuery={searchQuery}
                                        bookSeriesMap={bookSeriesMap}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onSelect={onSelect}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    /* Flat Alphabetical List of all characters from this Series */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#D8C7B0] dark:border-[#382312]">
                        <span className="text-xs font-sans-ui font-semibold text-[#664327] dark:text-[#D4A373]">
                          All Characters in {series.seriesName} (Alphabetical)
                        </span>
                        <span className="text-xs text-[#8A715C] dark:text-[#A68F7B]">
                          {series.allCharacters.length} total
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {series.allCharacters.map((character) => (
                          <CharacterCard
                            key={character.id}
                            character={character}
                            searchQuery={searchQuery}
                            bookSeriesMap={bookSeriesMap}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Button to return to top */}
      <ScrollToTopFab />
    </div>
  );
};
