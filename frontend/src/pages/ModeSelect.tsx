import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';

export function ModeSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMode = useAuthStore((s) => s.setMode);
  const collector = useAuthStore((s) => s.collector);
  const recycler = useAuthStore((s) => s.recycler);

  const handleSelect = (mode: 'collector' | 'recycler') => {
    setMode(mode);
    // Route to the right home/dashboard if already authenticated, else to login
    if (mode === 'collector') {
      navigate(collector ? '/collector' : '/collector/login');
    } else {
      navigate(recycler ? '/recycler/dashboard' : '/recycler/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-orange-600 mb-6">
            <span className="text-4xl">♻️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Kabadiwala</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('modeSelect.whoAreYou', { defaultValue: 'Are you a collector or a recycler?' })}
          </p>
        </div>

        {/* Mode Options */}
        <div className="space-y-4">
          <button
            onClick={() => handleSelect('collector')}
            className="w-full relative p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-400 transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left group"
          >
            <span className="text-4xl">🧺</span>
            <div className="flex-1">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('modeSelect.collector', { defaultValue: 'Collector' })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('modeSelect.collectorDesc', { defaultValue: 'I collect e-waste and sell lots' })}
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => handleSelect('recycler')}
            className="w-full relative p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all duration-200 hover:shadow-lg flex items-center gap-4 text-left group"
          >
            <span className="text-4xl">🏭</span>
            <div className="flex-1">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('modeSelect.recycler', { defaultValue: 'Recycler' })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('modeSelect.recyclerDesc', { defaultValue: 'I run a recycling facility' })}
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* App Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>Kabadiwala - E-Waste Collection Platform</p>
          <p className="text-xs">Connecting collectors with recyclers</p>
        </div>
      </div>
    </div>
  );
}
