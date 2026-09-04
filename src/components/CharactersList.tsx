import React from 'react';
import type { Character } from '../types';
import { CharacterCard } from './CharacterCard';
import { groupCharactersByLetter } from '../lib/grouping';
import { Users, Sparkles, ArrowDownAZ, Clock } from 'lucide-react';
import { ScrollToTopFab } from './ScrollToTopFab';

interface CharactersListProps {
  characters: Character[];
  searchQuery: string;
  bookSeriesMap?: Record<string, string[]>;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
  onSelect: (character: Character) => void;
  onOpenAddModal: () => void;
}

export const CharactersList: React.FC<CharactersListProps> = ({
  characters,
  searchQuery,
  bookSeriesMap = {},
  onEdit,
  onDelete,
  onSelect,
  onOpenAddModal,
}) => {
  const [sortBy, setSortBy] = React.useState<'alphabetical' | 'recent'>('alphabetical');
  const [activeLetter, setActiveLetter] = React.useState<string | null>(null);

  const letterGroups = React.useMemo(() => {
    return groupCharactersByLetter(characters);
  }, [characters]);

  const recentCharacters = React.useMemo(() => {
    return [...characters].sort((a, b) => {
      const timeA = Math.max(a.updatedAt || 0, a.createdAt || 0);
      const timeB = Math.max(b.updatedAt || 0, b.createdAt || 0);
      return timeB - timeA;
    });
  }, [characters]);

  const letters = Object.keys(letterGroups).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  const allAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

  // Track the visible letter section as the reader scrolls
  React.useEffect(() => {
    if (sortBy !== 'alphabetical') return;

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

    letters.forEach((letter) => {
      const el = document.getElementById(`letter-group-${letter}`);
      if (el) {
        el.setAttribute('data-letter', letter);
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [letters, sortBy]);

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    if (sortBy !== 'alphabetical') {
      setSortBy('alphabetical');
      setTimeout(() => {
        const el = document.getElementById(`letter-group-${letter}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }
    const el = document.getElementById(`letter-group-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (characters.length === 0) {
    return (
      <div className="bg-[#FAF4EB] dark:bg-[#20150D] border border-[#DFCBB5] dark:border-[#382312] rounded-2xl p-12 text-center my-8 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-[#EDE1D1] dark:bg-[#332013] text-[#7A5131] dark:text-[#D49E6F] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#CEB89F] dark:border-[#4E3420]">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#3B2211] dark:text-[#F3ECE4] font-heading mb-2">
          {searchQuery ? 'No Matching Characters Found' : 'No Characters Recorded Yet'}
        </h3>
        <p className="text-sm text-[#73553F] dark:text-[#B69F8B] mb-6 font-sans-ui max-w-md mx-auto">
          {searchQuery
            ? `No characters found matching "${searchQuery}". Try a different name, book, or series.`
            : 'Begin cataloging the heroes, villains, companions, and mentors from the books you are reading.'}
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#613D22] hover:bg-[#4E2E16] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FAF6F0] dark:text-[#180E07] font-sans-ui text-sm font-semibold tracking-wide shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Record First Character</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alphabet & Sort Quick Jump Ribbon - sticky and visible while scrolling */}
      <div
        id="characters-alphabet-jump-bar"
        className="sticky top-[72px] z-20 bg-[#F8F4EE]/95 dark:bg-[#1A110A]/95 backdrop-blur-md border border-[#DFCBB5] dark:border-[#382312] rounded-xl p-2.5 sm:p-3 shadow-sm transition-colors flex flex-wrap items-center justify-between gap-2.5 font-sans-ui"
      >
        {/* Sort Order Graphical Icons - vertically aligned with alphabet */}
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Sort characters">
          <button
            id="sort-alphabetical-btn"
            type="button"
            onClick={() => setSortBy('alphabetical')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all border shadow-xs cursor-pointer ${
              sortBy === 'alphabetical'
                ? 'bg-[#6D4C2B] text-[#FFFDF9] dark:bg-[#D49E6F] dark:text-[#180E07] border-[#4A2D16] dark:border-[#BF804C] ring-2 ring-[#6D4C2B]/30 font-bold'
                : 'bg-[#FAF5ED] dark:bg-[#25180F] hover:bg-[#FFFFFF] dark:hover:bg-[#382316] text-[#634226] dark:text-[#E8D4C1] border-[#D5C2AA] dark:border-[#4B3420] opacity-75 hover:opacity-100'
            }`}
            title="Sort alphabetically (A-Z)"
            aria-label="Sort alphabetically (A-Z)"
            aria-pressed={sortBy === 'alphabetical'}
          >
            <ArrowDownAZ className="w-4 h-4" />
          </button>
          <button
            id="sort-recent-btn"
            type="button"
            onClick={() => setSortBy('recent')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all border shadow-xs cursor-pointer ${
              sortBy === 'recent'
                ? 'bg-[#6D4C2B] text-[#FFFDF9] dark:bg-[#D49E6F] dark:text-[#180E07] border-[#4A2D16] dark:border-[#BF804C] ring-2 ring-[#6D4C2B]/30 font-bold'
                : 'bg-[#FAF5ED] dark:bg-[#25180F] hover:bg-[#FFFFFF] dark:hover:bg-[#382316] text-[#634226] dark:text-[#E8D4C1] border-[#D5C2AA] dark:border-[#4B3420] opacity-75 hover:opacity-100'
            }`}
            title="Sort by most recently added"
            aria-label="Sort by most recently added"
            aria-pressed={sortBy === 'recent'}
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* Subtle vertical separator */}
        <div className="h-5 w-px bg-[#D5C2AA] dark:bg-[#4B3420] shrink-0" />

        {/* Jump To Alphabet Letters */}
        <div
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 flex-1 min-w-[260px]"
          role="navigation"
          aria-label="Alphabetical Character Jump Index"
        >
          <span className="text-xs font-semibold text-[#66462C] dark:text-[#C7A382] mr-1 uppercase tracking-wider hidden md:inline">
            Jump to:
          </span>
          {allAlphabet.map((letter) => {
            const hasEntries = !!letterGroups[letter];
            const isActive = sortBy === 'alphabetical' && activeLetter === letter;
            const count = letterGroups[letter]?.length || 0;
            return (
              <button
                key={letter}
                id={`char-jump-${letter === '#' ? 'hash' : letter.toLowerCase()}`}
                type="button"
                onClick={() => scrollToLetter(letter)}
                disabled={!hasEntries}
                title={
                  hasEntries
                    ? `Jump to characters starting with ${letter} (${count} ${count === 1 ? 'character' : 'characters'})`
                    : `No characters starting with ${letter}`
                }
                aria-label={`Jump to characters starting with ${letter}`}
                className={`min-w-6 h-7 sm:min-w-7 sm:h-8 px-1 text-xs font-bold font-sans-ui rounded-md flex items-center justify-center transition-all ${
                  !hasEntries
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
      </div>

      {/* Content Rendering based on Sort Choice */}
      {sortBy === 'alphabetical' ? (
        /* Alphabetical Group Sections */
        <div className="space-y-10">
          {letters.map((letter) => {
            const charGroup = letterGroups[letter];
            return (
              <section
                key={letter}
                id={`letter-group-${letter}`}
                data-letter={letter}
                className="scroll-mt-36"
              >
                {/* Section Letter Header */}
                <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-[#D6C1AA] dark:border-[#3E2919]">
                  <span className="w-9 h-9 rounded-lg bg-[#59371C] dark:bg-[#8D582D] text-[#FAF5EE] dark:text-[#FFFDF9] font-heading font-bold text-lg flex items-center justify-center shadow-inner">
                    {letter}
                  </span>
                  <span className="text-sm font-sans-ui font-semibold text-[#735136] dark:text-[#C7A382]">
                    {charGroup.length} {charGroup.length === 1 ? 'Character' : 'Characters'}
                  </span>
                  <div className="flex-1 h-px bg-[#E3D1BE] dark:bg-[#332013]" />
                </div>

                {/* Grid of character cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {charGroup.map((character) => (
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
              </section>
            );
          })}
        </div>
      ) : (
        /* Most Recent Sorted Section */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#D6C1AA] dark:border-[#3E2919]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans-ui font-bold uppercase tracking-wider text-[#694426] dark:text-[#D4A373]">
                Most Recently Added / Updated
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5D6C4] dark:bg-[#332013] text-[#593920] dark:text-[#D5B89B] font-semibold">
                {recentCharacters.length} {recentCharacters.length === 1 ? 'Character' : 'Characters'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentCharacters.map((character) => (
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

      {/* Floating Action Button to return to top */}
      <ScrollToTopFab />
    </div>
  );
};
