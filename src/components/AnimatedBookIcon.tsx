import React from 'react';
import { motion } from 'motion/react';

interface AnimatedBookIconProps {
  className?: string;
  size?: number;
}

export const AnimatedBookIcon: React.FC<AnimatedBookIconProps> = ({
  className = 'w-6 h-6',
  size = 24,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, perspective: 800 }}
      title="Character Arc"
      aria-label="Character Arc Animated Icon"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Leather Hardcover Backing */}
        <path
          d="M 3 24.5 C 3 23 4.2 21.5 6 21.5 L 15 21.5 L 15 27.5 L 6 27.5 C 4 27.5 3 26 3 24.5 Z"
          fill="#3B200E"
          stroke="#7A4B29"
          strokeWidth="1.2"
        />
        <path
          d="M 29 24.5 C 29 23 27.8 21.5 26 21.5 L 17 21.5 L 17 27.5 L 26 27.5 C 28 27.5 29 26 29 24.5 Z"
          fill="#3B200E"
          stroke="#7A4B29"
          strokeWidth="1.2"
        />

        {/* Central Spine */}
        <rect
          x="14.5"
          y="6.5"
          width="3"
          height="21.5"
          rx="1"
          fill="#522E14"
          stroke="#94653D"
          strokeWidth="0.8"
        />

        {/* Static Left Page Stack */}
        <path
          d="M 15 7.5 C 10.5 6.8 5.5 7.2 4 8 C 4 10 4 20 4 22 C 6 21.2 11 20.8 15 22.2 Z"
          fill="#F7F1E5"
          stroke="#D8C6AF"
          strokeWidth="0.8"
        />
        {/* Static Left Page Lines */}
        <line x1="6.5" y1="11" x2="12.5" y2="10.2" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="6.5" y1="14" x2="12.5" y2="13.2" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="6.5" y1="17" x2="11.5" y2="16.3" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />

        {/* Static Right Page Stack */}
        <path
          d="M 17 7.5 C 21.5 6.8 26.5 7.2 28 8 C 28 10 28 20 28 22 C 26 21.2 21 20.8 17 22.2 Z"
          fill="#FAF6ED"
          stroke="#D8C6AF"
          strokeWidth="0.8"
        />
        {/* Static Right Page Lines */}
        <line x1="19.5" y1="10.2" x2="25.5" y2="11" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="19.5" y1="13.2" x2="25.5" y2="14" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="19.5" y1="16.3" x2="24.5" y2="17" stroke="#C4B097" strokeWidth="0.75" strokeLinecap="round" />
      </svg>

      {/* Flipping Page 1 */}
      <motion.div
        className="absolute top-[22%] left-[50%] w-[40%] h-[50%] origin-left pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: [0, -180],
          opacity: [1, 1, 0.9, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 0.9, 1],
          delay: 0,
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-[#ECE2D0] via-[#FAF6ED] to-[#FFFDF9] rounded-r-xs border-r border-t border-b border-[#D6C4AC] shadow-xs flex flex-col justify-around py-0.5 px-1">
          <div className="w-4/5 h-[1px] bg-[#C5B39C]/70 rounded-full" />
          <div className="w-3/5 h-[1px] bg-[#C5B39C]/70 rounded-full" />
          <div className="w-2/3 h-[1px] bg-[#C5B39C]/70 rounded-full" />
        </div>
      </motion.div>

      {/* Flipping Page 2 */}
      <motion.div
        className="absolute top-[22%] left-[50%] w-[40%] h-[50%] origin-left pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: [0, -180],
          opacity: [1, 1, 0.9, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 0.9, 1],
          delay: 0.9,
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-[#ECE2D0] via-[#FAF6ED] to-[#FFFDF9] rounded-r-xs border-r border-t border-b border-[#D6C4AC] shadow-xs flex flex-col justify-around py-0.5 px-1">
          <div className="w-4/5 h-[1px] bg-[#C5B39C]/70 rounded-full" />
          <div className="w-3/5 h-[1px] bg-[#C5B39C]/70 rounded-full" />
          <div className="w-2/3 h-[1px] bg-[#C5B39C]/70 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};
