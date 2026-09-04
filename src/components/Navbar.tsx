import React from 'react';
import type { User } from 'firebase/auth';
import { 
  BookOpen, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Bookmark, 
  Check, 
  BookText, 
  Library,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { signInWithGoogle, signOutUser } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { AnimatedBookIcon } from './AnimatedBookIcon';

interface NavbarProps {
  user: User | null;
  loading: boolean;
  totalCharacters: number;
  onSeedSampleData?: () => void;
  isSeeding?: boolean;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  loading,
  totalCharacters,
  onSeedSampleData,
  isSeeding = false,
  onOpenExport,
  onOpenImport,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Close drawer on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setMenuOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="bg-[#4E3118] dark:bg-[#1C120A] text-[#FAF6F0] border-b-4 border-[#37200D] dark:border-[#120B06] shadow-lg sticky top-0 z-30 transition-colors duration-200">
        {/* Decorative antique gold top border line */}
        <div className="h-1 bg-gradient-to-r from-[#A27B5C] via-[#DCD7C9] dark:via-[#9C754F] to-[#A27B5C]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-2">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-lg bg-[#38220F] dark:bg-[#140D07] border border-[#785338] dark:border-[#422B19] flex items-center justify-center shadow-inner text-[#E7D2BC] overflow-hidden">
                <AnimatedBookIcon size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-wider font-heading text-[#FBF8F3]">
                    Character Arc
                  </h1>
                </div>
                <p className="text-xs text-[#CFB9A3] dark:text-[#A8927D] font-sans-ui hidden sm:block italic">
                  Never lose the plot—or the people in it.
                </p>
              </div>
            </div>

            {/* Right side actions: User badge & Hamburger Menu */}
            <div className="flex items-center space-x-3 font-sans-ui">
              {user ? (
                <div className="flex items-center bg-[#3D2511] dark:bg-[#150D07] border border-[#6E492E] dark:border-[#3A2210] rounded-full py-1 px-3 shadow-inner">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Reader'}
                      className="w-7 h-7 rounded-full border border-[#9E7658] mr-2 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#6B4423] text-[#FAF6F0] flex items-center justify-center font-bold text-xs mr-2">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left mr-1 hidden sm:block">
                    <p className="text-xs font-medium text-[#F4ECE1] leading-tight truncate max-w-[120px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#AFA193]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Cloud Synced</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  id="google-signin-navbar-btn"
                  onClick={handleSignIn}
                  disabled={isSigningIn || loading}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#F2ECE1] hover:bg-[#FFFFFF] text-[#3D220F] text-xs font-bold uppercase tracking-wider shadow-md transition-all border border-[#D9C8B2] hover:shadow-lg disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-[#8B4513]" />
                  <span>{isSigningIn ? 'Signing In...' : 'Sign In'}</span>
                </button>
              )}

              {/* Hamburger Menu Toggle Button */}
              <button
                id="hamburger-menu-btn"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="p-2 rounded-lg bg-[#38220F] dark:bg-[#160E08] hover:bg-[#523318] dark:hover:bg-[#2C1B10] text-[#E8D6C3] hover:text-[#FFFFFF] border border-[#6E492E] dark:border-[#3D2413] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A27B5C]"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {authError && (
          <div className="bg-[#78281F] text-white text-xs px-4 py-1 text-center font-sans-ui">
            {authError}
          </div>
        )}
      </header>

      {/* Hamburger Slide-Over Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans-ui">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] shadow-2xl border-l border-[#D6C4AC] dark:border-[#382312] flex flex-col transition-colors duration-200">
              
              {/* Header */}
              <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FAF6F0] p-4 flex items-center justify-between border-b border-[#38210E]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#38220F] dark:bg-[#1A1008] border border-[#6D492A] dark:border-[#382010] flex items-center justify-center text-[#E7D2BC]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm tracking-wide">Journal Settings</h2>
                    <p className="text-[11px] text-[#C4B09B]">Preferences & Actions</p>
                  </div>
                </div>
                <button
                  id="close-hamburger-menu-btn"
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-md text-[#D1BEAA] hover:text-[#FFFFFF] hover:bg-[#3D2511] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Theme Switcher Section */}
                <div className="bg-[#EFE8DC] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#422C1A]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#63432B] dark:text-[#C7A382]">
                      Appearance Theme
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E2D4C3] dark:bg-[#3B2516] text-[#4E3118] dark:text-[#E2CBB7]">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5038] dark:text-[#A89481] mb-3 leading-relaxed">
                    Toggle between warm parchment light mode and deep antique tome dark mode.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Light Option Button */}
                    <button
                      id="theme-light-btn"
                      onClick={() => !isDark || toggleTheme()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        !isDark
                          ? 'bg-[#FAF6F0] text-[#38220F] border-[#8B5A36] shadow-sm ring-2 ring-[#8B5A36]/30'
                          : 'bg-[#DFD5C6] dark:bg-[#1F140C] text-[#6E5540] dark:text-[#A89481] border-transparent hover:border-[#BFAF9E]'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-[#C27E38]" />
                      <span>Warm Parchment</span>
                      {!isDark && <Check className="w-3.5 h-3.5 ml-auto text-[#8B5A36]" />}
                    </button>

                    {/* Dark Option Button */}
                    <button
                      id="theme-dark-btn"
                      onClick={() => isDark || toggleTheme()}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        isDark
                          ? 'bg-[#180E07] text-[#EDE0D2] border-[#C49366] shadow-sm ring-2 ring-[#C49366]/30'
                          : 'bg-[#DFD5C6] dark:bg-[#1F140C] text-[#6E5540] dark:text-[#A89481] border-transparent hover:border-[#BFAF9E]'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-[#D8A776]" />
                      <span>Antique Tome</span>
                      {isDark && <Check className="w-3.5 h-3.5 ml-auto text-[#C49366]" />}
                    </button>
                  </div>
                </div>

                {/* Account Details */}
                {user ? (
                  <div className="bg-[#EFE8DC] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#422C1A] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#63432B] dark:text-[#C7A382] block">
                      Google Account
                    </span>
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Reader'}
                          className="w-10 h-10 rounded-full border-2 border-[#9E7658] object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#6B4423] text-[#FAF6F0] flex items-center justify-center font-bold text-sm">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-[#38220F] dark:text-[#F4ECE1] truncate">
                          {user.displayName || 'Reader'}
                        </p>
                        <p className="text-xs text-[#6B5038] dark:text-[#B69F8B] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#D5C2AA]/60 dark:border-[#3E2919]">
                      <button
                        id="menu-signout-btn"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#DECEBC] dark:bg-[#382312] hover:bg-[#CFB9A3] dark:hover:bg-[#4E311A] text-[#4E3118] dark:text-[#E8D4C1] text-xs font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#EFE8DC] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#422C1A]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#63432B] dark:text-[#C7A382] block mb-1">
                      Cloud Sync
                    </span>
                    <p className="text-xs text-[#6B5038] dark:text-[#A89481] mb-3">
                      Sign in to store your literary character entries securely in the cloud across all your devices.
                    </p>
                    <button
                      id="menu-signin-btn"
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#84563C] hover:bg-[#966447] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isSigningIn ? 'Signing In...' : 'Sign In with Google'}</span>
                    </button>
                  </div>
                )}

                {/* Data Backup & Portability (CSV Export & Import) */}
                <div className="bg-[#EFE8DC] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#422C1A] space-y-2.5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#63432B] dark:text-[#C7A382] block">
                      Data Portability & Backup
                    </span>
                    <p className="text-xs text-[#6B5038] dark:text-[#A89481] mt-0.5">
                      Export records to spreadsheet CSV or import character dossiers from file.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="menu-export-csv-btn"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenExport?.();
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#DECEBC] dark:bg-[#382312] hover:bg-[#CFB9A3] dark:hover:bg-[#4E311A] text-[#38220F] dark:text-[#E8D4C1] text-xs font-bold transition-colors cursor-pointer border border-[#CDBAA5] dark:border-[#4A2F18]"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      id="menu-import-csv-btn"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenImport?.();
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#DECEBC] dark:bg-[#382312] hover:bg-[#CFB9A3] dark:hover:bg-[#4E311A] text-[#38220F] dark:text-[#E8D4C1] text-xs font-bold transition-colors cursor-pointer border border-[#CDBAA5] dark:border-[#4A2F18]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />
                      <span>Import CSV</span>
                    </button>
                  </div>
                </div>

                {/* Literary Tools & Sample Seeding */}
                {user && onSeedSampleData && (
                  <div className="bg-[#EFE8DC] dark:bg-[#2A1D13] p-4 rounded-xl border border-[#D5C2AA] dark:border-[#422C1A]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#63432B] dark:text-[#C7A382] block mb-1">
                      Sample Literary Records
                    </span>
                    <p className="text-xs text-[#6B5038] dark:text-[#A89481] mb-3 leading-relaxed">
                      Populate your journal with classic characters across multiple books & series (Lord of the Rings, Dune, Pride & Prejudice, Sherlock Holmes).
                    </p>
                    <button
                      id="menu-seed-sample-btn"
                      onClick={() => {
                        onSeedSampleData();
                        setMenuOpen(false);
                      }}
                      disabled={isSeeding}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#CDBAA5] dark:bg-[#382312] hover:bg-[#BFA78F] dark:hover:bg-[#4E311A] text-[#38220F] dark:text-[#E8D4C1] text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#8B5A36] dark:text-[#C49366]" />
                      <span>{isSeeding ? 'Adding Sample Characters...' : 'Add Sample Characters'}</span>
                    </button>
                  </div>
                )}

                {/* About Notes */}
                <div className="px-2 text-xs text-[#8A715C] dark:text-[#7A6451] space-y-1">
                  <p className="font-heading font-bold text-[#63432B] dark:text-[#A8927D]">Book Character Journal</p>
                  <p>Organize, search, and chronicle characters across multi-volume books and series.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#E8DFCFA0] dark:bg-[#160E08] border-t border-[#D5C2AA] dark:border-[#331F10] text-center text-xs text-[#7A604A] dark:text-[#8C7665]">
                {totalCharacters} {totalCharacters === 1 ? 'character' : 'characters'} recorded in your cloud library
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
