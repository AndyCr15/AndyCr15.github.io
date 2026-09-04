import React from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopFabProps {
  threshold?: number;
}

export const ScrollToTopFab: React.FC<ScrollToTopFabProps> = ({ threshold = 260 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      setIsVisible(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      id="return-to-top-fab"
      type="button"
      onClick={scrollToTop}
      aria-label="Return to top"
      title="Return to top"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#6D4C2B] hover:bg-[#54381C] dark:bg-[#A86E3E] dark:hover:bg-[#C0834E] text-[#FFFDF9] dark:text-[#180E07] shadow-xl border-2 border-[#4D3016] dark:border-[#C68A57] cursor-pointer transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-[#8C5E3B] focus:ring-offset-2"
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
};
