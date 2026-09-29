import React, { useState } from 'react';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

interface Props {
  onLogin: (password: string) => Promise<boolean | void>;
  loading: boolean;
  error: string | null;
}

export const LoginModal: React.FC<Props> = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('alex@executive.design');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onLogin(password);
  };

  return (
    <div className="bg-background dark:bg-[#0B132B] font-body-md text-body-md text-on-surface dark:text-[#F8FAFC] antialiased min-h-screen flex flex-col justify-between selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Executive Security Header */}
      <header className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-desktop py-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded bg-primary dark:bg-slate-100 flex items-center justify-center text-on-primary dark:text-slate-900 font-bold text-sm shadow-sm flex-shrink-0">
            JF
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 font-semibold tracking-tight">
            JobFlow
          </span>
          <span className="hidden sm:inline-block px-space-xs py-0.5 rounded bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 font-label-sm text-label-sm uppercase tracking-wider">
            Executive
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle id="theme-toggle-login" variant="login" />
          <div className="flex items-center gap-space-sm bg-surface-container-low dark:bg-slate-800/80 px-space-sm py-1 rounded-full shadow-[0_1px_4px_rgba(15,23,42,0.03)] border border-outline-variant/30 dark:border-slate-700">
            <span className="material-symbols-outlined text-tertiary-container dark:text-emerald-400 text-[16px]">lock</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-300 font-medium tracking-wide uppercase">
              256-Bit SSL Encrypted
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center px-margin py-space-xl">
        <div className="flex flex-col w-full">
          <div className="relative w-full max-w-[1240px] mx-auto py-space-md md:py-space-xl flex flex-col lg:flex-row items-center justify-center gap-space-xl">
            {/* Left Column: Primary Executive Authentication Card */}
            <div className="w-full max-w-[540px] bg-surface-container-lowest dark:bg-[#1E293B] shadow-xl dark:shadow-2xl rounded-xl p-space-lg md:p-space-xl flex flex-col relative z-10 border border-hairline/60 dark:border-slate-700">
              {/* Brand & Status Pill */}
              <div className="flex items-center justify-between gap-space-sm mb-space-lg">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded bg-primary dark:bg-slate-100 flex items-center justify-center text-on-primary dark:text-slate-900 font-bold text-sm shadow-sm flex-shrink-0">
                    JF
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 font-semibold tracking-tight">
                    JobFlow
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 font-label-sm text-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                  Grist Sync Active
                </span>
              </div>

              {/* Welcome Typographic Hierarchy */}
              <div className="mb-space-lg">
                <div className="inline-block px-space-xs py-0.5 rounded bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200 font-label-sm text-label-sm tracking-wider uppercase mb-space-xs font-semibold">
                  Executive Career Intelligence &amp; Pipeline
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mt-1">
                  Sign in to access your active pipeline, interview analytics, and Grist sync.
                </p>
              </div>


              {/* Login Form */}
              <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-label-md text-label-md text-on-surface dark:text-slate-200 font-medium flex items-center justify-between"
                    htmlFor="work-email"
                  >
                    <span>Work Email</span>
                    <span className="text-on-surface-variant dark:text-slate-400 font-label-sm text-label-sm">
                      Executive / Corporate ID
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant dark:text-slate-400 text-[18px]">
                      alternate_email
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-slate-900/80 text-on-surface dark:text-slate-100 font-body-md text-body-md pl-10 pr-space-md py-2 rounded shadow-sm border border-outline-variant/30 dark:border-slate-700 focus:outline-none focus:bg-surface-bright dark:focus:bg-slate-900 focus:border-primary dark:focus:border-slate-400 focus:shadow-md transition-all duration-150"
                      id="work-email"
                      placeholder="alex@executive.design"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-label-md text-on-surface dark:text-slate-200 font-medium" htmlFor="login-password">
                      Password
                    </label>
                    <a
                      className="font-label-sm text-label-sm text-secondary hover:text-secondary-container dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant dark:text-slate-400 text-[18px]">
                      key
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-slate-900/80 text-on-surface dark:text-slate-100 font-body-md text-body-md pl-10 pr-10 py-2 rounded shadow-sm border border-outline-variant/30 dark:border-slate-700 focus:outline-none focus:bg-surface-bright dark:focus:bg-slate-900 focus:border-primary dark:focus:border-slate-400 focus:shadow-md transition-all duration-150"
                      id="login-password"
                      placeholder="••••••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      aria-describedby={error ? 'login-error' : undefined}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-slate-200 transition-colors p-1"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Device & Encryption Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      defaultChecked
                      className="w-4 h-4 rounded text-primary focus:ring-0 focus:outline-none cursor-pointer accent-primary"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-slate-300">Remember device (30 days)</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-secondary dark:text-indigo-400 text-[14px]">shield</span>
                    <span>Grist Encrypted Engine</span>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="text-body-sm text-error bg-error-container/60 dark:bg-rose-950/70 dark:text-rose-200 p-2.5 rounded border border-error/20 dark:border-rose-800/60 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error dark:text-rose-400 flex-shrink-0">
                      error
                    </span>
                    <span>{error}</span>
                  </p>
                )}

                {/* Submit Button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading || !password.trim()}
                  className="w-full mt-space-sm flex items-center justify-center gap-space-sm py-2.5 px-space-lg rounded bg-primary hover:bg-slate-800 text-on-primary dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-headline-sm text-headline-sm font-medium shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span>{loading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </form>

              {/* Trust Telemetry Pill Bar */}
              <div className="mt-space-lg pt-space-md bg-surface-container-low dark:bg-slate-800/70 rounded-lg p-space-sm flex items-center justify-between text-on-surface-variant dark:text-slate-300 border border-hairline/40 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-tertiary-container dark:text-emerald-400">verified_user</span>
                  <span className="hidden sm:inline">256-bit AES</span>
                  <span className="sm:hidden">AES-256</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant dark:bg-slate-700"></div>
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-secondary dark:text-indigo-400">sync_alt</span>
                  <span>Grist Cloud Sync</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant dark:bg-slate-700"></div>
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-on-tertiary-container dark:text-emerald-400">military_tech</span>
                  <span>SOC-2 Type II</span>
                </div>
              </div>

              {/* Sub-actions & Access Request */}
              <div className="mt-space-lg text-center flex flex-col gap-1.5">
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">
                  Don't have an account?{' '}
                  <a className="text-on-surface dark:text-slate-200 font-semibold hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                    Request access / Sign up
                  </a>
                </p>
                <div className="flex items-center justify-center gap-space-md text-on-surface-variant dark:text-slate-400 font-label-sm text-label-sm pt-1">
                  <a className="hover:text-on-surface dark:hover:text-slate-200 transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  <span>•</span>
                  <a className="hover:text-on-surface dark:hover:text-slate-200 transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                  <span>•</span>
                  <a className="hover:text-on-surface dark:hover:text-slate-200 transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Enterprise SSO
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Telemetry, Live Funnel Metrics & Social Proof */}
            <div className="w-full max-w-[500px] hidden lg:flex flex-col gap-space-md">
              {/* Primary Live Telemetry Bento Card */}
              <div className="bg-surface-container-lowest dark:bg-[#1E293B] rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden border border-hairline/60 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-200">
                      <span className="material-symbols-outlined text-[18px]">query_stats</span>
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 font-medium">Pipeline Telemetry</span>
                  </div>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container dark:bg-slate-800 font-label-sm text-label-sm text-on-surface-variant dark:text-slate-300">
                    Live Stream
                  </span>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low dark:bg-slate-900/60 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                      Active Cohort Target
                    </span>
                    <span className="font-label-md text-label-md text-on-tertiary-container dark:text-emerald-400 font-bold">
                      +18.4% WoW
                    </span>
                  </div>
                  <div className="font-display text-display text-on-surface dark:text-slate-100 font-semibold tracking-tight">
                    32 <span className="font-headline-md text-headline-md font-normal text-on-surface-variant dark:text-slate-400">Opportunities</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                    Tracking 32 active executive opportunities with real-time conversion telemetry across 6 stages.
                  </p>
                  {/* SVG Visual Mini Sparkline Pipeline Chart */}
                  <div className="pt-space-sm">
                    <svg className="w-full h-12 text-secondary dark:text-indigo-400" fill="none" preserveAspectRatio="none" viewBox="0 0 320 48">
                      <path d="M0 40 Q 40 38, 70 28 T 140 22 T 210 14 T 270 20 T 320 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                      <path d="M0 40 Q 40 38, 70 28 T 140 22 T 210 14 T 270 20 T 320 6 L 320 48 L 0 48 Z" fill="currentColor" fillOpacity="0.08"></path>
                      <circle className="fill-secondary dark:fill-indigo-400" cx="320" cy="6" r="3.5"></circle>
                    </svg>
                  </div>
                </div>
                {/* Mini Metric Breakdown Rows */}
                <div className="grid grid-cols-3 gap-space-xs pt-1 text-center">
                  <div className="p-space-xs rounded bg-surface-container-high/60 dark:bg-slate-800/80 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Round 3/Exec</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface dark:text-slate-100">11</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 dark:bg-slate-800/80 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Offer Stage</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-tertiary-container dark:text-emerald-400">04</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 dark:bg-slate-800/80 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-slate-400">Avg Velocity</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface dark:text-slate-100">14d</span>
                  </div>
                </div>
              </div>

              {/* Testimonial & Security Validation Card */}
              <div className="bg-surface-container-lowest dark:bg-[#1E293B] rounded-xl p-space-lg shadow-md flex flex-col gap-space-sm relative border border-hairline/60 dark:border-slate-700">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-slate-700 flex items-center justify-center font-headline-sm text-headline-sm font-semibold text-on-surface dark:text-slate-100">
                    MV
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 font-semibold truncate">
                      Marcus Vance
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 truncate">
                      VP of Engineering • Series C Transition
                    </span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-300 italic pt-space-xs">
                  “JobFlow turned an overwhelming pipeline into a predictable executive funnel. The multi-track status synchronization ensures zero lost opportunities.”
                </p>
                <div className="flex items-center justify-between pt-space-xs text-on-surface-variant dark:text-slate-400 font-label-sm text-label-sm">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                    Verified Placement
                  </span>
                  <span>Synced 4m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-desktop py-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant dark:text-slate-400 border-t border-hairline/40 dark:border-slate-800">
        <div className="font-label-sm text-label-sm">© 2025 JobFlow Systems Inc. All rights reserved.</div>
        <div className="flex items-center gap-space-lg font-label-sm text-label-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
            System Operational
          </span>
          <a className="hover:text-on-surface dark:hover:text-slate-200 transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Security Policy
          </a>
          <a className="hover:text-on-surface dark:hover:text-slate-200 transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Terminal Help
          </a>
        </div>
      </footer>
    </div>
  );
};
