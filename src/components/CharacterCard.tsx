import React from 'react';
import { Book, Library, Edit2, Trash2, Shield, BookOpen, Layers } from 'lucide-react';
import type { Character } from '../types';
import { SpoilerBox } from './SpoilerBox';
import { getCharacterSeries } from '../lib/grouping';

interface CharacterCardProps {
  character: Character;
  searchQuery?: string;
  bookSeriesMap?: Record<string, string[]>;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
  onSelect: (character: Character) => void;
}

function highlightMatch(text: string, query?: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  const before = text.substring(0, index);
  const matched = text.substring(index, index + q.length);
  const after = text.substring(index + q.length);

  return (
    <>
      {before}
      <mark className="bg-[#E8C28A] dark:bg-[#7E5224] text-[#2E190B] dark:text-[#FBF4EC] px-0.5 rounded font-semibold">
        {matched}
      </mark>
      {highlightMatch(after, query)}
    </>
  );
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  searchQuery,
  bookSeriesMap = {},
  onEdit,
  onDelete,
  onSelect,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(character);
  };

  // Extract books array
  const booksList = Array.isArray(character.books) && character.books.length > 0
    ? character.books
    : (character.book ? [character.book] : []);

  // Derive series by seeing what books they are in and what series those books are in
  const seriesList = getCharacterSeries(character, bookSeriesMap);

  return (
    <div
      id={`character-card-${character.id}`}
      onClick={() => onSelect(character)}
      className="group relative bg-[#FDFBF7] dark:bg-[#22170F] hover:bg-[#FFFDF9] dark:hover:bg-[#2A1D13] border border-[#DFCBB5] dark:border-[#3E2919] hover:border-[#9E6F4A] dark:hover:border-[#C49366] rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Decorative Book Page Trim Edge Accent */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#8C5E3C] dark:bg-[#B57C4F] group-hover:bg-[#B3794D] dark:group-hover:bg-[#DDA273] transition-colors" />

      <div>
        {/* Top Header Row: Name & Quick Actions */}
        <div className="flex items-start justify-between gap-2 mb-2 pl-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#3B2211] dark:text-[#F3ECE4] group-hover:text-[#693E1B] dark:group-hover:text-[#E8BD96] transition-colors tracking-wide leading-snug font-heading truncate">
              {highlightMatch(character.name, searchQuery)}
            </h3>
            {character.role && (
              <span className="inline-flex items-center gap-1 text-[11px] font-sans-ui font-medium uppercase tracking-wider text-[#8A5E3C] dark:text-[#C7966F] mt-0.5">
                <Shield className="w-3 h-3 text-[#A87954] dark:text-[#C7966F]" />
                {character.role}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id={`edit-char-${character.id}`}
              onClick={() => onEdit(character)}
              title="Edit Character"
              className="p-1.5 text-[#85654C] dark:text-[#B69F8B] hover:text-[#38200F] dark:hover:text-[#FAF6F0] hover:bg-[#EFE4D6] dark:hover:bg-[#382312] rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id={`delete-char-${character.id}`}
              onClick={handleDelete}
              title="Delete Character"
              className="p-1.5 text-[#A2574A] dark:text-[#D87D73] hover:text-[#7A1E12] dark:hover:text-[#F8A096] hover:bg-[#FCE8E6] dark:hover:bg-[#481E1A] rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="pl-2 mt-2 mb-3">
          <p className="text-sm text-[#4E3524] dark:text-[#D1BEAA] leading-relaxed line-clamp-3 font-serif">
            {highlightMatch(character.description, searchQuery)}
          </p>
        </div>

        {/* Spoilers Box (Hidden by default, revealed on long press/click) */}
        {character.spoilers && character.spoilers.trim() && (
          <div className="pl-2 mb-3">
            <SpoilerBox
              spoilers={character.spoilers}
              isCompact={true}
              searchQuery={searchQuery}
            />
          </div>
        )}
      </div>

      {/* Footer Tags for Books & Series */}
      <div className="pl-2 pt-3 border-t border-[#EFE5D8] dark:border-[#382312] flex flex-wrap gap-1.5 items-center font-sans-ui">
        {booksList.length > 0 ? (
          booksList.length > 3 ? (
            <>
              {booksList.slice(0, 2).map((b, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#EFE4D4] dark:bg-[#332013] text-[#54341B] dark:text-[#E8D6C3] border border-[#DBC7AF] dark:border-[#4E3420] max-w-[180px] truncate"
                  title={`Book: ${b}`}
                >
                  <Book className="w-3 h-3 text-[#885935] dark:text-[#D49E6F] shrink-0" />
                  <span className="truncate">{highlightMatch(b, searchQuery)}</span>
                </span>
              ))}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#E8DCCB] dark:bg-[#382314] text-[#5C391D] dark:text-[#E8D4C1] border border-[#D5BF9F] dark:border-[#54361E] cursor-help"
                title={`All books: ${booksList.join(', ')}`}
              >
                <BookOpen className="w-3 h-3 text-[#885935] dark:text-[#D49E6F] shrink-0" />
                <span>And {booksList.length - 2} more books</span>
              </span>
            </>
          ) : (
            booksList.map((b, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#EFE4D4] dark:bg-[#332013] text-[#54341B] dark:text-[#E8D6C3] border border-[#DBC7AF] dark:border-[#4E3420] max-w-[200px] truncate"
                title={`Book: ${b}`}
              >
                <Book className="w-3 h-3 text-[#885935] dark:text-[#D49E6F] shrink-0" />
                <span className="truncate">{highlightMatch(b, searchQuery)}</span>
              </span>
            ))
          )
        ) : (
          <span className="text-[11px] text-[#A6907D] dark:text-[#7D6652] italic">No book specified</span>
        )}

        {seriesList.length > 0 &&
          seriesList.map((s, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#EAD5C3] dark:bg-[#381F14] text-[#4A1D0E] dark:text-[#FAD8C8] border border-[#CCA78E] dark:border-[#5E3220] max-w-[200px] truncate"
              title={`Series: ${s}`}
            >
              <Library className="w-3 h-3 text-[#8C3B1F] dark:text-[#F39572] shrink-0" />
              <span className="truncate">{highlightMatch(s, searchQuery)}</span>
            </span>
          ))}
      </div>
    </div>
  );
};
