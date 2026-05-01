# 🧮 Calculaderia

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Free financial calculation tools for the Brazilian market: loan, consortium, rent vs buy, and more.**

</div>

---

## 📖 About

**Calculaderia** is a modern web application providing financial calculation tools focused on the Brazilian market. It helps users make informed decisions about real estate acquisition, investments, and loan comparisons.

## 🎯 Available Calculators

| Calculator                                 | Description                                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **📊 Financiamento** (Loan)                | Calculate loan installments using SAC or PRICE amortization systems. View the complete amortization schedule with property appreciation projection.                                                     |
| **👥 Consórcio** (Consortium)              | Simulate consortium installments with annual INCC/IPCA correction. A _consórcio_ is a Brazilian cooperative savings system where participants pool money to purchase assets through lottery or bidding. |
| **⚖️ Financiamento vs Consórcio**          | Compare traditional loan against consortium side by side. See which option leaves more money in your pocket.                                                                                            |
| **🏠 Alugar vs Comprar** (Rent vs Buy)     | Compare whether it's better to buy a financed property or rent and invest the difference.                                                                                                               |
| **📈 TIR** (IRR - Internal Rate of Return) | Calculate the Internal Rate of Return of a series of cash flows.                                                                                                                                        |
| **💰 Juros Compostos** (Compound Interest) | Calculate the yield of your investments with compound interest over time.                                                                                                                               |
| **💵 Renda Fixa** (Fixed Income)           | Compare fixed income investments (Pre, CDI, IPCA+, Selic) net of income tax (IR), financial transaction tax (IOF), and inflation.                                                                       |

