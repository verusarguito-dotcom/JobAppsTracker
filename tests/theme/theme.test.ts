import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getInitialTheme, THEME_STORAGE_KEY, useTheme } from '../../src/context/ThemeContext';
import fs from 'fs';
import path from 'path';

describe('Theme Engine & Storage Tests', () => {
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });

  it('uses the expected storage key "jobflow_theme"', () => {
    expect(THEME_STORAGE_KEY).toBe('jobflow_theme');
  });

  it('defaults to light theme when window is undefined', () => {
    // @ts-ignore
    delete (global as any).window;
    expect(getInitialTheme()).toBe('light');
  });

  it('reads stored preference from localStorage', () => {
    const mockStorage: Record<string, string> = {
      jobflow_theme: 'dark',
    };
    (global as any).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
    (global as any).localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
    };

    expect(getInitialTheme()).toBe('dark');

    mockStorage['jobflow_theme'] = 'light';
    expect(getInitialTheme()).toBe('light');
  });

  it('falls back to prefers-color-scheme: dark when no localStorage exists', () => {
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
    };
    (global as any).window = {
      matchMedia: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
      }),
    };

    expect(getInitialTheme()).toBe('dark');
  });

  it('falls back to light when system theme is light and no storage exists', () => {
    (global as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
    };
    (global as any).window = {
      matchMedia: () => ({
        matches: false,
      }),
    };

    expect(getInitialTheme()).toBe('light');
  });

  it('provides safe fallback from useTheme() when context is not wrapped', () => {
    const fallback = useTheme();
    expect(fallback.theme).toBe('light');
    expect(fallback.isDark).toBe(false);
    expect(typeof fallback.toggleTheme).toBe('function');
    expect(typeof fallback.setTheme).toBe('function');
  });

  it('index.html contains FOUT-prevention script targeting jobflow_theme and class dark', () => {
    const htmlPath = path.resolve(__dirname, '../../index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');

    expect(content).toContain('jobflow_theme');
    expect(content).toContain('classList.add(\'dark\')');
    expect(content).toContain('prefers-color-scheme: dark');
  });

  it('tailwind.config.js enables darkMode class', () => {
    const configPath = path.resolve(__dirname, '../../tailwind.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');

    expect(configContent).toContain("darkMode: 'class'");
  });

  it('handles invalid or corrupt stored theme gracefully', () => {
    (global as any).localStorage = {
      getItem: () => 'invalid-theme-value',
      setItem: () => {},
    };
    (global as any).window = {
      matchMedia: () => ({ matches: false }),
    };

    expect(getInitialTheme()).toBe('light');
  });

  it('handles localStorage SecurityError/exception gracefully in restricted environments', () => {
    (global as any).localStorage = {
      getItem: () => {
        throw new Error('SecurityError: Access is denied for this document.');
      },
      setItem: () => {
        throw new Error('SecurityError: Access is denied for this document.');
      },
    };
    (global as any).window = {
      matchMedia: () => ({ matches: false }),
    };

    expect(getInitialTheme()).toBe('light');
  });
});
