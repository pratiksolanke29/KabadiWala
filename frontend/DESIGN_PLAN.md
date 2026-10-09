# KabadiWala Design Plan

## 1. Subject & Audience

**Product**: KabadiWala — vernacular, low-literacy-friendly platform connecting India's informal scrap collectors with authorized e-waste recyclers, with fair prices, verified buyers, and documented handover.

**Primary users**:
- **Collectors**: Informal scrap collectors (kabadiwalas), low or semi-literate, entry-level Android phones. Marathi/Hindi/English speakers. They photograph e-waste, categorize, weigh, get estimates, find nearby verified recyclers, generate handover codes, track earnings.
- **Recyclers**: Authorized e-waste recycling facility operators, phone or laptop. Manage incoming lots, accept/decline, confirm handovers with code verification, set material rates, view transaction history.

**Core job**: Enable trustworthy e-waste handover with price transparency and traceability — the handover code/QR is the centerpiece artifact.

**Vernacular/Industry signals**: Copper wire, PCB traces, solder mask blues, cable insulation, oxidised copper patina, battery cells, safety warnings (burn/acid), brass verification stamps. Physical world of the scrap yard: warm copper tones, circuit blues, charcoal insulation, verdigris success green.

---

## 2. Color Tokens (6 core + semantic roles)

| Token | Hex | Source | Semantic Role |
|-------|-----|--------|---------------|
| `copper` | `#B87333` | Copper wire / PCB traces | **Primary** — Collector CTAs, active states, primary buttons, progress |
| `copper-dark` | `#965E2A` | Oxidized copper | Primary hover/pressed |
| `copper-light` | `#D4A574` | Bright copper highlight | Primary light backgrounds, focus rings (collector) |
| `copper-muted` | `#E8D5C4` | Copper dust | Subtle accents, borders |
| `circuit` | `#0D4F8B` | PCB solder mask blue | **Recycler primary** — Recycler UI, verification, trust, secondary buttons |
| `circuit-light` | `#1A6FC6` | Lit LED / highlight blue | Recycler accents, links, focus rings (recycler) |
| `circuit-muted` | `#C8DBF0` | Solder mask wash | Recycler subtle backgrounds |
| `verdigris` | `#2D7D6B` | Copper patina / green PCB | **Success** — Paid, confirmed, completed, positive earnings |
| `verdigris-light` | `#4FA891` | Fresh patina | Success light backgrounds |
| `verdigris-muted` | `#D1E5E0` | Patina wash | Success subtle |
| `warning` | `#D45C2E` | Exposed wire / heat | **Danger/Warning** — Burn hazard, acid alerts, decline, critical errors |
| `warning-dark` | `#A84622` | Charred insulation | Danger hover |
| `warning-light` | `#F5D0C4` | Heat glow | Danger light backgrounds |
| `cable` | `#1C1C1E` | Charcoal cable sheath | **High-contrast text**, headers (light mode) |
| `cable-muted` | `#6B6B6F` | Weathered cable | Muted text, placeholders |
| `insulation` | `#F5F0E8` | Aged cable sheath / paper | **Light surface** — Page background, cards |
| `insulation-alt` | `#EDE5D8` | Slightly darker sheath | Elevated cards, alternate rows |
| `insulation-dark` | `#141416` | Charcoal insulation | **Dark surface** — Page background (dark mode) |
| `insulation-dark-alt` | `#1E1E20` | Dark sheath variant | Elevated cards (dark mode) |
| `trust` | `#C8A040` | Brass hallmark stamps | **Trust/Verification** — Verified badges, authorization, gold standard |
| `trust-light` | `#E8D4A0` | Polished brass | Trust light backgrounds |
| `trust-muted` | `#F5EDD8` | Brass dust | Trust subtle |

**Semantic Aliases** (contextual):
- Collector context: `--color-collector-primary` = `copper`, `--focus-ring-collector` = `copper-light`
- Recycler context: `--color-recycler-primary` = `circuit`, `--focus-ring-recycler` = `circuit-light`

---

## 3. Typography

| Role | Font | Script Support | Weights |
|------|------|----------------|---------|
| **Display / Headlines (Devanagari)** | **Ek Mukta** | Devanagari + Latin | 400, 500, 600, 700 |
| **UI / Body (Devanagari + Latin)** | **IBM Plex Sans** | Devanagari + Latin | 300, 400, 500, 600 |
| **Monospace (codes, weights, rates)** | **JetBrains Mono** | Latin + ₹ | 400, 500, 600 |

**Fluid Type Scale** (clamp-based):
```css
--text-step--1: clamp(0.75rem, 0.73rem + 0.12vw, 0.8125rem);  /* caption */
--text-step-0:  clamp(0.875rem, 0.85rem + 0.14vw, 1rem);        /* body */
--text-step-1:  clamp(1rem, 0.96rem + 0.2vw, 1.125rem);         /* subhead */
--text-step-2:  clamp(1.125rem, 1.06rem + 0.32vw, 1.375rem);   /* h3 */
--text-step-3:  clamp(1.375rem, 1.25rem + 0.62vw, 1.75rem);    /* h2 */
--text-step-4:  clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);       /* h1 */
--text-step-5:  clamp(2.25rem, 1.8rem + 2.25vw, 3.5rem);       /* display */
```

