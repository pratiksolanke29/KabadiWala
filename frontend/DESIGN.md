# KabadiWala visual system

## Direction

A calm, mobile-first marketplace UI: neutral surfaces carry the content, teal is the only brand accent, and status colors are reserved for status and destructive feedback. The existing route graph, stores, API contract, Clerk redirect/route flow, and translation resources are unchanged. This is a visual and markup refactor, not a behavior redesign.

## Foundations

### Color tokens

Defined in `src/styles/globals.css` with Tailwind CSS v4 `@theme`, so standard utilities such as `bg-surface`, `bg-panel`, `text-foreground`, `text-muted`, `border-line`, and `bg-accent` are generated natively.

| Token family | Light | Dark | Usage |
| --- | --- | --- | --- |
| Neutral scale | `#fafafa` through `#09090b` (11 steps) | Same neutral scale | Surface and low-emphasis UI |
| `surface` | `#fafafa` | `#18181b` | App canvas |
| `panel` | `#ffffff` | `#202024` | Forms, tables, grouped content |
| `surface-alt` | `#f4f4f5` | `#27272a` | Inputs, selections, quiet emphasis |
| `foreground` | `#18181b` | `#fafafa` | Main text |
| `muted` / `subtle` | `#52525b` / `#71717a` | `#d4d4d8` / `#a1a1aa` | Secondary text |
| `line` | `#e4e4e7` | `#3f3f46` | Hairline dividers and borders |
| `accent` | `#0f766e` | `#5eead4` | Brand action, links, active nav |
| `success`, `warning`, `danger`, `info` | Green, amber, red, blue semantic pairs | Contrast-adjusted semantic pairs | Status and feedback only |

Do not add another brand color or role-specific palette. Do not use old copper/circuit/verdigris/trust tokens or beige surfaces. Gradients are intentionally not part of the system.

### Theme and typography

- `data-theme="light|dark"` is the only theme mechanism. `index.html` starts with the saved theme or OS preference; the Profile theme control persists a manual override in `localStorage` and updates the theme-color meta tag.
- `lang` starts as `mr` and tracks i18next `languageChanged`, including English and Hindi.
- One sans stack: Inter with Noto Sans Devanagari as the script fallback. The font stylesheet is loaded from Google Fonts because package installation was unavailable in this workspace; for offline/self-hosted production, vendor the same families through `@fontsource`.
- Base text is 14px with 1.6 line-height; Marathi and Hindi are explicitly 1.6. Common text utilities use the 12/14/16/20/24px scale. A reserved `text-display` token (`clamp(3rem, 4vw, 3.5rem)`, tight leading) is for a future public landing page only.
- Tabular numerals are used for money/weights where surfaced. Monospace is reserved for handover codes and PINs.

### Spacing, shape, depth, and motion

- Main content widths are `Container`'s 640px narrow, 1100px content, and 1200px wide options; page gutters are 16px mobile / 24px desktop; `Section` uses 48px mobile / 64px desktop vertical rhythm.
- Shared shape tokens are 8px (`rounded-lg`) for controls and 12px (`rounded-card`) for grouped panels/modals, with full-round reserved for pills and avatars.
- Cards are flat, with a neutral 1px border. Shadows are limited to overlays and the fixed mobile navigation. No lift/scale hover effect.
- Transitions are color/opacity only at 150ms. The only bespoke reveal is the handover-code reveal; reduced-motion preferences suppress animation.
- Icons use lucide-react, defaulting to 16/18/20px and 1.75 stroke. No emoji are used as UI icons.

## Shared primitives and layout

| Primitive | Responsibility |
| --- | --- |
| `Button` | Primary, secondary, ghost, destructive/danger variants; `md` 44px and `lg` 48px sizes |
| `Card` / `surface-card` | Shared flat panel treatment for summary and grouped content |
| `PageHeader` | Semantic page title with optional back action, description, and trailing action |
| `Section` / `SectionTitle` | Consistent section rhythm and hierarchy |
| `ListRow` | Divided, wrap-safe row with metadata and optional trailing content/chevron |
| `Stat` | Tabular numeric summary |
| `Input` | Label, input/select, helper/error text, invalid state, visible focus |
| `Badge` / `StatusChip` | Neutral or semantic-tinted pill with visible text and a dot |
| `EmptyState` / `Skeleton` | Quiet empty state and static, shimmer-free loading block |
| `Sheet` / `Modal` | Overlay surface with the system radius and restrained shadow |
| `StepProgress` | Compact progress indicator for the four-screen create-lot flow |
| `AppShell` | Shared collector/recycler navigation; mobile bottom tabs and recycler desktop sidebar |
| `LanguageSwitcher` | Standalone mr/hi/en selector for future and current headers |
| `SiteHeader` / `SiteFooter` | Auth-independent landing-page chrome, intentionally not wired to `/` yet |
| `ThemeToggle` | Persistent manual light/dark preference |

