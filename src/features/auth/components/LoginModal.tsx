import React, { useState } from 'react';

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
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Executive Security Header */}
      <header className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-desktop py-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm flex-shrink-0">
            JF
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
            JobFlow
          </span>
          <span className="hidden sm:inline-block px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            Executive
          </span>
        </div>
        <div className="flex items-center gap-space-sm bg-surface-container-low px-space-sm py-1 rounded-full shadow-[0_1px_4px_rgba(15,23,42,0.03)] border border-outline-variant/30">
          <span className="material-symbols-outlined text-tertiary-container text-[16px]">lock</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-wide uppercase">
            256-Bit SSL Encrypted
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center px-margin py-space-xl">
        <div className="flex flex-col w-full">
          <div className="relative w-full max-w-[1240px] mx-auto py-space-md md:py-space-xl flex flex-col lg:flex-row items-center justify-center gap-space-xl">
            {/* Left Column: Primary Executive Authentication Card */}
            <div className="w-full max-w-[540px] bg-surface-container-lowest shadow-xl rounded-xl p-space-lg md:p-space-xl flex flex-col relative z-10 border border-hairline/60">
              {/* Brand & Status Pill */}
              <div className="flex items-center justify-between gap-space-sm mb-space-lg">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm flex-shrink-0">
                    JF
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    JobFlow
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                  Grist Sync Active
                </span>
              </div>

              {/* Welcome Typographic Hierarchy */}
              <div className="mb-space-lg">
                <div className="inline-block px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm tracking-wider uppercase mb-space-xs font-semibold">
                  Executive Career Intelligence &amp; Pipeline
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Sign in to access your active pipeline, interview analytics, and Grist sync.
                </p>
              </div>

              {/* SSO Tier */}
              <div className="grid grid-cols-2 gap-space-sm mb-space-md">
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex items-center justify-center gap-space-sm px-space-md py-2.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md text-body-md font-medium shadow-sm transition-all duration-150 group"
                >
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" fill="#4285F4"></path>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.29 21.36 7.37 24 12 24Z" fill="#34A853"></path>
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15Z" fill="#FBBC05"></path>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" fill="#EA4335"></path>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex items-center justify-center gap-space-sm px-space-md py-2.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-body-md text-body-md font-medium shadow-sm transition-all duration-150 group"
                >
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 fill-current" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" fillRule="evenodd"></path>
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* Clean Divider */}
              <div className="relative flex items-center justify-center my-space-md">
                <div className="w-full h-px bg-surface-container-highest"></div>
                <span className="absolute px-space-sm bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm tracking-widest uppercase">
                  Or continue with password
                </span>
              </div>

              {/* Login Form */}
              <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-label-md text-label-md text-on-surface font-medium flex items-center justify-between"
                    htmlFor="work-email"
                  >
                    <span>Work Email</span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">
                      Executive / Corporate ID
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                      alternate_email
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-10 pr-space-md py-2 rounded shadow-sm border border-outline-variant/30 focus:outline-none focus:bg-surface-bright focus:border-primary focus:shadow-md transition-all duration-150"
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
                    <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor="login-password">
                      Password
                    </label>
                    <a
                      className="font-label-sm text-label-sm text-secondary hover:text-secondary-container transition-colors"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                      key
                    </span>
                    <input
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-10 pr-10 py-2 rounded shadow-sm border border-outline-variant/30 focus:outline-none focus:bg-surface-bright focus:border-primary focus:shadow-md transition-all duration-150"
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
                      className="absolute right-3 text-on-surface-variant hover:text-on-surface transition-colors p-1"
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
                    <span className="font-body-sm text-body-sm text-on-surface">Remember device (30 days)</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-secondary text-[14px]">shield</span>
                    <span>Grist Encrypted Engine</span>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="text-body-sm text-error bg-error-container/60 p-2.5 rounded border border-error/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0">
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
                  className="w-full mt-space-sm flex items-center justify-center gap-space-sm py-2.5 px-space-lg rounded bg-primary hover:bg-slate-800 text-on-primary font-headline-sm text-headline-sm font-medium shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span>{loading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </form>

              {/* Trust Telemetry Pill Bar */}
              <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between text-on-surface-variant border border-hairline/40">
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-tertiary-container">verified_user</span>
                  <span className="hidden sm:inline">256-bit AES</span>
                  <span className="sm:hidden">AES-256</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-secondary">sync_alt</span>
                  <span>Grist Cloud Sync</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">military_tech</span>
                  <span>SOC-2 Type II</span>
                </div>
              </div>

              {/* Sub-actions & Access Request */}
              <div className="mt-space-lg text-center flex flex-col gap-1.5">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Don't have an account?{' '}
                  <a className="text-on-surface font-semibold hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                    Request access / Sign up
                  </a>
                </p>
                <div className="flex items-center justify-center gap-space-md text-on-surface-variant font-label-sm text-label-sm pt-1">
                  <a className="hover:text-on-surface transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  <span>•</span>
                  <a className="hover:text-on-surface transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                  <span>•</span>
                  <a className="hover:text-on-surface transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                    Enterprise SSO
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Telemetry, Live Funnel Metrics & Social Proof */}
            <div className="w-full max-w-[500px] hidden lg:flex flex-col gap-space-md">
              {/* Primary Live Telemetry Bento Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden border border-hairline/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-surface-container-high text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">query_stats</span>
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-medium">Pipeline Telemetry</span>
                  </div>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                    Live Stream
                  </span>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Active Cohort Target
                    </span>
                    <span className="font-label-md text-label-md text-on-tertiary-container font-bold">
                      +18.4% WoW
                    </span>
                  </div>
                  <div className="font-display text-display text-on-surface font-semibold tracking-tight">
                    32 <span className="font-headline-md text-headline-md font-normal text-on-surface-variant">Opportunities</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Tracking 32 active executive opportunities with real-time conversion telemetry across 6 stages.
                  </p>
                  {/* SVG Visual Mini Sparkline Pipeline Chart */}
                  <div className="pt-space-sm">
                    <svg className="w-full h-12 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 320 48">
                      <path d="M0 40 Q 40 38, 70 28 T 140 22 T 210 14 T 270 20 T 320 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                      <path d="M0 40 Q 40 38, 70 28 T 140 22 T 210 14 T 270 20 T 320 6 L 320 48 L 0 48 Z" fill="currentColor" fillOpacity="0.08"></path>
                      <circle className="fill-secondary" cx="320" cy="6" r="3.5"></circle>
                    </svg>
                  </div>
                </div>
                {/* Mini Metric Breakdown Rows */}
                <div className="grid grid-cols-3 gap-space-xs pt-1 text-center">
                  <div className="p-space-xs rounded bg-surface-container-high/60 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Round 3/Exec</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">11</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Offer Stage</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-tertiary-container">04</span>
                  </div>
                  <div className="p-space-xs rounded bg-surface-container-high/60 flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Velocity</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">14d</span>
                  </div>
                </div>
              </div>

              {/* Testimonial & Security Validation Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-sm relative border border-hairline/60">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-headline-sm text-headline-sm font-semibold text-on-surface">
                    MV
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                      Marcus Vance
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      VP of Engineering • Series C Transition
                    </span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant italic pt-space-xs">
                  “JobFlow turned an overwhelming pipeline into a predictable executive funnel. The multi-track status synchronization ensures zero lost opportunities.”
                </p>
                <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-label-sm">
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
      <footer className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-desktop py-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant border-t border-hairline/40">
        <div className="font-label-sm text-label-sm">© 2025 JobFlow Systems Inc. All rights reserved.</div>
        <div className="flex items-center gap-space-lg font-label-sm text-label-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
            System Operational
          </span>
          <a className="hover:text-on-surface transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Security Policy
          </a>
          <a className="hover:text-on-surface transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Terminal Help
          </a>
        </div>
      </footer>
    </div>
  );
};
