import React from 'react';
import { X, Book, Library, Edit2, Trash2, Shield, Calendar, Feather, BookOpen, Layers } from 'lucide-react';
import type { Character } from '../types';
import { SpoilerBox } from './SpoilerBox';
import { getCharacterSeries } from '../lib/grouping';

interface CharacterDetailModalProps {
  character: Character | null;
  bookSeriesMap?: Record<string, string[]>;
  onClose: () => void;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  bookSeriesMap = {},
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!character) return null;

  const handleDelete = () => {
    onDelete(character);
  };

  const handleEdit = () => {
    onEdit(character);
    onClose();
  };

  const formattedDate = character.createdAt
    ? new Date(character.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const booksList = Array.isArray(character.books) && character.books.length > 0
    ? character.books
    : (character.book ? [character.book] : []);

  // Derive series by checking books and bookSeriesMap
  const seriesList = getCharacterSeries(character, bookSeriesMap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#FCFAF6] dark:bg-[#1E140C] text-[#38200F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-4 border-[#C9B39B] dark:border-[#422C1A] overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Book Page Top Binding Banner */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center border border-[#6D492A] dark:border-[#382312]">
              <Feather className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest font-heading text-[#DDC8B1]">
              Character Chronicle
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parchment Inner Page */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 font-sans-ui">
          {/* Header with Title and Tags */}
          <div className="border-b-2 border-[#E5D7C5] dark:border-[#382312] pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#38200F] dark:text-[#F6EFE5] font-heading tracking-wide">
                  {character.name}
                </h1>
                {character.role && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#7A4E2C] dark:text-[#D49E6F] mt-2 px-2.5 py-0.5 rounded-full bg-[#EFE3D3] dark:bg-[#332013] border border-[#D9C4AC] dark:border-[#4E3420]">
                    <Shield className="w-3 h-3 text-[#9E6E49] dark:text-[#D49E6F]" />
                    {character.role}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE2D2] dark:bg-[#332013] hover:bg-[#E0D2BE] dark:hover:bg-[#422B19] text-[#4A2D17] dark:text-[#E8D4C1] text-xs font-semibold border border-[#CEBAA2] dark:border-[#4E3420] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FBEAE8] dark:bg-[#3B1713] hover:bg-[#F7D4CF] dark:hover:bg-[#4F201B] text-[#8F2618] dark:text-[#F29489] text-xs font-semibold border border-[#EAC2BD] dark:border-[#6B2820] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Books & Series Badges */}
            <div className="space-y-3 mt-4 text-xs">
              {/* Books */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A5A43] dark:text-[#A6907D] mb-1.5">
                  Appears in Books:
                </span>
                <div className="flex flex-wrap gap-2">
                  {booksList.length > 0 ? (
                    booksList.map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0E6D8] dark:bg-[#2B1B10] border border-[#D9C6B0] dark:border-[#452D1B] text-[#4A2F17] dark:text-[#E8D6C3]"
                      >
                        <Book className="w-4 h-4 text-[#845633] dark:text-[#C78A53]" />
                        <span>
                          <strong className="text-[#331D0B] dark:text-[#FAF6F0]">{b}</strong>
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#9E8573] dark:text-[#7A6655] italic">No book specified</span>
                  )}
                </div>
              </div>

              {/* Series */}
              {seriesList.length > 0 && (
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A5A43] dark:text-[#A6907D] mb-1.5">
                    Part of Series:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {seriesList.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAD5C3] dark:bg-[#381F14] border border-[#CCA78E] dark:border-[#5E3220] text-[#4A1D0E] dark:text-[#FAD8C8]"
                      >
                        <Library className="w-4 h-4 text-[#8C3B1F] dark:text-[#F39572]" />
                        <span>
                          <strong className="text-[#35140A] dark:text-[#FFF0E8]">{s}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description / Story Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#69482F] dark:text-[#C7A382] flex items-center gap-1.5">
              <span>Description & Notes</span>
            </h3>
            <div className="p-5 rounded-xl bg-[#F6EFE5] dark:bg-[#24170E] border border-[#E2D4C2] dark:border-[#3B2516] text-[#3D2513] dark:text-[#DFD3C4] text-base leading-relaxed font-serif whitespace-pre-wrap">
              {character.description}
            </div>
          </div>

          {/* Spoilers Section (Hidden by default, revealed on long press/click) */}
          {character.spoilers && character.spoilers.trim() && (
            <div className="space-y-2">
              <SpoilerBox
                spoilers={character.spoilers}
                isCompact={false}
              />
            </div>
          )}

          {/* Footer Metadata */}
          {formattedDate && (
            <div className="pt-3 border-t border-[#EFE5D8] dark:border-[#382312] flex items-center justify-between text-xs text-[#8F7460] dark:text-[#8E7966]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A88C78] dark:text-[#8E7966]" />
                <span>Recorded on {formattedDate}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
