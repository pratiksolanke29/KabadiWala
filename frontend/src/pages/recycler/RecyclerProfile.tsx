import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { Language } from '../../types';
import { RecyclerShell, RequestState, cardClass, fieldClass, saveClass } from './RecyclerShell';

interface FacilityProfile { facilityName: string; location: string; serviceAreas: string[]; contact: string; authNumber: string; authorized: boolean; pickupEnabled: boolean; }
export function RecyclerProfile() {
  const { t, i18n } = useTranslation();
  const { updateRecycler, setLanguage } = useAuthStore();
  const [profile, setProfile] = useState<FacilityProfile | null>(null);
  const [areas, setAreas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const p = await api<FacilityProfile>('GET', '/recycler/profile'); setProfile(p); setAreas(p.serviceAreas.join(', ')); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!profile) return; setSaving(true); setMessage('');
    try { const p = await api<FacilityProfile>('PATCH', '/recycler/profile', { contact: profile.contact.trim(), pickupEnabled: profile.pickupEnabled, serviceAreas: [...new Set(areas.split(',').map(x => x.trim()).filter(Boolean))] }); setProfile(p); setAreas(p.serviceAreas.join(', ')); updateRecycler({ serviceAreas: p.serviceAreas, pickupEnabled: p.pickupEnabled, authorized: p.authorized, facilityName: p.facilityName }); setMessage(t('recyclerPages.saved')); }
    catch (e) { setMessage(t('common.error') + ': ' + (e as Error).message); } finally { setSaving(false); }
  };
  return <RecyclerShell><h2 className="text-2xl font-bold mb-6">{t('common.profile')}</h2><RequestState loading={loading} error={error} retry={load} />
    {!loading && !error && profile && <form className={cardClass + ' max-w-3xl space-y-6'} onSubmit={save}>
      <dl className="grid sm:grid-cols-2 gap-4">{[[t('common.facilityName'), profile.facilityName], [t('recyclerPages.location'), profile.location], [t('common.authorizationNumber'), profile.authNumber], [t('common.status'), t(profile.authorized ? 'common.authorized' : 'common.approvalPending')]].map(([key, value]) => <div key={key}><dt className="text-sm text-gray-500">{key}</dt><dd className="font-medium break-words">{value}</dd></div>)}</dl>
      <label className="block">{t('common.contact')}<input className={fieldClass + ' mt-2'} required type="tel" disabled={saving} value={profile.contact} onChange={e => { setMessage(''); setProfile({ ...profile, contact: e.target.value }); }} /></label>
      <label className="block">{t('common.serviceArea')}<input className={fieldClass + ' mt-2'} value={areas} disabled={saving} onChange={e => { setMessage(''); setAreas(e.target.value); }} /><span className="text-sm text-gray-500">{t('recyclerPages.areasHelp')}</span></label>
      <label className="flex gap-3 items-center"><input type="checkbox" checked={profile.pickupEnabled} disabled={saving} onChange={e => { setMessage(''); setProfile({ ...profile, pickupEnabled: e.target.checked }); }} />{t('recyclerPages.pickupEnabled')}</label>
      <label className="block">{t('common.language')}<select className={fieldClass + ' mt-2'} value={i18n.language} onChange={e => { const lang = e.target.value as Language; void i18n.changeLanguage(lang); localStorage.setItem('kabadiwala-language', lang); setLanguage(lang); updateRecycler({ language: lang }); }}>{[['mr', 'मराठी'], ['hi', 'हिंदी'], ['en', 'English']].map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <div className="flex gap-4 flex-wrap items-center"><button className={saveClass} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button><p role="status">{message}</p></div>
    </form>}
  </RecyclerShell>;
}
