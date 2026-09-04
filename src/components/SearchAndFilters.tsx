import React from 'react';
import { Search, X, Users, Book, Library, Plus } from 'lucide-react';
import type { ListingViewType } from '../types';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  titlesOnly: boolean;
  onTitlesOnlyChange: (enabled: boolean) => void;
  activeView: ListingViewType;
  onViewChange: (view: ListingViewType) => void;
  counts: {
    characters: number;
    books: number;
    series: number;
  };
  onOpenAddModal: () => void;
  onOpenAddBookModal: () => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  titlesOnly,
  onTitlesOnlyChange,
  activeView,
  onViewChange,
  counts,
  onOpenAddModal,
  onOpenAddBookModal,
}) => {
  return (
    <div className="bg-[#FAF4EB] dark:bg-[#1C130B] border-b border-[#DFCBB5] dark:border-[#382312] py-5 px-4 sm:px-6 lg:px-8 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Search Bar Row & Add Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Universal Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B6B51] dark:text-[#A68971]">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="universal-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                titlesOnly
                  ? activeView === 'characters'
                    ? 'Search character names only...'
                    : activeView === 'books'
                    ? 'Search book titles only...'
                    : 'Search series titles only...'
                  : 'Search by character name, book, series, descriptions, or roles...'
              }
              className="w-full pl-10 pr-32 sm:pr-36 py-2.5 bg-[#FFFDF9] dark:bg-[#25180F] border-2 border-[#D6C4AD] dark:border-[#4A3220] focus:border-[#734B28] dark:focus:border-[#C49366] focus:ring-2 focus:ring-[#C79D77]/40 rounded-lg text-[#331E10] dark:text-[#F6EFE5] placeholder-[#9E8674] dark:placeholder-[#7A6451] text-sm font-sans-ui transition-all outline-hidden shadow-inner"
            />
            
            {/* Right inside controls: Clear button + 'Titles Only' toggle button */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 text-[#8B6B51] hover:text-[#4A2C17] dark:text-[#A68971] dark:hover:text-[#F5EBE0] cursor-pointer rounded-sm hover:bg-[#EFE5D8] dark:hover:bg-[#382312]"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                id="toggle-titles-only-btn"
                type="button"
                aria-pressed={titlesOnly}
                onClick={() => onTitlesOnlyChange(!titlesOnly)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-sans-ui transition-all border shadow-xs cursor-pointer select-none whitespace-nowrap ${
                  titlesOnly
                    ? 'bg-[#6D4C2B] text-[#FFFDF9] border-[#4D3016] dark:bg-[#C48749] dark:text-[#180E07] dark:border-[#E2A668] ring-2 ring-[#6D4C2B]/30'
                    : 'bg-[#EDE2D2] text-[#6E5038] border-[#D5C2AA] dark:bg-[#352215] dark:text-[#C7AB93] dark:border-[#523520] hover:bg-[#E2D5C2] dark:hover:bg-[#442B1B]'
                }`}
                title={
                  titlesOnly
                    ? 'Titles Only is ON (Restricted to character names, book titles, or series titles)'
                    : 'Titles Only is OFF (Full search across titles, descriptions, roles, and spoilers)'
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full ${titlesOnly ? 'bg-[#98FF98] dark:bg-[#180E07]' : 'bg-[#9C826E] dark:bg-[#7D6452]'}`} />
                <span>Titles Only</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Add Character & Add Book (Swapped) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              id="add-character-main-btn"
              onClick={onOpenAddModal}
              title="Record a new character"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-[#613D22] hover:bg-[#4E2E16] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FAF6F0] dark:text-[#180E07] font-sans-ui text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all border border-[#482813] dark:border-[#C68A57] active:scale-[0.98] cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#F3E7D8] dark:text-[#180E07]" />
              <span>Add Character</span>
            </button>

            <button
              id="add-book-main-btn"
              onClick={onOpenAddBookModal}
              title="Add a book and assign multiple characters"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-[#613D22] hover:bg-[#4E2E16] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FAF6F0] dark:text-[#180E07] font-sans-ui text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all border border-[#482813] dark:border-[#C68A57] active:scale-[0.98] cursor-pointer"
            >
              <Book className="w-4 h-4 text-[#F3E7D8] dark:text-[#180E07]" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* View Selection Buttons (Characters, Books, Book Series) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#EDE2D2] dark:bg-[#281A10] p-1 sm:p-1.5 rounded-lg border border-[#D8C7B0] dark:border-[#402B19] font-sans-ui">
            <button
              id="view-characters-btn"
              onClick={() => onViewChange('characters')}
              title={`Characters (${counts.characters})`}
              aria-label="View Characters Alphabetically"
              className={`flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
                activeView === 'characters'
                  ? 'bg-[#523319] dark:bg-[#8D582D] text-[#FFFDF9] shadow-sm border border-[#3E2410] dark:border-[#B37845]'
                  : 'text-[#5C3D24] dark:text-[#BAA38F] hover:text-[#2A170A] dark:hover:text-[#FAF6F0] hover:bg-[#DFD3C0] dark:hover:bg-[#382417]'
              }`}
            >
              <Users className="w-6 h-6 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Characters</span>
              <span
                className={`hidden sm:inline-flex text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeView === 'characters'
                    ? 'bg-[#704624] dark:bg-[#5C371A] text-[#F5EFEB]'
                    : 'bg-[#DCCBBA] dark:bg-[#3D2819] text-[#54361F] dark:text-[#D1BEAA]'
                }`}
              >
                {counts.characters}
              </span>
            </button>

            <button
              id="view-books-btn"
              onClick={() => onViewChange('books')}
              title={`Books (${counts.books})`}
              aria-label="View by Books"
              className={`flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
                activeView === 'books'
                  ? 'bg-[#523319] dark:bg-[#8D582D] text-[#FFFDF9] shadow-sm border border-[#3E2410] dark:border-[#B37845]'
                  : 'text-[#5C3D24] dark:text-[#BAA38F] hover:text-[#2A170A] dark:hover:text-[#FAF6F0] hover:bg-[#DFD3C0] dark:hover:bg-[#382417]'
              }`}
            >
              <Book className="w-6 h-6 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Books</span>
              <span
                className={`hidden sm:inline-flex text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeView === 'books'
                    ? 'bg-[#704624] dark:bg-[#5C371A] text-[#F5EFEB]'
                    : 'bg-[#DCCBBA] dark:bg-[#3D2819] text-[#54361F] dark:text-[#D1BEAA]'
                }`}
              >
                {counts.books}
              </span>
            </button>

            <button
              id="view-series-btn"
              onClick={() => onViewChange('series')}
              title={`Book Series (${counts.series})`}
              aria-label="View by Book Series"
              className={`flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
                activeView === 'series'
                  ? 'bg-[#523319] dark:bg-[#8D582D] text-[#FFFDF9] shadow-sm border border-[#3E2410] dark:border-[#B37845]'
                  : 'text-[#5C3D24] dark:text-[#BAA38F] hover:text-[#2A170A] dark:hover:text-[#FAF6F0] hover:bg-[#DFD3C0] dark:hover:bg-[#382417]'
              }`}
            >
              <Library className="w-6 h-6 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Book Series</span>
              <span
                className={`hidden sm:inline-flex text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeView === 'series'
                    ? 'bg-[#704624] dark:bg-[#5C371A] text-[#F5EFEB]'
                    : 'bg-[#DCCBBA] dark:bg-[#3D2819] text-[#54361F] dark:text-[#D1BEAA]'
                }`}
              >
                {counts.series}
              </span>
            </button>
          </div>

          {/* Context tip */}
          {searchQuery && (
            <div className="text-xs text-[#7A5B44] dark:text-[#A68F7B] font-sans-ui flex items-center gap-1.5">
              <span>
                Showing results for <strong className="text-[#38200F] dark:text-[#FAF6F0]">"{searchQuery}"</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