## Screen/component audit

One line per existing screen or UI module, with its main visual change or remaining role.

### Entry, auth, and layouts

| File | Visual treatment |
| --- | --- |
| `src/pages/collector/LanguageSelect.tsx` | Centered wordmark and three plain language rows; long native-script labels wrap. |
| `src/pages/ModeSelect.tsx` | Two large role rows with short descriptions, no icon tiles or gradients. |
| `src/auth/AuthPage.tsx` | Clerk appearance shares neutral panel, accent button, font, and 8px control radius. |
| `src/auth/RoleSetup.tsx` | Replaced old warm/role palette with semantic surface and bordered controls. |
| `src/auth/AuthBridge.tsx` | Auth routing/bridge left unchanged. |
| `src/components/collector/CollectorLayout.tsx` | Collector account menu and logout confirmation use neutral primitives/tokens. |
| `src/components/collector/RecyclerLayout.tsx` | Recycler route content now uses the shared `AppShell`. |
| `src/components/shared/AppShell.tsx` | Collector centered column and recycler sidebar/mobile tabs share one navigation system. |
| `src/components/shared/SiteChrome.tsx` | Standalone auth-independent site header/footer for later landing-page work. |
| `src/components/shared/LanguageSwitcher.tsx` | Reusable native-language selector, not tied to the onboarding page. |
| `src/components/shared/ThemeToggle.tsx` | Profile-accessible persisted theme switch with accessible state. |

### Collector screens

| File | Visual treatment |
| --- | --- |
| `src/pages/collector/CollectorHomePage.tsx` | Primary create-lot action, single earned/pending summary, recent lots as rows, concise secondary links. |
| `src/pages/collector/CreateLotPhoto.tsx` | Shared thin four-step indicator and calmer photo/camera surface; camera workflow retained. |
| `src/pages/collector/CreateLotCategory.tsx` | Two-column mobile category choices with outline-only selected state and shared step indicator. |
| `src/pages/collector/CreateLotWeight.tsx` | Shared step indicator and semantic, wrap-safe weight form; estimate preview logic retained. |
| `src/pages/collector/CreateLotEstimate.tsx` | Shared step indicator and tabular estimate presentation; save/confirm behavior retained. |
| `src/pages/collector/MyLots.tsx` | Wrap-safe filters, neutral divided rows, semantic status chips. |
| `src/pages/collector/LotDetail.tsx` | Neutral detail groups and reserved monospace handover code. |
| `src/pages/collector/PriceBoard.tsx` | Table-like rates, one accent line chart without gradient fill, muted trend delta. |
| `src/pages/collector/Earnings.tsx` | Neutral totals and divided transaction history. |
| `src/pages/collector/RecyclerList.tsx` | Recycler choices use neutral surfaces, semantic text, and wrap-safe details. |
| `src/pages/collector/RecyclerQuote.tsx` | Quote hierarchy emphasizes the price and handover code without decorative gradient. |
| `src/pages/collector/Handover.tsx` | QR/code surfaces remain prominent; the code reveal is the only bespoke animation. |
| `src/pages/collector/Profile.tsx` | Neutral profile sections and persistent appearance control. |
| `src/pages/collector/Safety.tsx` | Safety copy uses semantic tokens and readable body sizing. |
| `src/pages/collector/Help.tsx` | Neutral header/form layout and full-width fields. |

### Recycler and admin screens

| File | Visual treatment |
| --- | --- |
| `src/pages/recycler/RecyclerDashboard.tsx` | Shared shell owns navigation; dashboard stats and lot rows use neutral surfaces and semantic statuses. |
| `src/pages/recycler/RecyclerRates.tsx` | Inline rate fields and tabs use bordered controls and semantic focus states. |
| `src/pages/recycler/RecyclerTransactions.tsx` | Transactions read as divided rows with explicit action/status labels. |
| `src/pages/recycler/RecyclerProfile.tsx` | Neutral profile editor with the same theme control. |
| `src/pages/recycler/RecyclerHelp.tsx` | Common help form and shared shell styling. |
| `src/pages/recycler/RecyclerShell.tsx` | Legacy shell styling exports retained for call-site compatibility but now use semantic tokens/shared shell. |
| `src/pages/admin/AdminPanel.tsx` | Status and destructive actions are semantic; tabular data remains table-first. |

### Shared UI and workflow components

