import type { ComponentProps, CSSProperties } from 'react';
import type { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

type Appearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>;

/*
 * Clerk appearance for the auth pages (AuthPage).
 *
 * Light: unchanged from the original config (token-driven via CSS vars).
 * Dark: explicit HEX values only. Clerk derives shades from these, and it does
 * not reliably resolve `var(--x)` for every derived colour, which is why the old
 * config fell back to white inputs and dark text on the social button.
 * Do NOT point these at the global olive dark tokens in globals.css.
 */

export const AUTH_DARK = {
  page: '#09090b',
  card: '#18181b',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  surfaceAlt: '#27272a',
  text: '#fafafa',
  inputText: '#f4f4f5',
  muted: '#a1a1aa',
  placeholder: '#9b9ba4',
  border: '#3f3f46',
  socialHover: '#3a3a40',
  focus: '#10b981',
  focusRing: 'rgba(16, 185, 129, 0.45)',
  cta: '#047857',
  ctaHover: '#065f46',
  onCta: '#ffffff',
  link: '#34d399',
  danger: '#f87171',
} as const;

export const lightAppearance: Appearance = {
  variables: {
    colorPrimary: 'var(--color-accent)',
    colorBackground: 'var(--color-panel)',
    colorText: 'var(--color-foreground)',
    colorTextSecondary: 'var(--color-muted)',
    fontFamily: 'Inter, Noto Sans Devanagari, system-ui, sans-serif',
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full rounded-card border border-line bg-panel shadow-none',
    formButtonPrimary: 'rounded-lg bg-accent text-on-accent hover:bg-accent-hover',
    footerActionLink: 'text-accent',
    formFieldInput: 'rounded-lg border-line focus-visible:ring-2 ring-accent ring-offset-2',
  },
};

const D = AUTH_DARK;

export const darkAppearance: Appearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: D.cta,
    colorPrimaryForeground: D.onCta,
    colorTextOnPrimaryBackground: D.onCta,
    colorBackground: D.card,
    colorNeutral: '#ffffff',
    colorForeground: D.text,
    colorText: D.text,
    colorMutedForeground: D.muted,
    colorTextSecondary: D.muted,
    colorInputBackground: D.surfaceAlt,
    colorInputForeground: D.inputText,
    colorInputText: D.inputText,
    colorBorder: D.border,
    colorRing: D.focusRing,
    colorDanger: D.danger,
    fontFamily: 'Inter, Noto Sans Devanagari, system-ui, sans-serif',
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: {
      width: '100%',
      backgroundColor: D.card,
      border: `1px solid ${D.cardBorder}`,
      borderRadius: '12px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 16px 40px -16px rgba(0, 0, 0, 0.8)',
    },
    headerTitle: { color: D.text },
    headerSubtitle: { color: D.muted },
    formFieldLabel: { color: D.muted },
    dividerText: { color: D.muted },
    dividerLine: { backgroundColor: D.border },
    socialButtonsBlockButton: {
      backgroundColor: D.surfaceAlt,
      border: `1px solid ${D.border}`,
      color: D.text,
      '&:hover, &:focus': { backgroundColor: D.socialHover },
    },
    socialButtonsBlockButtonText: { color: D.text },
    formFieldInput: {
      backgroundColor: D.surfaceAlt,
      border: `1px solid ${D.border}`,
      color: D.inputText,
      '&::placeholder': { color: D.placeholder },
      '&:focus': {
        borderColor: D.focus,
        boxShadow: `0 0 0 2px ${D.focusRing}`,
        outline: 'none',
      },
    },
    formButtonPrimary: {
      backgroundColor: D.cta,
      backgroundImage: 'none',
      color: D.onCta,
      boxShadow: 'none',
      '&:hover, &:focus, &:active': { backgroundColor: D.ctaHover },
    },
    formFieldAction: { color: D.link },
    formResendCodeLink: { color: D.link },
    footerActionText: { color: D.muted },
    footerActionLink: { color: D.link },
    footer: {
      backgroundColor: 'transparent',
      backgroundImage: 'none',
    },
  },
};

/** CSS-var overrides for the page wrapper so Tailwind tokens match in dark. */
export const AUTH_DARK_PAGE_VARS = {
  '--color-surface': D.page,
  '--color-panel': D.card,
  '--color-surface-alt': D.surfaceAlt,
  '--color-foreground': D.text,
  '--color-muted': D.muted,
  '--color-line': D.border,
  '--color-accent': D.link,
} as CSSProperties;