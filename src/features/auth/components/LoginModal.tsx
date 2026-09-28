import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface Props {
  onLogin: (password: string) => Promise<boolean | void>;
  loading: boolean;
  error: string | null;
}

export const LoginModal: React.FC<Props> = ({ onLogin, loading, error }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onLogin(password);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top bar */}
      <header className="px-lg py-lg flex items-center justify-between border-b border-hairline bg-surface">
        <div className="flex items-center gap-sm">
          <div className="w-7 h-7 rounded bg-action-primary flex items-center justify-center">
            <span className="text-white text-label-sm font-mono-label font-semibold">JF</span>
          </div>
          <span className="text-headline-sm font-geist text-ink font-semibold tracking-tight">
            JobFlow
          </span>
          <span className="hidden sm:inline-block px-xs py-0.5 rounded bg-canvas border border-hairline text-label-sm font-mono-label text-ink-muted uppercase tracking-wider">
            Executive
          </span>
        </div>
      </header>

      {/* Main: centered card */}
      <main className="flex-1 flex items-center justify-center px-lg py-xl">
        <div className="w-full max-w-sm">
          <div className="bg-surface border border-hairline rounded-lg shadow-overlay p-xl">
            {/* Card header */}
            <div className="mb-xl">
              <h1 className="text-headline-md font-geist text-ink font-semibold mb-xs">
                Masuk ke JobFlow
              </h1>
              <p className="text-body-md text-ink-secondary">
                Masukkan kata sandi untuk mengakses dasbor lamaran Anda.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-label-md font-mono-label text-ink-muted uppercase tracking-wider mb-xs"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    autoFocus
                    className="w-full h-10 px-md pr-10 bg-surface border border-border-active rounded text-body-md text-ink placeholder:text-ink-muted
                      focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors"
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="text-body-sm text-status-overdue"
                >
                  {error}
                </p>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading || !password.trim()}
                className="h-10 flex items-center justify-center gap-sm bg-action-primary hover:bg-action-primary-hover text-white rounded font-geist font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{loading ? 'Memverifikasi...' : 'Masuk'}</span>
              </button>
            </form>
          </div>

          <p className="text-center text-label-sm font-mono-label text-ink-muted uppercase tracking-wider mt-lg">
            JobFlow Executive · Private Access
          </p>
        </div>
      </main>
    </div>
  );
};
