import React from 'react';
import { AlertTriangle, Eye, EyeOff, Lock, Unlock, ShieldAlert } from 'lucide-react';

interface SpoilerBoxProps {
  spoilers?: string;
  className?: string;
  isCompact?: boolean; // For card view
  searchQuery?: string;
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

export const SpoilerBox: React.FC<SpoilerBoxProps> = ({
  spoilers,
  className = '',
  isCompact = false,
  searchQuery,
}) => {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [isPressing, setIsPressing] = React.useState(false);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = React.useRef(false);

  if (!spoilers || !spoilers.trim()) return null;

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isLongPressTriggeredRef.current = false;
    setIsPressing(true);

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsRevealed((prev) => !prev);
      setIsPressing(false);
    }, 400);
  };

  const endPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    setIsRevealed((prev) => !prev);
  };

  return (
    <div className={`select-none transition-all ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* The SPOILERS Button */}
      <div className="relative inline-block w-full">
        <button
          type="button"
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchCancel={endPress}
          title={isRevealed ? "Click or hold SPOILERS to hide" : "Click or long press SPOILERS to reveal"}
          className={`relative overflow-hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-sans-ui text-xs font-bold transition-all border shadow-xs cursor-pointer ${
            isRevealed
              ? 'bg-[#FBECEB] dark:bg-[#341614] border-[#E8AAA4] dark:border-[#6B241E] text-[#8C2317] dark:text-[#F29489] hover:bg-[#F7D8D5] dark:hover:bg-[#421B19]'
              : 'bg-[#F2E5D4] dark:bg-[#281A10] border-[#D6BFAB] dark:border-[#482E1A] text-[#693E1B] dark:text-[#E2BD96] hover:bg-[#E8D9C5] dark:hover:bg-[#332014]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${isRevealed ? 'text-[#C53F32] dark:text-[#E86D61]' : 'text-[#8C5224] dark:text-[#C78B55]'}`} />
            <span className="font-heading font-extrabold tracking-wider uppercase">
              SPOILERS
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans-ui font-semibold ${
                isRevealed
                  ? 'bg-[#F4D2CE] dark:bg-[#521E19] text-[#7A1E14] dark:text-[#FFA99F]'
                  : 'bg-[#E2D2BE] dark:bg-[#382315] text-[#54351B] dark:text-[#D1BAA3]'
              }`}
            >
              {isRevealed ? 'Revealed' : 'Veiled'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-normal text-[#8A6A51] dark:text-[#A68F7A]">
            {isRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tap/hold to hide</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tap/hold to reveal</span>
              </>
            )}
          </div>

          {/* Progress bar during long press */}
          {isPressing && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D2BBA3] dark:bg-[#4E3420] overflow-hidden">
              <div className="h-full bg-[#8E3224] dark:bg-[#E86D61] animate-[progress_0.4s_linear_forwards]" />
            </div>
          )}
        </button>
      </div>

      {/* Revealed Spoilers Content Box */}
      {isRevealed && (
        <div className={`mt-2 p-3.5 rounded-lg bg-[#FAF1EE] dark:bg-[#2B1513] border border-[#E8C0BB] dark:border-[#5C231E] text-[#4A1E1A] dark:text-[#F3CCC7] animate-in fade-in slide-in-from-top-1 duration-200 ${
          isCompact ? 'text-xs' : 'text-sm'
        }`}>
          <p className={`leading-relaxed font-serif ${isCompact ? 'line-clamp-6' : 'whitespace-pre-wrap'}`}>
            {highlightMatch(spoilers, searchQuery)}
          </p>
        </div>
      )}
    </div>
  );
};
