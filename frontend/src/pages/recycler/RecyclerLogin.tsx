import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';

export function RecyclerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRecycler = useAuthStore((s) => s.setRecycler);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierError('');
    setPasswordError('');

    if (!identifier.trim()) {
      setIdentifierError(t('auth.identifierRequired', { defaultValue: 'Please enter your ID/phone/email' }));
      return;
    }

    if (password.length < 8) {
      setPasswordError(t('auth.passwordError', { defaultValue: 'Password must be at least 8 characters' }));
      return;
    }

    setLoading(true);
    
    // Mock login
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock successful login
    setRecycler({
      id: 'r1',
      facilityName: 'Green Recyclers Pvt Ltd',
      emailOrPhone: identifier,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      authorized: true,
      serviceAreas: ['andheri-east', 'andheri-west', 'bandra-east'],
      pickupEnabled: true,
      language: 'mr',
    });
    
    setLoading(false);
    navigate('/recycler/dashboard');
  };

  const handleRegisterClick = () => {
    navigate('/recycler/register');
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">Recycler Login</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-5">
          <Input
            label={t('recyclerLogin.identifier', { defaultValue: 'Recycler ID / Phone / Email' })}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={identifierError}
            placeholder="Enter your ID, phone or email"
            autoComplete="username"
            autoFocus
          />

          <Input
            label={t('common.password', { defaultValue: 'Password' })}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t('common.login', { defaultValue: 'Login' })}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('recyclerLogin.newUser', { defaultValue: 'New recycler?' })}{' '}
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {t('common.register', { defaultValue: 'Register' })}
            </button>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-400 text-center">
          <p className="font-medium mb-1">{t('auth.demoCredentials', { defaultValue: 'Demo Credentials' })}</p>
          <p>ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">r1</code></p>
          <p>Password: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">password123</code></p>
        </div>
      </div>
    </div>
  );
}