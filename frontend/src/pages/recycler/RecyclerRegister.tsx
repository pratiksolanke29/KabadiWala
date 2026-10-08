import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Input';

const MOCK_CITIES = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'pune', label: 'Pune' },
  { value: 'nashik', label: 'Nashik' },
  { value: 'nagpur', label: 'Nagpur' },
  { value: 'thane', label: 'Thane' },
  { value: 'navi-mumbai', label: 'Navi Mumbai' },
];

export function RecyclerRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [facilityName, setFacilityName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [authNumber, setAuthNumber] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [facilityNameError, setFacilityNameError] = useState('');
  const [cityError, setCityError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [authNumberError, setAuthNumberError] = useState('');
  const [contactError, setContactError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacilityNameError('');
    setCityError('');
    setAddressError('');
    setAuthNumberError('');
    setContactError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!facilityName.trim()) {
      setFacilityNameError(t('recyclerRegister.facilityNameRequired', { defaultValue: 'Facility name is required' }));
      return;
    }
    if (!city) {
      setCityError(t('recyclerRegister.cityRequired', { defaultValue: 'Please select a city' }));
      return;
    }
    if (!address.trim()) {
      setAddressError(t('recyclerRegister.addressRequired', { defaultValue: 'Address is required' }));
      return;
    }
    if (!authNumber.trim()) {
      setAuthNumberError(t('recyclerRegister.authNumberRequired', { defaultValue: 'Authorization number is required' }));
      return;
    }
    if (!contact.trim()) {
      setContactError(t('recyclerRegister.contactRequired', { defaultValue: 'Contact is required' }));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setEmailError(t('recyclerRegister.emailRequired', { defaultValue: 'Valid email is required' }));
      return;
    }
    if (password.length < 8) {
      setPasswordError(t('auth.passwordError', { defaultValue: 'Password must be at least 8 characters' }));
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      return;
    }

    setLoading(true);
    
    // Mock register
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setLoading(false);
    
    // Show success message - in real app this would be handled by the backend
    alert(t('recyclerRegister.success', { defaultValue: 'Registration submitted! Awaiting admin approval.' }));
    navigate('/recycler/login');
  };

  const handleLoginClick = () => {
    navigate('/recycler/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-600 mb-4">
            <span className="text-3xl">♻️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kabadiwala</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Recycler Registration</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">
          <Input
            label={t('recyclerRegister.facilityName', { defaultValue: 'Facility Name' })}
            type="text"
            value={facilityName}
            onChange={(e) => { setFacilityName(e.target.value); setFacilityNameError(''); }}
            error={facilityNameError}
            placeholder="Enter your facility name"
            autoFocus
          />

          <Select
            label={t('recyclerRegister.city', { defaultValue: 'City' })}
            value={city}
            onChange={(e) => { setCity(e.target.value); setCityError(''); }}
            error={cityError}
            options={MOCK_CITIES}
            placeholder={t('recyclerRegister.selectCity', { defaultValue: 'Select your city' })}
          />

          <Input
            label={t('recyclerRegister.address', { defaultValue: 'Full Address' })}
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setAddressError(''); }}
            error={addressError}
            placeholder="Enter complete address"
            helperText={t('recyclerRegister.addressHelper', { defaultValue: 'Street, area, pincode' })}
          />

          <Input
            label={t('recyclerRegister.authNumber', { defaultValue: 'Authorization Number' })}
            type="text"
            value={authNumber}
            onChange={(e) => { setAuthNumber(e.target.value); setAuthNumberError(''); }}
            error={authNumberError}
            placeholder="Enter MPCB/CPCB authorization number"
            helperText={t('recyclerRegister.authNumberHelper', { defaultValue: 'Issued by Pollution Control Board' })}
          />

          <Input
            label={t('recyclerRegister.contact', { defaultValue: 'Contact Person' })}
            type="text"
            value={contact}
            onChange={(e) => { setContact(e.target.value); setContactError(''); }}
            error={contactError}
            placeholder="Name of contact person"
          />

          <Input
            label={t('common.email', { defaultValue: 'Email' })}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            error={emailError}
            placeholder="contact@facility.com"
            autoComplete="email"
          />

          <Input
            label={t('common.password', { defaultValue: 'Password' })}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
            error={passwordError}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />

          <Input
            label={t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
            error={confirmPasswordError}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t('common.register', { defaultValue: 'Register' })}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('recyclerRegister.haveAccount', { defaultValue: 'Already registered?' })}{' '}
            <button
              type="button"
              onClick={handleLoginClick}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {t('common.login', { defaultValue: 'Login' })}
            </button>
          </div>
        </form>

        {/* Info note */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-2">{t('recyclerRegister.note', { defaultValue: 'Note:' })}</p>
          <p>{t('recyclerRegister.approvalInfo', { defaultValue: 'After submission, your application will be reviewed by admin. You will be notified once approved.' })}</p>
        </div>
      </div>
    </div>
  );
}