**Line-heights**: Devanagari body = 1.6; Latin body = 1.5; Headlines = 1.2–1.3.

**Line Length Targets**: Latin body ≤ 70ch; Devanagari body ≤ 45ch; Monospace codes ≤ 20ch.

**Language-Switch Behavior**: Changing language changes typeface weight:
- Marathi/Hindi → Ek Mukta Medium for headlines, IBM Plex Sans Regular for body
- English → IBM Plex Sans Medium for headlines, IBM Plex Sans Regular for body

---

## 4. Layout Concept (ASCII wireframes)

### Collector Home (Hero = Primary Action)
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │  Kabadiwala  [lang] [profile] │  │  ← Header only on Home
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│                                     │
│      ┌─────────────────────┐        │
│      │  Welcome back!      │        │  ← Greeting (step-2)
│      │  Choose an action   │        │
│      └─────────────────────┘        │
│                                     │
│   ┌──────────────┐ ┌──────────────┐  │
│   │  Earned: ₹    │ │ Pending: ₹   │  │  ← Stat cards (step-0, step-3)
│   └──────────────┘ └──────────────┘  │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ +   │ │ ₹   │ │ 📦  │            │  ← 3-col action tiles
│  │Lot  │ │Rates│ │Lots │            │     Copper accent border
│  └─────┘ └─────┘ └─────┘            │
│  ┌─────┐ ┌─────┐ ┌─────┐            │
│  │ 💰  │ │ 🛡️  │ │     │            │
│  │ Earn│ │Safe │ │     │            │
│  └─────┘ └─────┘ └─────┘            │
│                                     │
│  Quick Stats: Draft │ Quoted │ H/O  │  ← 4 stat pills
│                     │ Paid   │       │
│                                     │
│  ┌─────────────────────────────┐   │  ← Fixed bottom: Language tabs
│  │  मराठी  │  हिंदी  │  English │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Price Board (Data-dense, left-aligned)
```
┌─────────────────────────────────────┐
│  ←  Price Board          [loc] [↻]  │
├─────────────────────────────────────┤
│  📍 Andheri East    Updated 2m ago  │
├─────────────────────────────────────┤
│  📺 CRT        Market: ₹12-18/kg ↗  │  ← Row: left = info, right = rate
│  ₹15/kg       Mini sparkline         │     Monospace for numbers
│  ─────────────────────────────────  │
│  📱 LCD        Market: ₹45-65/kg ↘  │
│  ₹55/kg       Recycler: ₹58/kg        │
│  ─────────────────────────────────  │
│  🔧 PCB        Market: ₹120-180/kg → │
│  ₹150/kg                              │
└─────────────────────────────────────┘
```

