import React from 'react';
import { Users, Sparkles, Feather } from 'lucide-react';

interface EmptyStateProps {
  onAddCharacter: () => void;
  onSeedSamples: () => void;
  isSeeding: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddCharacter,
  onSeedSamples,
  isSeeding,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 sm:p-10 bg-[#FAF4EB] dark:bg-[#20150D] border-2 border-[#DBC7AF] dark:border-[#382312] rounded-2xl text-center shadow-sm transition-colors">
      <div className="w-18 h-18 bg-[#EDE1D1] dark:bg-[#332013] text-[#694222] dark:text-[#D49E6F] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#CEB89F] dark:border-[#4E3420] shadow-inner">
        <Feather className="w-9 h-9" />
      </div>

      <h2 className="text-2xl font-bold font-heading text-[#3B2211] dark:text-[#F3ECE4] mb-2">
        Your Character Arc is Empty
      </h2>

      <p className="text-sm text-[#6E4F39] dark:text-[#B69F8B] font-sans-ui max-w-md mx-auto mb-8 leading-relaxed">
        Never lose the plot—or the people in it. Start keeping track of memorable characters across books and book series in your reading list.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 font-sans-ui">
        <button
          id="empty-add-character-btn"
          onClick={onAddCharacter}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#59371C] hover:bg-[#452912] dark:bg-[#A86E3E] dark:hover:bg-[#BF804C] text-[#FFFDF9] dark:text-[#180E07] font-semibold text-sm shadow-md transition-all border border-[#3E2310] dark:border-[#C68A57]"
        >
          <Users className="w-4 h-4 text-[#F3E7D8] dark:text-[#180E07]" />
          <span>Record First Character</span>
        </button>

        <button
          id="empty-seed-sample-btn"
          onClick={onSeedSamples}
          disabled={isSeeding}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#EBE0CF] hover:bg-[#DDD0BC] dark:bg-[#2F1F14] dark:hover:bg-[#3D291B] text-[#54361E] dark:text-[#E8D6C3] font-semibold text-sm transition-all border border-[#CDBBA3] dark:border-[#4A321E] disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4 text-[#8C6036] dark:text-[#D49E6F]" />
          <span>{isSeeding ? 'Loading Classics...' : 'Load Classic Book Characters'}</span>
        </button>
      </div>
    </div>
  );
};
