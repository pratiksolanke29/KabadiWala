import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../auth/useLogout';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Button } from '../../components/shared/Button';
import { Input, Select } from '../../components/shared/Input';
import { RatingBadge, ReviewList, type RatingSummary, type ReviewItem } from '../../components/shared/Ratings';
import { resizeImage, joinedLabel } from '../../utils/imageResize';
import { api } from '../../api';
import { useDeleteAccount } from '../../auth/useDeleteAccount';
import { useEffect, useRef, useState } from 'react';
import { User, Globe, Bell, Shield, LogOut, Save } from 'lucide-react';
import { ThemeToggle } from '../../components/shared/ThemeToggle';

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
  const deleteAccount = useDeleteAccount('collector');
  const [area, setArea] = useState(collector?.area || '');
  const [language, setLanguageState] = useState(collector?.language || 'mr');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(collector?.name || '');
  const [phone, setPhone] = useState(collector?.phone || '');
  const [photoUrl, setPhotoUrl] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [rating, setRating] = useState<RatingSummary>({ count: 0, average: 0 });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [saveError, setSaveError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<any>('GET', '/profile').then((p) => {
      setName(p.name || ''); setPhone(p.phone || ''); setPhotoUrl(p.photoUrl || '');
      setJoinedAt(p.joinedAt || ''); setRating(p.rating); setReviews(p.reviews || []);
    }).catch(() => {});
  }, []);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setPhotoUrl(await resizeImage(f)); } catch (err) { setSaveError(err instanceof Error ? err.message : 'Error'); }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const p = await api<any>('PATCH', '/profile', { area, language, name: name.trim() || undefined, phone: phone.trim() || undefined, photoUrl });
      updateCollector({ area, language, name: p.name, phone: p.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => fileRef.current?.click()} title={t('profileEdit.changePhoto', { defaultValue: 'Change photo' })}
            className="w-20 h-20 rounded-card bg-accent-soft/10 flex items-center justify-center overflow-hidden focus-visible:ring-2 ring-accent ring-offset-2">
            {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-accent" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <div>
            <h2 className="text-xl font-semibold text-foreground font-sans">
              {name || collector?.name || collector?.email}
            </h2>
            {joinedAt && (
              <p className="text-muted">
                {t('profileEdit.activeSince', { defaultValue: 'Active since {{date}}', date: joinedLabel(joinedAt) })}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatItem label={t('profile.totalLots', { defaultValue: 'Total Lots' })} value="12" icon={<svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>} />
          <StatItem label={t('profile.totalEarned', { defaultValue: 'Total Earned' })} value="₹45,230" icon={<svg className="w-6 h-6 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>} />
          <StatItem label={t('profile.rating', { defaultValue: 'Rating' })} value={rating.count ? `${rating.average.toFixed(1)} ★` : '-'} icon={<svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 9 8.26 12 2" /></svg>} />
        </div>
        {rating.count > 0 && (
          <p className="mt-3 text-sm text-center text-muted"><RatingBadge rating={rating} /></p>
        )}
        <ReviewList reviews={reviews} />
      </div>

      {/* Settings Sections */}
      <div className="surface-card overflow-hidden">
        {/* Account Info */}
        <div className="p-4 border-b border-line">
          <h3 className="font-semibold text-foreground flex items-center gap-2 font-sans">
            <User className="w-5 h-5 text-accent" />
            {t('profile.accountInfo', { defaultValue: 'Account Information' })}
          </h3>
        </div>
        <div className="p-4 space-y-4 border-b border-line">
          <Input label={t('profileEdit.name', { defaultValue: 'Name' })} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('profileEdit.phone', { defaultValue: 'Phone' })} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="p-3 bg-surface-alt rounded-card">
            <p className="text-xs text-muted">{t('profileEdit.collectorId', { defaultValue: 'Collector ID' })}</p>
            <p className="font-medium text-foreground ">{collector?.collectorId}</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-alt rounded-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </div>
              <div>
                <p className="text-xs text-muted">{t('common.phone', { defaultValue: 'Phone' })}</p>
                <p className="font-medium text-foreground">{collector?.phone || collector?.email}</p>
              </div>
            </div>
            <span className="text-subtle">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-alt rounded-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center">
                <Shield className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-xs text-muted">{t('profile.pin', { defaultValue: 'PIN' })}</p>
                <p className="font-medium text-foreground  tabular-nums">****</p>
              </div>
            </div>
            <Button variant="ghost" size="md" onClick={() => {}}>{t('profile.change', { defaultValue: 'Change' })}</Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-4 border-b border-line">
          <h3 className="font-semibold text-foreground flex items-center gap-2 font-sans">
            <Globe className="w-5 h-5 text-accent" />
            {t('profile.preferences', { defaultValue: 'Preferences' })}
          </h3>
        </div>
        <div className="p-4 space-y-4 border-b border-line">
          <Select
            label={t('common.language', { defaultValue: 'Language' })}
            value={language}
            onChange={(e) => setLanguageState(e.target.value as 'mr' | 'hi' | 'en')}
            options={LANGUAGES.map(l => ({ value: l.code, label: l.nativeName }))}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{t('profile.appearance', { defaultValue: 'Appearance' })}</p>
              <p className="text-sm text-muted">{t('profile.themeDescription', { defaultValue: 'Choose light or dark mode' })}</p>
            </div>
            <ThemeToggle />
          </div>
          <Select
            label={t('common.area', { defaultValue: 'Service Area' })}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            options={MOCK_AREAS.some((a) => a.value === area) || !area ? MOCK_AREAS : [{ value: area, label: area }, ...MOCK_AREAS]}
            placeholder={t('common.selectArea', { defaultValue: 'Select your area' })}
          />
        </div>

        {/* Notifications */}
        <div className="p-4 border-b border-line">
          <h3 className="font-semibold text-foreground flex items-center gap-2 font-sans">
            <Bell className="w-5 h-5 text-accent" />
            {t('profile.notifications', { defaultValue: 'Notifications' })}
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-soft/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t('profile.pushNotifications', { defaultValue: 'Push Notifications' })}</p>
                <p className="text-sm text-muted">{t('profile.pushDesc', { defaultValue: 'Receive updates about lots and payments' })}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 text-accent border-line rounded-lg focus-visible:ring-2 ring-accent ring-offset-2"
            />
          </label>
        </div>

        {/* Security */}
        <div className="p-4 border-b border-line">
          <h3 className="font-semibold text-foreground flex items-center gap-2 font-sans">
            <Shield className="w-5 h-5 text-success" />
            {t('profile.security', { defaultValue: 'Security' })}
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <Button variant="outline" fullWidth onClick={() => navigate('/collector/help')}>
            {t('help.title', { defaultValue: 'Help' })}
          </Button>
          <Button variant="outline" fullWidth leftIcon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
            {t('common.logout', { defaultValue: 'Logout' })}
          </Button>
          <Button variant="danger" fullWidth leftIcon={<Shield className="w-4 h-4" />} onClick={deleteAccount}>
            {t('profile.deleteAccount', { defaultValue: 'Delete Account' })}
          </Button>
        </div>
      </div>

      {saveError && <p role="alert" className="text-sm text-danger text-center">{saveError}</p>}
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
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="text-center p-3 bg-surface-alt rounded-card border border-line">
      <span className="mb-1 block">{icon}</span>
      <p className="text-xl font-semibold text-foreground tabular-nums ">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}