import { describe, it, expect } from 'vitest';
import { Theme, ThemePreference, isTheme, isThemePreference, nextThemePreference } from './theme.js';

describe('isTheme', () => {
  it('accepts resolved themes', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme(Theme.light)).toBe(true);
  });
  it('rejects other values', () => {
    expect(isTheme('system')).toBe(false);
    expect(isTheme('')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(0)).toBe(false);
  });
});

describe('isThemePreference', () => {
  it('accepts light, dark, and system', () => {
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference(ThemePreference.system)).toBe(true);
  });
  it('rejects other values', () => {
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference('')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });
});

describe('nextThemePreference', () => {
  it('cycles system → light → dark → system', () => {
    expect(nextThemePreference(ThemePreference.system)).toBe(ThemePreference.light);
    expect(nextThemePreference(ThemePreference.light)).toBe(ThemePreference.dark);
    expect(nextThemePreference(ThemePreference.dark)).toBe(ThemePreference.system);
  });
  it('treats an unknown preference as system', () => {
    expect(nextThemePreference(null)).toBe(ThemePreference.light);
  });
});
