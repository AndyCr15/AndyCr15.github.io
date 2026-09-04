import React from 'react';
import { Trash2, AlertTriangle, X, Book, Library, Shield } from 'lucide-react';
import type { Character } from '../types';

interface DeleteConfirmationModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (character: Character) => Promise<void>;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  character,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen || !character) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete(character);
      onClose();
    } catch (err: any) {
      console.error('Failed to delete character:', err);
      setError(err?.message || 'Failed to delete character from journal. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract books array
  const booksList = Array.isArray(character.books) && character.books.length > 0
    ? character.books
    : (character.book ? [character.book] : []);

  // Extract series array
  const seriesList = Array.isArray(character.series)
    ? character.series
    : [];

  return (
    <div
      id="delete-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#23150C]/75 dark:bg-[#0E0804]/85 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="delete-confirmation-dialog"
        className="relative w-full max-w-lg bg-[#FCFAF6] dark:bg-[#1E140C] text-[#38200F] dark:text-[#EAE0D3] rounded-2xl shadow-2xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] px-6 py-4 flex items-center justify-between border-b-2 border-[#38210F] dark:border-[#0F0804]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7A261A] dark:bg-[#5C1A12] text-[#FCE8E6] flex items-center justify-center border border-[#9E392B] dark:border-[#7A261A]">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider font-heading text-[#FAF5EE]">
              Delete Character Record
            </span>
          </div>
          <button
            id="close-delete-modal-btn"
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#D1BEAA] hover:text-[#FFFFFF] p-1.5 rounded-md hover:bg-[#3D2511] dark:hover:bg-[#25170E] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 font-sans-ui">
          {error && (
            <div className="p-3 bg-[#FBEAE8] dark:bg-[#3B1713] border border-[#E8ADA7] dark:border-[#6B2820] rounded-lg text-xs text-[#9B2C1E] dark:text-[#F29489]">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-[#F6EFE5] dark:bg-[#251910] border border-[#E2D4C2] dark:border-[#3E2919]">
            <div className="w-10 h-10 rounded-xl bg-[#FCE8E6] dark:bg-[#3B1713] text-[#8F2618] dark:text-[#F29489] flex items-center justify-center shrink-0 border border-[#EAC2BD] dark:border-[#6B2820]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#38200F] dark:text-[#F6EFE5]">
                Are you sure you want to remove this character?
              </p>
              <p className="text-xs text-[#6B503B] dark:text-[#A68F7B] leading-relaxed">
                This will permanently delete this character profile and remove them from all associated book and series listings in your cloud journal.
              </p>
            </div>
          </div>

          {/* Character Preview Card */}
          <div className="p-4 rounded-xl bg-[#FAF6F0] dark:bg-[#1A110A] border border-[#DECDB8] dark:border-[#382312] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading font-bold text-lg text-[#3B2211] dark:text-[#FAF5EE]">
                {character.name}
              </h3>
              {character.role && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A4E2C] dark:text-[#D49E6F] px-2 py-0.5 rounded bg-[#EFE3D3] dark:bg-[#332013]">
                  <Shield className="w-3 h-3" />
                  {character.role}
                </span>
              )}
            </div>

            {character.description && (
              <p className="text-xs text-[#593E2B] dark:text-[#BFA993] line-clamp-2 font-serif italic">
                "{character.description}"
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              {booksList.map((b, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EAE0D1] dark:bg-[#2B1B10] text-[#4A2F17] dark:text-[#D49E6F] border border-[#D9C6B0] dark:border-[#452D1B]"
                >
                  <Book className="w-3 h-3" />
                  <span>{b}</span>
                </span>
              ))}
              {seriesList.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EAE4D1] dark:bg-[#292215] text-[#4E411F] dark:text-[#D4B96F] border border-[#D5CCA8] dark:border-[#473B20]"
                >
                  <Library className="w-3 h-3" />
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-delete-character-btn"
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-[#EDE2D2] hover:bg-[#E0D2BE] dark:bg-[#332013] dark:hover:bg-[#422B19] text-[#4A2D17] dark:text-[#E8D4C1] text-xs font-semibold border border-[#CEBAA2] dark:border-[#4E3420] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-character-btn"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8F2618] hover:bg-[#781E12] dark:bg-[#A63525] dark:hover:bg-[#BD402F] text-[#FFFDF9] text-xs font-bold uppercase tracking-wider shadow-md transition-all border border-[#6B1B10] dark:border-[#BD402F] disabled:opacity-60 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting Character...' : 'Yes, Delete Character'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
