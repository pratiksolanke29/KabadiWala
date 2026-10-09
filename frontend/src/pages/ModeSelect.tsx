import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../hooks/useAuthStore';

export function ModeSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMode = useAuthStore((s) => s.setMode);
  const { isSignedIn } = useAuth();

  const handleSelect = (mode: 'collector' | 'recycler') => {
    setMode(mode);
    navigate(isSignedIn ? `/${mode}/setup` : `/${mode}/login`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[var(--color-copper)] to-[var(--color-circuit)] flex items-center justify-center">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 11a5 5 0 0 1 10 0" />
                <path d="M11 7a5 5 0 0 1 0 10" />
                <path d="M3 15a5 5 0 0 1 10 0" />
                <path d="M15 3a5 5 0 0 1 0 10" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2 font-display">Kabadiwala</h1>
          <p className="text-[var(--color-text-muted)]">
            {t('modeSelect.whoAreYou', { defaultValue: 'Are you a collector or a recycler?' })}
          </p>
        </div>

        {/* Mode Options */}
        <div className="space-y-4">
          <button
            onClick={() => handleSelect('collector')}
            className="w-full relative p-6 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-copper)] dark:hover:border-[var(--color-copper-light)] transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left group focus-ring-collector"
          >
            <div className="w-14 h-14 rounded-xl bg-[var(--color-copper-light)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-copper)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl font-semibold text-[var(--color-text)] font-display">
                {t('modeSelect.collector', { defaultValue: 'Collector' })}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('modeSelect.collectorDesc', { defaultValue: 'I collect e-waste and sell lots' })}
              </p>
            </div>
            <svg className="w-6 h-6 text-[var(--color-text-subtle)] group-hover:text-[var(--color-copper)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => handleSelect('recycler')}
            className="w-full relative p-6 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-circuit)] dark:hover:border-[var(--color-circuit-light)] transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left group focus-ring-recycler"
          >
            <div className="w-14 h-14 rounded-xl bg-[var(--color-circuit-muted)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-circuit)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                <path d="M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83" />
                <path d="M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl font-semibold text-[var(--color-text)] font-display">
                {t('modeSelect.recycler', { defaultValue: 'Recycler' })}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('modeSelect.recyclerDesc', { defaultValue: 'I run a recycling facility' })}
              </p>
            </div>
            <svg className="w-6 h-6 text-[var(--color-text-subtle)] group-hover:text-[var(--color-circuit)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* App Info */}
        <div className="mt-12 text-center text-sm text-[var(--color-text-muted)] space-y-2">
          <p>Kabadiwala - E-Waste Collection Platform</p>
          <p className="text-xs">Connecting collectors with recyclers</p>
        </div>
      </div>
    </div>
  );
}