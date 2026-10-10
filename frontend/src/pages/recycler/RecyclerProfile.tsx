import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { Language } from '../../types';
import { RatingBadge, ReviewList, type RatingSummary, type ReviewItem } from '../../components/shared/Ratings';
import { resizeImage, joinedLabel } from '../../utils/imageResize';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared/Button';
import { useDeleteAccount } from '../../auth/useDeleteAccount';
import { RecyclerShell, RequestState, cardClass, fieldClass, saveClass } from './RecyclerShell';

interface FacilityProfile { facilityName: string; location: string; serviceAreas: string[]; contact: string; authNumber: string; authorized: boolean; pickupEnabled: boolean; photoUrl?: string; joinedAt?: string; rating?: RatingSummary; reviews?: ReviewItem[]; }
export function RecyclerProfile() {
  const { t, i18n } = useTranslation();
  const { updateRecycler, setLanguage } = useAuthStore();
  const [profile, setProfile] = useState<FacilityProfile | null>(null);
  const [areas, setAreas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount('recycler');
  const fileRef = useRef<HTMLInputElement>(null);
  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f || !profile) return; try { setMessage(''); setProfile({ ...profile, photoUrl: await resizeImage(f) }); } catch (err) { setMessage(t('common.error') + ': ' + (err as Error).message); } };
  const load = async () => { setLoading(true); setError(''); try { const p = await api<FacilityProfile>('GET', '/recycler/profile'); setProfile(p); setAreas(p.serviceAreas.join(', ')); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!profile) return; setSaving(true); setMessage('');
    try { const p = await api<FacilityProfile>('PATCH', '/recycler/profile', { contact: profile.contact.trim(), facilityName: profile.facilityName.trim(), location: profile.location, photoUrl: profile.photoUrl ?? '', pickupEnabled: profile.pickupEnabled, serviceAreas: [...new Set(areas.split(',').map(x => x.trim()).filter(Boolean))] }); setProfile(p); setAreas(p.serviceAreas.join(', ')); updateRecycler({ serviceAreas: p.serviceAreas, pickupEnabled: p.pickupEnabled, authorized: p.authorized, facilityName: p.facilityName }); setMessage(t('recyclerPages.saved')); }
    catch (e) { setMessage(t('common.error') + ': ' + (e as Error).message); } finally { setSaving(false); }
  };
  return <RecyclerShell><h2 className="text-2xl font-bold mb-6">{t('common.profile')}</h2><RequestState loading={loading} error={error} retry={load} />
    {!loading && !error && profile && <form className={cardClass + ' max-w-3xl space-y-6'} onSubmit={save}>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} title={t('profileEdit.changePhoto', { defaultValue: 'Change photo' })} className="w-20 h-20 rounded-2xl bg-[var(--color-circuit-muted)] flex items-center justify-center overflow-hidden text-2xl font-bold text-[var(--color-circuit)] focus-ring-recycler">
          {profile.photoUrl ? <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" /> : (profile.facilityName || '?').charAt(0).toUpperCase()}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        <div>
          <p className="text-lg font-semibold break-words">{profile.facilityName}</p>
          {profile.joinedAt && <p className="text-sm text-gray-500">{t('profileEdit.activeSince', { defaultValue: 'Active since {{date}}', date: joinedLabel(profile.joinedAt) })}</p>}
          <p className="text-sm text-gray-500"><RatingBadge rating={profile.rating} /></p>
        </div>
      </div>
      <label className="block">{t('common.facilityName')}<input className={fieldClass + ' mt-2'} required disabled={saving} value={profile.facilityName} onChange={e => { setMessage(''); setProfile({ ...profile, facilityName: e.target.value }); }} /></label>
      <label className="block">{t('recyclerPages.location')}<input className={fieldClass + ' mt-2'} disabled={saving} value={profile.location ?? ''} onChange={e => { setMessage(''); setProfile({ ...profile, location: e.target.value }); }} /></label>
      <dl className="grid sm:grid-cols-2 gap-4">{[[t('common.authorizationNumber'), profile.authNumber], [t('common.status'), t(profile.authorized ? 'common.authorized' : 'common.approvalPending')]].map(([key, value]) => <div key={key}><dt className="text-sm text-gray-500">{key}</dt><dd className="font-medium break-words">{value}</dd></div>)}</dl>
      <label className="block">{t('common.contact')}<input className={fieldClass + ' mt-2'} required type="tel" disabled={saving} value={profile.contact} onChange={e => { setMessage(''); setProfile({ ...profile, contact: e.target.value }); }} /></label>
      <label className="block">{t('common.serviceArea')}<input className={fieldClass + ' mt-2'} value={areas} disabled={saving} onChange={e => { setMessage(''); setAreas(e.target.value); }} /><span className="text-sm text-gray-500">{t('recyclerPages.areasHelp')}</span></label>
      <label className="flex gap-3 items-center"><input type="checkbox" checked={profile.pickupEnabled} disabled={saving} onChange={e => { setMessage(''); setProfile({ ...profile, pickupEnabled: e.target.checked }); }} />{t('recyclerPages.pickupEnabled')}</label>
      <label className="block">{t('common.language')}<select className={fieldClass + ' mt-2'} value={i18n.language} onChange={e => { const lang = e.target.value as Language; void i18n.changeLanguage(lang); localStorage.setItem('kabadiwala-language', lang); setLanguage(lang); updateRecycler({ language: lang }); }}>{[['mr', 'मराठी'], ['hi', 'हिंदी'], ['en', 'English']].map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <div className="flex gap-4 flex-wrap items-center"><button className={saveClass} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button><p role="status">{message}</p></div>
      <ReviewList reviews={profile.reviews} />
      <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
        <Button type="button" variant="outline" fullWidth onClick={() => navigate('/recycler/help')}>{t('help.title', { defaultValue: 'Help' })}</Button>
        <Button type="button" variant="danger" fullWidth onClick={deleteAccount}>{t('profile.deleteAccount', { defaultValue: 'Delete Account' })}</Button>
      </div>
    </form>}
  </RecyclerShell>;
}
