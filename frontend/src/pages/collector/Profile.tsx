import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Button } from '../../components/shared/Button';
import { Select } from '../../components/shared/Input';
import { useState } from 'react';
import { ArrowLeft, User, Globe, MapPin, Bell, Shield, LogOut, Save } from 'lucide-react';

const MOCK_AREAS = [
  { value: 'andheri-east', label: 'Andheri East' },
  { value: 'andheri-west', label: 'Andheri West' },
  { value: 'bandra-east', label: 'Bandra East' },
  { value: 'bandra-west', label: 'Bandra West' },
  { value: 'dadar', label: 'Dadar' },
  { value: 'lower-parel', label: 'Lower Parel' },
  { value: 'worli', label: 'Worli' },
  { value: 'powai', label: 'Powai' },
  { value: 'thane', label: 'Thane' },
  { value: 'navi-mumbai', label: 'Navi Mumbai' },
];

const LANGUAGES = [
  { code: 'mr', name: 'मराठी', nativeName: 'मराठी' },
  { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { collector, updateCollector } = useAuthStore();
  const logout = useLogout();
  const [area, setArea] = useState(collector?.area || '');
  const [language, setLanguageState] = useState(collector?.language || 'mr');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBack = () => {
    navigate('/collector/home');
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    updateCollector({ area, language });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] copper-accent">
      {/* Header */}
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors focus-ring-collector"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--color-text)] font-display">
            {t('common.profile', { defaultValue: 'Profile' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl p-6 border border-[var(--color-border)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-[var(--color-copper-light)]/10 flex items-center justify-center">
                <User className="w-10 h-10 text-[var(--color-copper)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] font-display">
                  {t('profile.collectorId', { defaultValue: 'Collector ID' })}: {collector?.collectorId}
                </h2>
                <p className="text-[var(--color-text-muted)]">
                  {t('profile.memberSince', { defaultValue: 'Member since January 2024' })}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatItem label={t('profile.totalLots', { defaultValue: 'Total Lots' })} value="12" icon={<svg className="w-6 h-6 text-[var(--color-copper)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>} />
              <StatItem label={t('profile.totalEarned', { defaultValue: 'Total Earned' })} value="₹45,230" icon={<svg className="w-6 h-6 text-[var(--color-verdigris)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>} />
              <StatItem label={t('profile.rating', { defaultValue: 'Rating' })} value="4.8 ★" icon={<svg className="w-6 h-6 text-[var(--color-trust)]" viewBox="0 0 24 24" fill="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 9 8.26 12 2" /></svg>} />
            </div>
          </div>

          {/* Settings Sections */}
          <div className="bg-[var(--color-surface-elevated)] rounded-2xl shadow-xl overflow-hidden border border-[var(--color-border)]">
            {/* Account Info */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 font-display">
                <User className="w-5 h-5 text-[var(--color-copper)]" />
                {t('profile.accountInfo', { defaultValue: 'Account Information' })}
              </h3>
            </div>
            <div className="p-4 space-y-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between p-3 bg-[var(--color-surface-alt)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-circuit-muted)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-circuit)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{t('common.phone', { defaultValue: 'Phone' })}</p>
                    <p className="font-medium text-[var(--color-text)]">{collector?.phone || collector?.email}</p>
                  </div>
                </div>
                <span className="text-[var(--color-text-subtle)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--color-surface-alt)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-warning-muted)] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[var(--color-warning)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{t('profile.pin', { defaultValue: 'PIN' })}</p>
                    <p className="font-medium text-[var(--color-text)] font-mono tabular-nums">****</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {}}>{t('profile.change', { defaultValue: 'Change' })}</Button>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 font-display">
                <Globe className="w-5 h-5 text-[var(--color-circuit)]" />
                {t('profile.preferences', { defaultValue: 'Preferences' })}
              </h3>
            </div>
            <div className="p-4 space-y-4 border-b border-[var(--color-border)]">
              <Select
                label={t('common.language', { defaultValue: 'Language' })}
                value={language}
                onChange={(e) => setLanguageState(e.target.value as 'mr' | 'hi' | 'en')}
                options={LANGUAGES.map(l => ({ value: l.code, label: l.nativeName }))}
              />
              <Select
                label={t('common.area', { defaultValue: 'Service Area' })}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                options={MOCK_AREAS}
                placeholder={t('common.selectArea', { defaultValue: 'Select your area' })}
              />
            </div>

            {/* Notifications */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 font-display">
                <Bell className="w-5 h-5 text-[var(--color-copper)]" />
                {t('profile.notifications', { defaultValue: 'Notifications' })}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-copper-light)]/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[var(--color-copper)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{t('profile.pushNotifications', { defaultValue: 'Push Notifications' })}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{t('profile.pushDesc', { defaultValue: 'Receive updates about lots and payments' })}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 text-[var(--color-copper)] border-[var(--color-border)] rounded focus:ring-[var(--focus-ring-collector)]"
                />
              </label>
            </div>

            {/* Security */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2 font-display">
                <Shield className="w-5 h-5 text-[var(--color-verdigris)]" />
                {t('profile.security', { defaultValue: 'Security' })}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <Button variant="outline" fullWidth leftIcon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
                {t('common.logout', { defaultValue: 'Logout' })}
              </Button>
              <Button variant="danger" fullWidth leftIcon={<Shield className="w-4 h-4" />} onClick={() => {}}>
                {t('profile.deleteAccount', { defaultValue: 'Delete Account' })}
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            loading={saving}
            leftIcon={<Save className="w-5 h-5" />}
          >
            {saved ? t('common.saved', { defaultValue: 'Saved!' }) : t('common.save', { defaultValue: 'Save Changes' })}
          </Button>
        </div>
      </main>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="text-center p-3 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
      <span className="mb-1 block">{icon}</span>
      <p className="text-xl font-bold text-[var(--color-text)] tabular-nums font-mono">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}