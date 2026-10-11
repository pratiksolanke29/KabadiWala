import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { SiteHeader, SiteFooter } from '../components/shared/SiteChrome';
import { Container, Section } from '../components/shared/primitives';
import { Camera, Recycle, Scale, ScanLine, ShieldCheck, Smartphone, TrendingUp } from 'lucide-react';

const stepIcons = [Camera, Scale, TrendingUp, ScanLine] as const;

const linkClass = 'inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 ring-accent ring-offset-2';
const primaryCta = `${linkClass} border border-accent bg-accent text-on-accent hover:bg-accent-hover hover:border-accent-hover`;
const secondaryCta = `${linkClass} border border-line bg-panel text-foreground hover:bg-surface-alt`;

function EstimateMockup() {
  const { t } = useTranslation();
  // Illustrative figures matching the app's real estimate math (weight × market
  // min/max per kg; Batteries ₹110–140/kg at 24.5 kg). Labelled illustrative below.
  return (
    <div className="mx-auto w-full max-w-[320px]">
      {/* Phone frame uses only existing tokens (line, panel, surface-alt, accent) */}
      <div aria-hidden="true" className="rounded-[28px] border border-line bg-panel p-3">
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-surface-alt" />
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="text-xs text-muted">{t('createLot.title', { defaultValue: 'Create Lot' })}</p>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface-alt p-3">
            <Recycle size={18} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{t('categories.Batteries', { defaultValue: 'Batteries' })}</span>
            <span className="text-sm tabular-nums text-foreground">24.5 kg</span>
          </div>
          <p className="mt-4 text-center text-xs text-muted">{t('lotDetail.estimate', { defaultValue: 'Value Estimate' })}</p>
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <span className="text-2xl font-semibold tabular-nums text-accent">₹2,695</span>
            <span className="text-xl text-subtle">-</span>
            <span className="text-2xl font-semibold tabular-nums text-accent">₹3,430</span>
          </div>
          <p className="mt-1 text-center text-xs text-muted">{t('landing.mockup.perKg', { defaultValue: 'per kg' })}</p>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-accent bg-accent px-3 py-2 text-center text-sm font-medium text-on-accent">
              {t('common.findRecycler', { defaultValue: 'Find Recycler' })}
            </div>
            <div className="rounded-lg border border-line bg-panel px-3 py-2 text-center text-sm font-medium text-foreground">
              {t('landing.mockup.saveLot', { defaultValue: 'Save Lot' })}
            </div>
          </div>
        </div>
      </div>
      {/* Screen-reader text: the phone frame is decorative; this is the actual content. */}
      <p className="sr-only">{t('landing.hero.screenAlt', { defaultValue: 'Illustration of the KabadiWala app estimate screen' })}</p>
      <p className="mt-2 text-center text-xs text-subtle">{t('landing.mockup.disclaimer', { defaultValue: 'Illustrative example — not a real estimate' })}</p>
    </div>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps = t('landing.how.steps', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const stepList = Array.isArray(steps) ? steps : [];
  return (
    <Section aria-labelledby="how-it-works">
      <Container width="content">
        <h2 id="how-it-works" className="text-base font-semibold text-foreground">{t('landing.how.title', { defaultValue: 'How it works' })}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {stepList.map((step, index) => {
            const Icon = stepIcons[index] ?? Camera;
            return (
              <li key={step.title} className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-accent">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span aria-hidden="true" className="text-sm font-medium tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-3 font-medium text-foreground">{step.title}</h3>
                <p className="mt-1 max-w-[60ch] text-sm text-muted">{step.desc}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

function RoleColumns() {
  const { t } = useTranslation();
  const collectorBenefits = t('landing.roles.collector.benefits', { returnObjects: true }) as string[];
  const recyclerBenefits = t('landing.roles.recycler.benefits', { returnObjects: true }) as string[];
  return (
    <Section aria-labelledby="roles-title">
      <Container width="content">
        <h2 id="roles-title" className="text-base font-semibold text-foreground">{t('landing.roles.title', { defaultValue: 'Built for both sides' })}</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">{t('landing.roles.collector.title', { defaultValue: 'For collectors' })}</h3>
            <ul className="mt-3 space-y-2">
              {(Array.isArray(collectorBenefits) ? collectorBenefits : []).map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-muted">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">{t('landing.roles.recycler.title', { defaultValue: 'For recyclers' })}</h3>
            <ul className="mt-3 space-y-2">
              {(Array.isArray(recyclerBenefits) ? recyclerBenefits : []).map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-muted">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function TrustSafety() {
  const { t } = useTranslation();
  const items = t('landing.trust.items', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  return (
    <Section aria-labelledby="trust-title" className="border-y border-line bg-panel">
      <Container width="content">
        <h2 id="trust-title" className="text-base font-semibold text-foreground">{t('landing.trust.title', { defaultValue: 'Trust and safety' })}</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-muted">{t('landing.trust.subtitle', { defaultValue: '' })}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {(Array.isArray(items) ? items : []).map((item) => (
            <div key={item.title} className="min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" aria-hidden="true" />
                <h3 className="font-medium text-foreground">{item.title}</h3>
              </div>
              <p className="mt-1 max-w-[60ch] text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function FinalCta() {
  const { t } = useTranslation();
  return (
    <Section aria-labelledby="final-cta-title">
      <Container width="narrow" className="text-center">
        <h2 id="final-cta-title" className="text-xl font-semibold text-foreground">{t('landing.cta.line', { defaultValue: 'Start your first lot today.' })}</h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/collector/signup" className={`${primaryCta} w-full sm:w-auto`}>{t('landing.cta.collector', { defaultValue: 'Get started as a collector' })}</a>
          <a href="/recycler/signup" className={`${secondaryCta} w-full sm:w-auto`}>{t('landing.cta.recycler', { defaultValue: 'Get started as a recycler' })}</a>
        </div>
      </Container>
    </Section>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth();
  const { collector, recycler, mode } = useAuthStore();
  const location = useLocation();

  // Signed-in users with a loaded profile land directly in the app; everyone
  // else (including signed-in users who still need setup) sees the marketing page.
  const hasProfile = mode === 'recycler' ? !!recycler : mode === 'collector' ? !!collector : false;
  if (isLoaded && isSignedIn && hasProfile && mode) {
    return <Navigate to={mode === 'collector' ? '/collector/home' : '/recycler/dashboard'} replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-line focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:text-foreground">
        {t('landing.skipToContent', { defaultValue: 'Skip to main content' })}
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Section className="pb-10 md:pb-14" aria-labelledby="hero-title">
          <Container width="wide">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <Smartphone size={14} aria-hidden="true" />
                  {t('landing.hero.badge', { defaultValue: 'For collectors and recyclers' })}
                </p>
                <h1 id="hero-title" className="mt-3 font-display text-display leading-tight text-foreground">{t('landing.hero.title', { defaultValue: 'Fair value for e-waste' })}</h1>
                <p className="mt-4 max-w-[60ch] text-sm text-muted md:text-base">{t('landing.hero.subtitle', { defaultValue: 'Photograph, weigh, get quoted, get paid.' })}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href="/collector/signup" className={primaryCta}>{t('landing.hero.collectorCta', { defaultValue: "I'm a collector" })}</a>
                  <a href="/recycler/signup" className={secondaryCta}>{t('landing.hero.recyclerCta', { defaultValue: "I'm a recycler" })}</a>
                </div>
              </div>
              <div className="animate-code-reveal min-w-0 lg:justify-self-end">
                <EstimateMockup />
              </div>
            </div>
          </Container>
        </Section>
        <HowItWorks />
        <RoleColumns />
        <TrustSafety />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

export default LandingPage;
