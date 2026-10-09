import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Input';
import { PinInput } from '../../components/shared/PinInput';
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('common.profile', { defaultValue: 'Profile' })}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <User className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('profile.collectorId', { defaultValue: 'Collector ID' })}: {collector?.collectorId}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('profile.memberSince', { defaultValue: 'Member since January 2024' })}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatItem
                label={t('profile.totalLots', { defaultValue: 'Total Lots' })}
                value="12"
                icon="📦"
              />
              <StatItem
                label={t('profile.totalEarned', { defaultValue: 'Total Earned' })}
                value="₹45,230"
                icon="💰"
              />
              <StatItem
                label={t('profile.rating', { defaultValue: 'Rating' })}
                value="4.8 ★"
                icon="⭐"
              />
            </div>
          </div>

          {/* Settings Sections */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Account Info */}
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('profile.accountInfo', { defaultValue: 'Account Information' })}
              </h3>
            </div>
            <div className="p-4 space-y-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.phone', { defaultValue: 'Phone' })}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{collector?.phone || collector?.email}</p>
                  </div>
                </div>
                <span className="text-gray-400">🔒</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.pin', { defaultValue: 'PIN' })}</p>
                    <p className="font-medium text-gray-900 dark:text-white font-mono">****</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  {t('profile.change', { defaultValue: 'Change' })}
                </Button>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('profile.preferences', { defaultValue: 'Preferences' })}
              </h3>
            </div>
            <div className="p-4 space-y-4 border-b dark:border-gray-700">
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
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('profile.notifications', { defaultValue: 'Notifications' })}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('profile.pushNotifications', { defaultValue: 'Push Notifications' })}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.pushDesc', { defaultValue: 'Receive updates about lots and payments' })}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
              </label>
            </div>

            {/* Security */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
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

function StatItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
      <span className="text-2xl mb-1 block">{icon}</span>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}