import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { PinInput } from '../../components/shared/PinInput';
import { Select } from '../../components/shared/Input';

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

export function CollectorRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setCollector = useAuthStore((s) => s.setCollector);

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [area, setArea] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'))) {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPinError('');
    setConfirmPinError('');
    setAreaError('');

    const digits = phone.replace(/\D/g, '');
    // Accept 10-digit local format (9876543210) or 12-digit with 91 prefix (919876543210)
    const isValid = digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
    if (!isValid) {
      setPhoneError(t('auth.phoneError', { defaultValue: 'Please enter a valid 10-digit phone number' }));
      return;
    }
    const localPhone = digits.length === 12 ? digits.slice(2) : digits;

    if (pin.length !== 4) {
      setPinError(t('auth.pinError', { defaultValue: 'PIN must be 4 digits' }));
      return;
    }

    if (pin !== confirmPin) {
      setConfirmPinError(t('auth.pinMismatch', { defaultValue: 'PINs do not match' }));
      return;
    }

    if (!area) {
      setAreaError(t('auth.areaRequired', { defaultValue: 'Please select your area' }));
      return;
    }

    setLoading(true);
    
    // Mock register - in real app, call API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock successful registration
    setCollector({
      phone: `+91${localPhone}`,
      pinHash: 'hashed',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      collectorId: `COL-${localPhone.slice(-6)}`,
      area,
      language: 'mr',
    });
    
    setLoading(false);
    navigate('/collector/home');
  };

  const handleLoginClick = () => {
    navigate('/collector/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-600 mb-4">
            <span className="text-3xl">♻️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kabadiwala</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Collector Registration</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">
          <Input
            label={t('common.phone', { defaultValue: 'Phone Number' })}
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={phoneError}
            placeholder="+91 98765 43210"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
          />

          <PinInput
            label={t('common.pin', { defaultValue: 'Create 4-Digit PIN' })}
            value={pin}
            onChange={setPin}
            error={pinError}
            length={4}
          />

          <PinInput
            label={t('auth.confirmPin', { defaultValue: 'Confirm PIN' })}
            value={confirmPin}
            onChange={setConfirmPin}
            error={confirmPinError}
            length={4}
          />

          <Select
            label={t('common.area', { defaultValue: 'Area / Village' })}
            value={area}
            onChange={(e) => { setArea(e.target.value); setAreaError(''); }}
            error={areaError}
            options={MOCK_AREAS}
            placeholder={t('common.selectArea', { defaultValue: 'Select your area' })}
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t('common.register', { defaultValue: 'Register' })}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.haveAccount', { defaultValue: 'Already have an account?' })}{' '}
            <button
              type="button"
              onClick={handleLoginClick}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {t('common.login', { defaultValue: 'Login' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}