## 🚀 Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[next-intl](https://next-intl-docs.vercel.app/)** - Internationalization (i18n)
- **[Auth.js / NextAuth](https://authjs.dev/)** - Google sign-in for saved favorites
- **[Prisma](https://www.prisma.io/)** + **PostgreSQL** - Account and favorites persistence
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components
- **[Recharts](https://recharts.org/)** - Charts for React
- **[Vitest](https://vitest.dev/)** - Testing framework

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/calculaderia.git

# Enter the directory
cd calculaderia

# Enable Corepack (recommended) to use the pinned pnpm version from package.json
corepack enable
corepack install

# Install dependencies
pnpm install
```

## 🛠️ Available Commands

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `pnpm dev`             | Start development server at `http://localhost:3000` |
| `pnpm build`           | Generate production build                           |
| `pnpm start`           | Start production server                             |
| `pnpm lint`            | Run ESLint                                          |
| `pnpm test`            | Run tests with Vitest                               |
| `pnpm run test:e2e`    | Run calculator browser tests with Playwright        |
| `pnpm run test:e2e:ui` | Open the Playwright test UI                         |

## 🏃 Getting Started

```bash
# Development mode
pnpm dev

# Open http://localhost:3000 in your browser
```

Saved favorites require Postgres and Google OAuth. Copy `.env.example` to `.env`, set
`POSTGRES_PORT` to an available local port, and keep `DATABASE_URL` using that same port.
Then start Postgres and run the Prisma setup:

```bash
docker compose up -d postgres
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

Also set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` before testing Google sign-in.

## 🏗️ Project Structure

```
calculaderia/
├── app/
│   ├── [locale]/                 # Internationalized routes
│   │   ├── apoiar/               # Support page
│   │   ├── calculadoras/         # Calculator routes
│   │   │   ├── alugar-vs-comprar/
│   │   │   ├── comparativo/
│   │   │   ├── consorcio/
│   │   │   ├── financiamento/
│   │   │   ├── juros-compostos/
│   │   │   ├── renda-fixa/
│   │   │   └── tir/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── robots.ts                 # SEO: Robots.txt
│   └── sitemap.ts                # SEO: Sitemap generation
├── components/
│   ├── calculators/              # Calculator components
│   ├── layout/                   # Header, Footer
│   └── ui/                       # Reusable UI components
├── i18n/
│   ├── navigation.ts             # i18n navigation helpers
│   ├── request.ts                # i18n request configuration
│   └── routing.ts                # i18n routing configuration
├── lib/
│   ├── calculators/              # Calculation logic & tests
│   ├── url-state/                # URL state management
│   └── utils/                    # Utilities
├── messages/
│   ├── en.json                   # English translations
│   ├── es.json                   # Spanish translations
│   └── pt-br.json                # Portuguese translations
└── public/
```

## 🌍 Internationalization (i18n)

The application supports multiple languages using **next-intl**:

- **Supported Languages:**

  - 🇧🇷 **Portuguese (pt-BR)** - Default language (unprefixed URLs)
  - 🇺🇸 **English (en)** - Available with `/en` prefix
  - 🇪🇸 **Spanish (es)** - Available with `/es` prefix

- **URL Structure:**

  - Portuguese (default): `/calculadoras/financiamento`
  - English: `/en/calculadoras/financiamento`
  - Spanish: `/es/calculadoras/financiamento`

- **Features:**
  - Automatic locale detection disabled (explicit selection required)
  - Language switcher in navigation menu
  - Locale-specific metadata and SEO tags
  - Translation files in `messages/` directory

## 🔍 SEO Features

The application is optimized for search engines:

- **Dynamic Sitemap** (`sitemap.ts`)

  - Auto-generates sitemap for all pages and locales
  - Includes priority and change frequency
  - Updates last modified dates automatically

- **Robots.txt** (`robots.ts`)

  - Allows all crawlers
  - References sitemap location

- **Meta Tags** (per page)

  - Title and description tags
  - Open Graph tags (Facebook, LinkedIn)
  - Twitter Card tags
  - Canonical URLs
  - `hreflang` tags for alternate languages

- **Semantic HTML**
  - Proper heading hierarchy
  - Accessible markup with ARIA labels
  - Lang attribute on `<html>` element

## 📈 Analytics (GA4)

The project supports **Google Analytics 4** via `gtag.js`, loaded using Next.js `next/script` in `app/layout.tsx`.

- **Enable GA4**: set `NEXT_PUBLIC_GA4_MEASUREMENT_ID` in your `.env.local` (see `.env.example`).
- **Best practice**: keep it unset in development if you don't want test traffic.
- **SPA tracking**: client-side navigations (App Router) trigger additional `page_view` tracking automatically.

## ✨ Features

- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌍 **Multilingual** - Available in Portuguese, English, and Spanish
- 🔗 **Shareable URLs** - Share calculations via URL with preserved state
- 📊 **Interactive Charts** - Visualize investment evolution over time
- 📋 **Detailed Tables** - View each installment/period in detail
- 🔍 **SEO Optimized** - Sitemap, meta tags, and Open Graph support
- 🧪 **Tested** - Unit tests for calculation functions

---

## 📚 Glossary of Brazilian Financial Terms

This glossary explains the Portuguese financial terms used throughout the application.

### General Terms

| Portuguese        | English             | Description                                                                                                                                                                                            |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Financiamento** | Loan / Mortgage     | A loan for purchasing an asset (usually real estate), paid in monthly installments over time.                                                                                                          |
| **Consórcio**     | Consortium          | A Brazilian cooperative system where participants contribute monthly to a common fund. Members are awarded credit letters (by lottery or bid) to purchase assets—no interest, but includes admin fees. |
| **Parcela**       | Installment         | Monthly payment of a loan or consortium.                                                                                                                                                               |
| **Prestação**     | Payment             | Synonym for installment; the amount paid monthly.                                                                                                                                                      |
| **Prazo**         | Term                | Total duration in months.                                                                                                                                                                              |
| **Juros**         | Interest            | Cost of borrowed money, expressed as a percentage.                                                                                                                                                     |
| **Taxa de Juros** | Interest Rate       | Percentage applied to the outstanding balance.                                                                                                                                                         |
| **Amortização**   | Amortization        | Portion of the installment that reduces the principal (outstanding balance).                                                                                                                           |
| **Saldo Devedor** | Outstanding Balance | Amount still owed to the creditor.                                                                                                                                                                     |
| **Entrada**       | Down Payment        | Initial payment when purchasing an asset.                                                                                                                                                              |

### Amortization Systems

| System    | Description                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SAC**   | _Sistema de Amortização Constante_ (Constant Amortization System) — Amortization is constant, interest decreases, resulting in decreasing installments over time. |
| **PRICE** | _Tabela Price / Sistema Francês_ (French System) — Installments are constant; amortization grows and interest decreases over time.                                |

### Consortium-Specific Terms

| Portuguese                | English            | Description                                                                             |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| **Carta de Crédito**      | Credit Letter      | Document allowing the consortium member to purchase the asset when awarded.             |
| **Contemplação**          | Award / Winning    | The moment when a member receives the credit letter (by lottery or bid).                |
| **Lance**                 | Bid                | Early payment offer to increase chances of being awarded sooner.                        |
| **Ágio**                  | Premium            | Additional amount paid to acquire an already-awarded credit letter from another member. |
| **Fundo Comum**           | Common Fund        | Pool of contributions from all members, used to award credit letters.                   |
| **Taxa de Administração** | Administration Fee | Percentage charged by the consortium administrator (spread across all installments).    |

### Brazilian Economic Indices

| Index     | Full Name                              | Usage                                                                                  |
| --------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| **INCC**  | Índice Nacional de Custo da Construção | National Civil Construction Cost Index — used to adjust real estate consortium values. |
| **IPCA**  | Índice de Preços ao Consumidor Amplo   | Brazil's official inflation index.                                                     |
| **IGP-M** | Índice Geral de Preços do Mercado      | General Market Price Index — traditionally used for rent adjustments.                  |

### Rental Terms

| Portuguese         | English           | Description                                                |
| ------------------ | ----------------- | ---------------------------------------------------------- |
| **Aluguel**        | Rent              | Monthly payment to use someone else's property.            |
| **Correção Anual** | Annual Adjustment | Yearly adjustment to rent value, typically based on IGP-M. |

### Investment Terms

| Portuguese          | English                       | Description                                                                 |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| **Juros Compostos** | Compound Interest             | Interest calculated on principal plus accumulated interest.                 |
| **TIR**             | IRR (Internal Rate of Return) | Discount rate that makes the net present value of cash flows equal to zero. |
| **Fluxo de Caixa**  | Cash Flow                     | Money movement (inflows and outflows) over a period.                        |
| **Aporte**          | Contribution / Deposit        | Amount periodically added to an investment.                                 |
| **Rendimento**      | Yield / Return                | Gain obtained from an investment.                                           |
| **Patrimônio**      | Net Worth / Equity            | Total value of assets minus debts.                                          |
| **Valorização**     | Appreciation                  | Increase in asset value over time.                                          |

### Common Abbreviations

| Abbreviation | Meaning      | English      |
| ------------ | ------------ | ------------ |
| **a.m.**     | ao mês       | per month    |
| **a.a.**     | ao ano       | per year     |
| **a.t.**     | ao trimestre | per quarter  |
| **a.s.**     | ao semestre  | per semester |

---

## 📄 License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

Made with ❤️ to help people make better financial decisions.

</div>
