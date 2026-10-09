import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuthStore } from '../hooks/useAuthStore';
import { Button } from '../components/shared/Button';
import { Input, Select } from '../components/shared/Input';
import type { Role } from './AuthPage';

const AREAS = [
  ['andheri-east', 'Andheri East'], ['andheri-west', 'Andheri West'], ['bandra-east', 'Bandra East'], ['bandra-west', 'Bandra West'],
  ['dadar', 'Dadar'], ['lower-parel', 'Lower Parel'], ['worli', 'Worli'], ['powai', 'Powai'], ['thane', 'Thane'], ['navi-mumbai', 'Navi Mumbai'],
].map(([value, label]) => ({ value, label }));
const CITIES = [['mumbai', 'Mumbai'], ['pune', 'Pune'], ['nashik', 'Nashik'], ['nagpur', 'Nagpur'], ['thane', 'Thane'], ['navi-mumbai', 'Navi Mumbai']]
  .map(([value, label]) => ({ value, label }));

// Runs after every Clerk sign-in. Asks the backend who this account is:
//  - already has this role  -> store the profile and go to the app
//  - has the other role     -> tell the user (one role per account)
//  - brand new              -> show the short role form (collector: area; recycler: facility details)
export function RoleSetup({ role }: { role: Role }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { setCollector, setRecycler, language } = useAuthStore();
  const [state, setState] = useState<'loading' | 'form' | 'other' | 'error'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', area: '', facilityName: '', city: '', address: '', authNumber: '', contact: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const from = (location.state as { from?: string } | null)?.from;
  const home = from ?? (role === 'collector' ? '/collector/home' : '/recycler/dashboard');

  const apply = (me: any) => {
    if (role === 'collector') setCollector({ collectorId: me.collectorId, email: me.email, phone: me.phone, name: me.name, area: me.area, language: me.language });
    else setRecycler({ id: me.recyclerId, facilityName: me.facilityName, email: me.email, authorized: me.authorized, serviceAreas: me.serviceAreas, pickupEnabled: me.pickupEnabled, language: me.language });
    navigate(home, { replace: true });
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    api('GET', '/me').then((me) => {
      if (me.role === role) apply(me);
      else if (me.role) setState('other');
      else setState('form');
    }).catch((e) => { setError(e.message); setState('error'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) return <Navigate to={`/${role}/login`} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const req = role === 'collector'
      ? { name: f.name.trim() || undefined, phone: f.phone.trim() || undefined, area: f.area, language }
      : { facilityName: f.facilityName.trim(), city: f.city, address: f.address.trim(), authNumber: f.authNumber.trim(), contact: f.contact.trim() };
    if (role === 'collector' && !f.area) return setError(t('auth.areaRequired', { defaultValue: 'Please select your area' }));
    if (role === 'recycler' && (!f.facilityName.trim() || !f.city || !f.address.trim() || !f.authNumber.trim() || !f.contact.trim()))
      return setError(t('clerkAuth.fillAll', { defaultValue: 'Please fill all fields' }));
    setSaving(true);
    try { apply(await api('POST', role === 'collector' ? '/me/collector' : '/me/recycler', req)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); setSaving(false); }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">{children}</div>
    </div>
  );

  if (state === 'loading') return shell(<p className="text-center text-gray-500">{t('common.loading', { defaultValue: 'Loading...' })}</p>);
  if (state === 'error') return shell(<>
    <p className="text-red-600 text-sm">{error}</p>
    <Button fullWidth onClick={() => window.location.reload()}>{t('clerkAuth.retry', { defaultValue: 'Try again' })}</Button>
    <Button fullWidth variant="outline" onClick={() => signOut({ redirectUrl: '/' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
  </>);
  if (state === 'other') return shell(<>
    <p className="text-gray-800 dark:text-gray-200">
      {t('clerkAuth.otherRole', { defaultValue: 'This account is already registered as the other role. Sign in with a different email to use this role.' })}
    </p>
    <Button fullWidth onClick={() => signOut({ redirectUrl: '/mode' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
  </>);

  return shell(
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {role === 'collector' ? t('clerkAuth.collectorSetup', { defaultValue: 'Set up your collector profile' }) : t('clerkAuth.recyclerSetup', { defaultValue: 'Set up your recycling facility' })}
      </h2>
      {role === 'collector' ? (<>
        <Input label={t('clerkAuth.name', { defaultValue: 'Name (optional)' })} value={f.name} onChange={set('name')} />
        <Input label={t('common.phone', { defaultValue: 'Phone Number' }) + ' (optional)'} type="tel" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        <Select label={t('common.area', { defaultValue: 'Area / Village' })} value={f.area} onChange={set('area')} options={AREAS}
          placeholder={t('common.selectArea', { defaultValue: 'Select your area' })} />
      </>) : (<>
        <Input label={t('recyclerRegister.facilityName', { defaultValue: 'Facility Name' })} value={f.facilityName} onChange={set('facilityName')} />
        <Select label={t('recyclerRegister.city', { defaultValue: 'City' })} value={f.city} onChange={set('city')} options={CITIES}
          placeholder={t('recyclerRegister.selectCity', { defaultValue: 'Select your city' })} />
        <Input label={t('recyclerRegister.address', { defaultValue: 'Full Address' })} value={f.address} onChange={set('address')} />
        <Input label={t('recyclerRegister.authNumber', { defaultValue: 'Authorization Number' })} value={f.authNumber} onChange={set('authNumber')}
          helperText={t('recyclerRegister.authNumberHelper', { defaultValue: 'Issued by Pollution Control Board' })} />
        <Input label={t('recyclerRegister.contact', { defaultValue: 'Contact Person' })} value={f.contact} onChange={set('contact')} />
      </>)}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={saving}>{t('clerkAuth.continue', { defaultValue: 'Continue' })}</Button>
      <Button type="button" fullWidth variant="ghost" onClick={() => signOut({ redirectUrl: '/mode' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
    </form>
  );
}
