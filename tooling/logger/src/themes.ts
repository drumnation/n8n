import type {ThemeDefinition} from './types.js';

export const themes = {
  dracula: {
    error: '#ff5555',
    warn: '#ffb86c',
    info: '#8be9fd',
    debug: '#50fa7b',
    trace: '#bd93f9',
    fatal: '#ff79c6',
    timestamp: '#6272a4',
    scope: '#f8f8f2',
  },
  solarized: {
    error: '#dc322f',
    warn: '#b58900',
    info: '#268bd2',
    debug: '#859900',
    trace: '#6c71c4',
    fatal: '#d33682',
    timestamp: '#586e75',
    scope: '#839496',
  },
  nord: {
    error: '#bf616a',
    warn: '#d08770',
    info: '#5e81ac',
    debug: '#a3be8c',
    trace: '#b48ead',
    fatal: '#ebcb8b',
    timestamp: '#4c566a',
    scope: '#e5e9f0',
  },
  gruvbox: {
    error: '#fb4934',
    warn: '#fabd2f',
    info: '#83a598',
    debug: '#b8bb26',
    trace: '#d3869b',
    fatal: '#fe8019',
    timestamp: '#928374',
    scope: '#ebdbb2',
  },
  nightowl: {
    error: '#ef5350',
    warn: '#ffcb6b',
    info: '#82aaff',
    debug: '#c3e88d',
    trace: '#c792ea',
    fatal: '#f78c6c',
    timestamp: '#5f7e97',
    scope: '#d6deeb',
  },
  monochrome: {
    error: '#ffffff',
    warn: '#ffffff',
    info: '#ffffff',
    debug: '#ffffff',
    trace: '#ffffff',
    fatal: '#ffffff',
    timestamp: '#ffffff',
    scope: '#ffffff',
  },
  classic: {
    error: '#ff0000',
    warn: '#ffff00',
    info: '#00ff00',
    debug: '#00ffff',
    trace: '#ff00ff',
    fatal: '#ff4500',
    timestamp: '#808080',
    scope: '#ffffff',
  },
} satisfies Record<string, ThemeDefinition>;

export type ThemeName = keyof typeof themes;

export function getThemeByName(name: string): ThemeDefinition | undefined {
  return themes[name as ThemeName];
}

export function isValidTheme(name: string): name is ThemeName {
  return name in themes;
}