| File | Visual treatment |
| --- | --- |
| `src/components/shared/Button.tsx` | Reduced to the three neutral/brand button types plus destructive, two sizes. |
| `src/components/shared/primitives.tsx` | Added `Container`, `Section`, `Card`, `PageHeader`, `SectionTitle`, `ListRow`, `Stat`, `Badge`, `EmptyState`, `Skeleton`, `Sheet`, and `StepProgress`. |
| `src/components/shared/StatusChip.tsx` | Status always includes a visible label and dot; semantic tint only communicates status. |
| `src/components/shared/Input.tsx` | Labeled 44px fields with helper/error text and focus-visible styling. |
| `src/components/shared/Modal.tsx` | Token-based panel, restrained overlay shadow, semantic feedback colors. |
| `src/components/shared/AddressFields.tsx` | Existing address inputs retained and restyled with semantic tokens. |
| `src/components/shared/CameraCapture.tsx` | Camera capture controls restyled; camera behavior untouched. |
| `src/components/shared/QrImage.tsx` | QR generation stays unchanged; surrounding visual styling is neutral. |
| `src/components/shared/QrScanner.tsx` | Scanner behavior retained; accessible, token-based control styling. |
| `src/components/shared/PinInput.tsx` | Clear focus state and tabular/monospace PIN entry. |
| `src/components/shared/NumberInput.tsx` | Semantic borders, neutral disabled state, visible focus. |
| `src/components/shared/CategoryIcon.tsx` | Existing category illustrations retained in neutral surfaces. |
| `src/components/shared/HelpForm.tsx` | Shared neutral form fields and readable support text. |
| `src/components/shared/IdentificationResult.tsx` | Identification result presentation uses semantic typography and surfaces. |
| `src/components/shared/Ratings.tsx` | Ratings presentation uses consistent type and neutral chrome. |

### App foundation and non-visual modules

| File | Treatment |
| --- | --- |
| `src/styles/globals.css` | Rebuilt around native Tailwind v4 `@theme` tokens, base typography, focus, utilities, and reduced motion. |
| `src/main.tsx` | Imports the single global stylesheet entry point. |
| `index.html` | KabadiWala title, SVG favicon, theme-color, font loading, and early system/saved-theme initialization. |
| `public/favicon.svg` | Simple neutral/teal recycle mark. |
| `src/i18n/index.ts` | Existing resources/default language retained; document `lang` follows language changes. |
| `src/App.tsx` | Route tree and behavior unchanged; only stylesheet placement and footer token utilities changed. |
| `src/api.ts` | Unchanged API client. |
| `src/hooks/useAuthStore.ts` | Unchanged auth/language/mode store. |
| `src/hooks/useLotStore.ts` | Unchanged lot store. |
| `src/hooks/useRecyclerStore.ts` | Unchanged recycler store. |
| `src/auth/useLogout.ts`, `src/auth/useDeleteAccount.ts` | Account actions unchanged. |
| `src/identify.ts`, `src/utils/distance.ts`, `src/utils/imageResize.ts` | Non-visual utilities unchanged. |
| `src/types/index.ts`, `src/data/indiaLocations.json` | Types and location data unchanged. |
| `src/i18n/en.json`, `src/i18n/hi.json`, `src/i18n/mr.json` | All translation resource files unchanged; no keys were added or removed. |

## Landing-page readiness (not enabled yet)

- Route `/` remains the existing language selector. `LanguageSelect` is a separate component, so moving it to `/start` later requires only a route path change.
- `Container`, `Section`, `SiteHeader`, `SiteFooter`, and `LanguageSwitcher` are reusable now; none of the landing-page chrome is wired onto `/` in this refactor.
- `text-display` is reserved for the future landing page only.

## Usage guidance

**Do:** use semantic tokens, `surface-card`/`Card` for grouped content, row dividers for repeated entities, explicit status labels, `tabular-nums` for money/weights, and wrap-safe `min-w-0`/`break-words` for Marathi/Hindi.

**Don't:** introduce a second accent or role palette, gradients, card shadows, icon-in-color-square tiles, hover lift/scale, clipped/truncated Devanagari labels, monochrome-only statuses, or per-page duplicate surface token definitions.

## Validation and limitations

- Parsed all 61 TypeScript/TSX files with the globally available TypeScript parser: **0 syntax diagnostics**. This is a syntax check, not a semantic typecheck.
- A source scan found no TSX/CSS matches for `[var(--...)` arbitrary classes, `dark:` variants, gradient classes, `shadow-xl`, `rounded-2xl`, `border-2`, `truncate`, `line-clamp`, or hover scale/translate patterns.
- Monospace utility usage is limited to handover codes and PIN entry.
- Compared API/store files, all three translation resources, auth bridge/logout helper, and route tree against the supplied source. The `App.tsx` diff is limited to moving the global CSS import to `main.tsx` and replacing the old footer CSS-variable classes; route declarations are unchanged.
- `npm run build` **could not complete** because dependencies are absent from this workspace (`vite/client` and `node` type definitions are unavailable). `npm run lint` **could not start** because `oxlint` is not installed. An attempted package restore did not complete because the package registry/cache was unavailable.
- Consequently, real-browser screenshots and the requested visual verification at 360/375/768/1280px across light/dark and mr/en were not executable here. Run `npm ci`, `npm run build`, and `npm run lint` in a networked environment, then perform those viewport/language checks before production merge.
