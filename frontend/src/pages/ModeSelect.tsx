import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { ChevronRight, Recycle, Building2 } from 'lucide-react';
import { Container } from '../components/shared/primitives';

export function ModeSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setMode = useAuthStore((s) => s.setMode);
  const { isSignedIn } = useAuth();

  const handleSelect = (mode: 'collector' | 'recycler') => {
    setMode(mode);
    navigate(isSignedIn ? `/${mode}/setup` : `/${mode}/login`);
  };

  const roles = [
    { role: 'collector' as const, icon: Recycle, label: t('modeSelect.collector', { defaultValue: 'Collector' }), description: t('modeSelect.collectorDesc', { defaultValue: 'I collect e-waste and sell lots' }) },
    { role: 'recycler' as const, icon: Building2, label: t('modeSelect.recycler', { defaultValue: 'Recycler' }), description: t('modeSelect.recyclerDesc', { defaultValue: 'I run a recycling facility' }) },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
      <Container width="narrow" className="mx-auto">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-accent"><Recycle size={22} strokeWidth={1.75} /><span className="text-xl font-semibold text-foreground">KabadiWala</span></div>
          <h1 className="text-2xl font-semibold leading-snug text-foreground">{t('modeSelect.whoAreYou', { defaultValue: 'Are you a collector or a recycler?' })}</h1>
        </header>
        <div className="divide-y divide-line surface-card px-4">
          {roles.map(({ role, icon: Icon, label, description }) => (
            <button key={role} type="button" onClick={() => handleSelect(role)} className="flex min-h-[84px] w-full items-center gap-4 py-4 text-left focus-visible:ring-2 ring-accent ring-offset-2">
              <Icon size={22} strokeWidth={1.75} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block font-medium text-foreground">{label}</span><span className="mt-0.5 block text-sm text-muted">{description}</span></span>
              <ChevronRight size={18} strokeWidth={1.75} className="text-subtle" aria-hidden="true" />
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}
