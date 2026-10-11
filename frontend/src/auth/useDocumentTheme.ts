import { useSyncExternalStore } from 'react';

export type DocumentTheme = 'light' | 'dark';

function subscribe(onChange: () => void) {
  if (typeof document === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function getSnapshot(): DocumentTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): DocumentTheme {
  return 'light';
}

/** Current theme from `<html data-theme>`; re-renders when the attribute changes. */
export function useDocumentTheme(): DocumentTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}