### Safety Page (Icon + text cards, center-aligned hero)
```
┌─────────────────────────────────────┐
│  ←  Safety                          │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 🛡️  Stay Safe While...      │   │  ← Hero info banner (circuit)
│  │  Follow guidelines...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔥  Don't Burn Cables       │   │  ← Cards: icon left, text right
│  │  Burning cables pollutes... │   │     verdigris border-left on hover
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📺  CRT Handling            │   │
│  │  CRT monitors contain...    │   │
│  └─────────────────────────────┘   │
│  ...                                │
│  ┌─────────────────────────────┐   │
│  │ ⚠️  Emergency Contacts      │   │  ← Red accent (warning)
│  │  Fire: 101  Ambulance: 108  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Recycler Dashboard (Data tables, left-aligned)
```
┌─────────────────────────────────────┐
│  ♻️ Kabadiwala Recycler  [tabs] [👤]│
├─────────────────────────────────────┤
│  Welcome back!  [Refresh]           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │  ← 4 stat cards
│  │📥 5│ │✅ 2│ │📦 1│ │📋 42│        │
│  └────┘ └────┘ └────┘ └────┘        │
│  Incoming Lots              [Filter] │
│  ┌────────────────────────────────┐ │
│  │ 📷  CRT  Pending   15kg  2.3km │ │  ← Row: photo | info | actions
│  │      Lot: A1B2C3D4  ₹15/kg     │ │     [Accept] [Decline]
│  ├────────────────────────────────┤ │
│  │ 📷  PCB  Accepted  8kg   0.5km │ │     [Handover]
│  │      Lot: E5F6G7H8  ₹150/kg    │ │
│  └────────────────────────────────┘ │
│  Completed: ...                     │
└─────────────────────────────────────┘
```

**Alignment Rules**:
- Hero/headline sections: **center**
- Lists, tables, data rows: **left**
- Action tiles/buttons: **center** (mobile), left (desktop)
- Monospace numbers: **tabular-nums**, right-aligned in columns

---

## 5. Principles (5 rules that make this *KabadiWala*)

1. **Handover code is the hero** — The 6-char code / QR is the most important UI element. It gets monospace treatment, large size, copper accent, and generous breathing room. Everything else supports it.

2. **Material honesty over decoration** — Colors come from copper, circuit boards, cable insulation, patina. No "brand orange" or "SaaS blue." The palette exists in the scrap yard.

3. **Vernacular-first typography** — Ek Mukta for Marathi/Hindi headlines signals "this speaks your script." IBM Plex Sans for body keeps technical clarity. Language switch changes weight, not layout.

4. **Instant state, no theater** — No fade-slide entrances on cards. Checkbox → checkmark instantly. Button press → immediate feedback. Motion only for handover code generation (one orchestrated moment).

5. **Numbers are for scanning** — All weights, rates, codes, money use JetBrains Mono with tabular figures. ₹ appears once per row, not every cell. Columns align.

---

## 6. Anti-Pattern Audit (from skill references)

| Anti-Pattern | Current State | Action |
|--------------|---------------|--------|
| Warm cream (#F4F1EA) + terracotta (#D97757) | ❌ Present in globals.css gradients | Replace with `insulation` + `copper` |
| Near-black + acid green | ❌ Not present | N/A |
| Broadsheet newspaper (hairline rules, dense columns) | ❌ Not present | N/A |
| SaaS-card kit (identical rounded cards, same radius, same shadow) | ⚠️ Present: identical `rounded-2xl` cards with `shadow-lg` | Vary radius by hierarchy: tiles=2xl, cards=xl, chips=full |
| Template chrome (ALL CAPS labels, middle dots, tinted black, → arrows) | ⚠️ Some emoji icons, emoji in CategoryIcon | Replace emoji with SVG material icons; sentence case labels |
| Orange/amber gradient on every screen | ❌ Present: `from-orange-50 via-white to-amber-50` on all collector pages | Solid `insulation` surface + copper accent line |
| Emoji icons (📦 💰 🛡️ ♻️ 🔥) | ❌ Throughout: CategoryIcon, tiles, stats | Custom SVG icons: copper coil, PCB trace, battery cell, verdigris leaf |
| Generic green/red/orange for status | ❌ StatusChip uses traffic-light defaults | Map: `verdigris` (paid), `warning` (burn/acid), `circuit` (verified) |
| Fade-slide on every card | ❌ globals.css has entrance animations on everything | Remove default animations; keep only handover code generation |
| "Welcome back" generic copy | ❌ CollectorHomePage | Replace with "Create Lot" as primary action |
| Hinglish as primary | ❌ Full mr/hi/en with i18next | Keep full translations, proper fonts |
| ₹ in every cell without tabular figures | ❌ PriceBoard, earnings | JetBrains Mono + tabular-nums, ₹ once per row |

---

## Migration Order (per incremental-redesign.md)

1. **Token system** — Create `src/styles/tokens.css` with all tokens above; update `globals.css` to import it before `@import "tailwindcss"`
2. **Font faces** — Add `@font-face` rules with `unicode-range` for Ek Mukta / IBM Plex Sans / JetBrains Mono (from template)
3. **Shared primitives** — Replace one at a time: Button → Card → StatPill → TrustBadge → CodeDisplay → LanguageTab → CategoryIcon (SVG) → StatusChip (semantic colors)
4. **Layout components** — `CollectorLayout` (header only on home, copper accent), `RecyclerLayout` (shell + tabs)
5. **Entry pages** — `LanguageSelect`, `ModeSelect`, `AuthPage` (visual only)
6. **Core collector pages** — `CollectorHomePage`, `Safety`, `CreateLotPhoto`, `PriceBoard`, `MyLots`, `Earnings`
7. **Recycler pages** — `RecyclerDashboard`, `RecyclerRates`, `RecyclerTransactions`, `RecyclerProfile`
8. **Remaining flows** — `CreateLotCategory`, `CreateLotWeight`, `CreateLotEstimate`, `RecyclerList`, `RecyclerQuote`, `Handover`, `Profile`, `LotDetail`

---

## Verification Checklist Per Page

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint` — only pre-existing warnings)
- [ ] Dark mode works (manual check)
- [ ] Language switch works (mr/hi/en) — weight changes, no layout shift
- [ ] Reduced motion respected
- [ ] Focus visible rings correct (copper for collector, circuit for recycler)
- [ ] No emoji icons remain
- [ ] No gradient backgrounds on content pages
- [ ] Monospace used for codes/weights/rates
- [ ] Devanagari headlines use Ek Mukta, body uses IBM Plex Sans
- [ ] Line lengths ≤ 70ch (Latin) / ≤ 45ch (Devanagari)
- [ ] Tabular figures align in columns