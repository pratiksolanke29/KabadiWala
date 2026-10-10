import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select } from './Input';
import india from '../../data/indiaLocations.json';

// State > district > subdistrict dropdowns + pincode. Used by collector and recycler registration.
// lat/lon = centre of the chosen district (used for the "X km away" distance).
export interface AddressValue { state: string; district: string; subdistrict: string; pincode: string }
export const EMPTY_ADDRESS: AddressValue = { state: '', district: '', subdistrict: '', pincode: '' };

interface District { n: string; c?: number[]; t: string[] }
interface State { n: string; c?: number[]; d: District[] }
const STATES = india as State[];

const opt = (v: string) => ({ value: v, label: v });

export function addressLatLon(a: AddressValue): { lat?: number; lon?: number } {
  const st = STATES.find((s) => s.n === a.state);
  const c = st?.d.find((d) => d.n === a.district)?.c ?? st?.c;
  return c ? { lat: c[0], lon: c[1] } : {};
}

// Returns an error message, or '' when the address is complete.
export function addressError(a: AddressValue, t: (k: string, o?: Record<string, unknown>) => string): string {
  const st = STATES.find((s) => s.n === a.state);
  const dist = st?.d.find((d) => d.n === a.district);
  if (!a.state || !a.district || (dist && dist.t.length > 0 && !a.subdistrict)) return t('clerkAuth.fillAll', { defaultValue: 'Please fill all fields' });
  if (!/^[1-9][0-9]{5}$/.test(a.pincode)) return t('address.badPincode', { defaultValue: 'Enter a valid 6-digit pincode' });
  return '';
}

export function AddressFields({ value, onChange }: { value: AddressValue; onChange: (v: AddressValue) => void }) {
  const { t } = useTranslation();
  const districts = useMemo(() => STATES.find((s) => s.n === value.state)?.d ?? [], [value.state]);
  const subs = useMemo(() => districts.find((d) => d.n === value.district)?.t ?? [], [districts, value.district]);
  return (
    <>
      <Select label={t('address.state', { defaultValue: 'State' })} value={value.state} options={STATES.map((s) => opt(s.n))}
        placeholder={t('address.selectState', { defaultValue: 'Select state' })}
        onChange={(e) => onChange({ ...value, state: e.target.value, district: '', subdistrict: '' })} />
      <Select label={t('address.district', { defaultValue: 'District' })} value={value.district} options={districts.map((d) => opt(d.n))}
        placeholder={t('address.selectDistrict', { defaultValue: 'Select district' })} disabled={!value.state}
        onChange={(e) => onChange({ ...value, district: e.target.value, subdistrict: '' })} />
      <Select label={t('address.subdistrict', { defaultValue: 'Subdistrict / Taluka' })} value={value.subdistrict} options={subs.map(opt)}
        placeholder={t('address.selectSubdistrict', { defaultValue: 'Select subdistrict' })} disabled={!value.district || subs.length === 0}
        onChange={(e) => onChange({ ...value, subdistrict: e.target.value })} />
      <Input label={t('address.pincode', { defaultValue: 'Pincode' })} value={value.pincode} inputMode="numeric" maxLength={6} placeholder="400001"
        onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
    </>
  );
}
