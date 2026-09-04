import React from 'react';
import { BookOpen, LogIn, Sparkles, Cloud, Library, Feather, BookmarkCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthGateProps {
  onSignInSuccess?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-[#FAF6F0] dark:bg-[#1E140C] text-[#38220F] dark:text-[#EAE0D3] rounded-2xl shadow-xl border-2 border-[#D6C4AC] dark:border-[#422C1A] overflow-hidden transition-colors">
        {/* Book Header Spine */}
        <div className="bg-[#4E3118] dark:bg-[#140D07] text-[#FBF8F3] p-6 text-center border-b-4 border-[#37200D] dark:border-[#0F0804] relative">
          <div className="w-16 h-16 rounded-2xl bg-[#38210F] dark:bg-[#1C120A] text-[#E8D6C3] flex items-center justify-center mx-auto mb-3 shadow-inner border border-[#785338] dark:border-[#422C1A]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-wide text-[#FAF6F0]">
            Character Arc
          </h1>
          <p className="text-xs sm:text-sm text-[#D7C2AB] dark:text-[#BFA993] mt-1 font-sans-ui max-w-md mx-auto italic">
            Never lose the plot—or the people in it.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-[#FBEAE8] dark:bg-[#3B1713] border border-[#E8ADA7] dark:border-[#6B2820] rounded-lg text-xs text-[#9B2C1E] dark:text-[#F29489] font-sans-ui">
              {error}
            </div>
          )}

          {/* Value Props */}
          <div className="grid grid-cols-1 gap-3 font-sans-ui">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F4EDE2] dark:bg-[#251910] border border-[#DFCBB4] dark:border-[#3E2919]">
              <div className="w-9 h-9 rounded-lg bg-[#E2D4C1] dark:bg-[#332013] text-[#633C1B] dark:text-[#D49E6F] flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#452812] dark:text-[#D8BA9A]">
                  Private Cloud Storage
                </h2>
                <p className="text-xs text-[#6B503B] dark:text-[#A68F7B] mt-0.5 leading-relaxed">
                  All character profiles, books, and series are securely synced to your private Google account.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F4EDE2] dark:bg-[#251910] border border-[#DFCBB4] dark:border-[#3E2919]">
              <div className="w-9 h-9 rounded-lg bg-[#E2D4C1] dark:bg-[#332013] text-[#633C1B] dark:text-[#D49E6F] flex items-center justify-center shrink-0">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#452812] dark:text-[#D8BA9A]">
                  Series Tracking & Character Dossiers
                </h2>
                <p className="text-xs text-[#6B503B] dark:text-[#A68F7B] mt-0.5 leading-relaxed">
                  Follow character arcs, roles, and descriptions across multi-book sagas, and bookmark the books you are actively reading.
                </p>
              </div>
            </div>
          </div>

          {/* Action Sign In Button */}
          <div className="pt-2 text-center space-y-3 font-sans-ui">
            <button
              id="google-signin-main-btn"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#59371C] hover:bg-[#452912] dark:bg-[#8D582D] dark:hover:bg-[#A86E3E] active:scale-[0.99] text-[#FFFDF9] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all border border-[#3E2310] dark:border-[#B37845] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.56 0 2.96.54 4.07 1.59l3.05-3.05C17.27 1.8 14.82 1 12 1 7.42 1 3.52 3.63 1.63 7.44l3.66 2.84C6.18 7.37 8.84 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.94 3.71-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.28c-.23-.68-.36-1.41-.36-2.28 0-.87.13-1.6.36-2.28L1.63 6.88C.59 8.98 0 11.41 0 14s.59 5.02 1.63 7.12l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.73-2.46 1.16-4.22 1.16-3.16 0-5.82-2.37-6.71-5.28L1.63 15.93C3.52 19.74 7.42 23 12 23z"
                />
              </svg>
              <span>{loading ? 'Opening Google Sign-In...' : 'Sign In with Google to Begin'}</span>
            </button>
            <p className="text-[11px] text-[#8C725E] dark:text-[#A68F7B]">
              Each reader has their own secure, cloud-saved journal library.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
