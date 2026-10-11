import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuthStore } from '../hooks/useAuthStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { AddressFields, EMPTY_ADDRESS, addressError, addressLatLon, type AddressValue } from '../components/shared/AddressFields';
import type { Role } from './AuthPage';

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
  const [state, setState] = useState<'loading' | 'form' | 'other' | 'error' | 'notRegistered'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', facilityName: '', address: '', authNumber: '', contact: '' });
  const [addr, setAddr] = useState<AddressValue>(EMPTY_ADDRESS);
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
      // Signed in through the Login page but never registered: ask them to sign up first instead of showing the form.
      else setState(new URLSearchParams(location.search).get('src') === 'login' ? 'notRegistered' : 'form');
    }).catch((e) => { setError(e.message); setState('error'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) return <Navigate to={`/${role}/login`} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const req = role === 'collector'
      ? { name: f.name.trim() || undefined, phone: f.phone.trim() || undefined, ...addr, ...addressLatLon(addr), language }
      : { facilityName: f.facilityName.trim(), city: addr.district, ...addr, ...addressLatLon(addr), address: f.address.trim(), authNumber: f.authNumber.trim(), contact: f.contact.trim() };
    const addrErr = addressError(addr, t);
    if (addrErr) return setError(addrErr);
    if (role === 'recycler' && (!f.facilityName.trim() || !f.address.trim() || !f.authNumber.trim() || !f.contact.trim()))
      return setError(t('clerkAuth.fillAll', { defaultValue: 'Please fill all fields' }));
    setSaving(true);
    try { apply(await api('POST', role === 'collector' ? '/me/collector' : '/me/recycler', req)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); setSaving(false); }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-surface     flex items-center justify-center p-4">
      <div className="w-full max-w-md surface-card p-6 space-y-5">{children}</div>
    </div>
  );

  if (state === 'loading') return shell(<p className="text-center text-muted">{t('common.loading', { defaultValue: 'Loading...' })}</p>);
  if (state === 'error') return shell(<>
    <p className="text-danger text-sm">{error}</p>
    <Button fullWidth onClick={() => window.location.reload()}>{t('clerkAuth.retry', { defaultValue: 'Try again' })}</Button>
    <Button fullWidth variant="outline" onClick={() => signOut({ redirectUrl: '/' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
  </>);
  if (state === 'notRegistered') return shell(<>
    <h2 className="text-xl font-semibold text-foreground ">{t('login.signUpFirst', { defaultValue: 'Please sign up first' })}</h2>
    <p className="text-foreground ">{t('login.signUpFirstDesc', { defaultValue: 'This Google account is not registered yet. Sign up to continue.' })}</p>
    <Button fullWidth onClick={() => signOut({ redirectUrl: `/${role}/signup` })}>{t('login.goSignUp', { defaultValue: 'Sign up' })}</Button>
  </>);
  if (state === 'other') return shell(<>
    <p className="text-foreground ">
      {t('clerkAuth.otherRole', { defaultValue: 'This account is already registered as the other role. Sign in with a different email to use this role.' })}
    </p>
    <Button fullWidth onClick={() => signOut({ redirectUrl: '/mode' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
  </>);

  return shell(
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground ">
        {role === 'collector' ? t('clerkAuth.collectorSetup', { defaultValue: 'Set up your collector profile' }) : t('clerkAuth.recyclerSetup', { defaultValue: 'Set up your recycling facility' })}
      </h2>
      {role === 'collector' ? (<>
        <Input label={t('clerkAuth.name', { defaultValue: 'Name (optional)' })} value={f.name} onChange={set('name')} />
        <Input label={t('common.phone', { defaultValue: 'Phone Number' }) + ' (optional)'} type="tel" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        <AddressFields value={addr} onChange={setAddr} />
      </>) : (<>
        <Input label={t('recyclerRegister.facilityName', { defaultValue: 'Facility Name' })} value={f.facilityName} onChange={set('facilityName')} />
        <AddressFields value={addr} onChange={setAddr} />
        <Input label={t('recyclerRegister.address', { defaultValue: 'Full Address' })} value={f.address} onChange={set('address')} />
        <Input label={t('recyclerRegister.authNumber', { defaultValue: 'Authorization Number' })} value={f.authNumber} onChange={set('authNumber')}
          helperText={t('recyclerRegister.authNumberHelper', { defaultValue: 'Issued by Pollution Control Board' })} />
        <Input label={t('recyclerRegister.contact', { defaultValue: 'Contact Person' })} value={f.contact} onChange={set('contact')} />
      </>)}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={saving}>{t('clerkAuth.continue', { defaultValue: 'Continue' })}</Button>
      <Button type="button" fullWidth variant="ghost" onClick={() => signOut({ redirectUrl: '/mode' })}>{t('common.logout', { defaultValue: 'Logout' })}</Button>
    </form>
  );
}
