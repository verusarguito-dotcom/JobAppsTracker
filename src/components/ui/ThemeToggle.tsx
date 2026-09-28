import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  id?: string;
  className?: string;
  variant?: 'topbar' | 'sidebar' | 'login' | 'icon' | 'default';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id,
  className = '',
  variant = 'icon',
}) => {
  const { isDark, toggleTheme } = useTheme();

  const title = isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)';

  if (variant === 'sidebar') {
    return (
      <button
        id={id || 'theme-toggle-sidebar'}
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-surface-container dark:hover:bg-slate-800 transition-colors flex items-center justify-center ${className}`}
        title={title}
        aria-label={title}
      >
        {isDark ? (
          <span className="material-symbols-outlined text-[18px] text-amber-400 transition-transform duration-300 hover:rotate-45">
            light_mode
          </span>
        ) : (
          <span className="material-symbols-outlined text-[18px] transition-transform duration-300 hover:-rotate-12">
            dark_mode
          </span>
        )}
      </button>
    );
  }

  if (variant === 'login') {
    return (
      <button
        id={id || 'theme-toggle-login'}
        type="button"
        onClick={toggleTheme}
        className={`flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-700 hover:text-on-surface transition-all ${className}`}
        title={title}
        aria-label={title}
      >
        {isDark ? (
          <span className="material-symbols-outlined text-[18px] text-amber-400 transition-transform duration-300">
            light_mode
          </span>
        ) : (
          <span className="material-symbols-outlined text-[18px] transition-transform duration-300">
            dark_mode
          </span>
        )}
      </button>
    );
  }

  // Default 'topbar' / 'icon'
  return (
    <button
      id={id || 'theme-toggle-topbar'}
      type="button"
      onClick={toggleTheme}
      className={`flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high dark:bg-slate-800 dark:hover:bg-slate-700 text-on-surface dark:text-slate-200 transition-all duration-200 ${className}`}
      title={title}
      aria-label={title}
    >
      {isDark ? (
        <span className="material-symbols-outlined text-[18px] text-amber-400 transition-transform duration-300 hover:rotate-45">
          light_mode
        </span>
      ) : (
        <span className="material-symbols-outlined text-[18px] text-slate-700 dark:text-slate-200 transition-transform duration-300 hover:-rotate-12">
          dark_mode
        </span>
      )}
    </button>
  );
};
