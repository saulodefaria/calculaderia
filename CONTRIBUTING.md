# 🤝 Contributing Guide

Thank you for your interest in contributing to **Calculaderia**! This document provides guidelines for effective contributions.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How to Contribute](#-how-to-contribute)
- [Environment Setup](#-environment-setup)
- [Code Standards](#-code-standards)
- [Commits and Pull Requests](#-commits-and-pull-requests)
- [Tests](#-tests)
- [Project Structure](#-project-structure)

---

## 📜 Code of Conduct

All contributors are expected to:

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards other members

---

## 🚀 How to Contribute

### 1. Reporting Bugs

When reporting a bug, include:

- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

### 2. Suggesting Enhancements

When suggesting improvements:

- Describe the desired feature
- Explain why it would be useful
- Provide usage examples
- Consider impacts on other parts of the code

### 3. Contributing Code

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature/fix
4. **Develop** following project standards
5. **Test** your changes
6. **Commit** your changes
7. **Push** to your fork
8. **Open a Pull Request**

---

## 🛠️ Environment Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (recommended via Corepack)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/calculaderia.git
cd calculaderia

# Enable Corepack (recommended) to use the pinned pnpm version from package.json
corepack enable
corepack install

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Verification

```bash
# Run tests
pnpm test

# Run linter
pnpm lint

# Run build
pnpm build
```

---

## 📝 Code Standards

### TypeScript

- Use strict typing whenever possible
- Define interfaces for complex objects
- Avoid `any` — prefer `unknown` when necessary
- Use TypeScript utility types (`Partial`, `Pick`, `Omit`, etc.)

```typescript
// ✅ Good
interface InputsFinanciamento {
  valorEmprestimo: number;
  valorEntrada: number;
  taxaJurosAnual: number;
  meses: number;
}

function calcularFinanciamento(inputs: InputsFinanciamento): ResultadoFinanciamento {
  // ...
}

// ❌ Avoid
function calcularFinanciamento(inputs: any) {
  // ...
}
```

### React / Next.js

- Use functional components with hooks
- Prefer Server Components when possible
- Use `'use client'` only when necessary
- Keep components small and focused

```tsx
// ✅ Good
export function CalculatorCard({ calculator }: { calculator: CalculatorDefinition }) {
  return (
    <Card>
      <CardHeader>
        <calculator.icon className="h-6 w-6" />
        <CardTitle>{calculator.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{calculator.description}</p>
      </CardContent>
    </Card>
  );
}
```

### CSS / Tailwind

- Use Tailwind classes for styling
- Maintain consistency with the existing design system
- Use CSS variables for themes (dark/light mode)
- Avoid inline styles when possible

```tsx
// ✅ Good
<div className="flex items-center gap-4 rounded-lg bg-card p-4">

// ❌ Avoid
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
```

### Naming Conventions

| Type            | Convention           | Example                 |
| --------------- | -------------------- | ----------------------- |
| Components      | PascalCase           | `CalculatorForm`        |
| Functions       | camelCase            | `calcularFinanciamento` |
| Constants       | SCREAMING_SNAKE_CASE | `MAX_MESES`             |
| Component files | kebab-case           | `calculator-form.tsx`   |
| Variables       | camelCase            | `valorEntrada`          |
| Interfaces      | PascalCase           | `InputsFinanciamento`   |

### Language in Code

- **Variables and functions**: Portuguese (Brazilian financial context)
- **Comments**: English or Portuguese
- **Documentation**: English

---

## 📦 Commits and Pull Requests

### Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation changes       |
| `style`    | Formatting (no code change) |
| `refactor` | Code refactoring            |
| `test`     | Adding/fixing tests         |
| `chore`    | Maintenance tasks           |

#### Examples

```bash
feat(consorcio): add support for multiple bids

fix(financiamento): fix amortization calculation on last month

docs(readme): update installation instructions

test(tir): add tests for negative cash flows
```

### Pull Request Guidelines

When opening a PR:

1. **Descriptive title** following commit format
2. **Description** of what was changed and why
3. **Screenshots** for visual changes
4. **Checklist**:
   - [ ] Code follows project standards
   - [ ] Tests passing (`pnpm test`)
   - [ ] Lint passing (`pnpm lint`)
   - [ ] Build working (`pnpm build`)
   - [ ] Documentation updated (if needed)

---

## 🧪 Tests

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test -- --watch

# With coverage
pnpm test -- --coverage
```

### Writing Tests

- Use Vitest for unit tests
- Place tests alongside source files (`.test.ts`)
- Test edge cases and error scenarios
- Keep tests isolated and independent

```typescript
// lib/calculators/financiamento.test.ts
import { describe, it, expect } from "vitest";
import { calcularSAC, calcularPRICE } from "./financiamento";

describe("calcularSAC", () => {
  it("should correctly calculate SAC installments", () => {
    const inputs = {
      valorEmprestimo: 100000,
      valorEntrada: 20000,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(80000);
    expect(resultado.parcelas).toHaveLength(12);
    // SAC installments should be decreasing
    expect(resultado.primeiraPrestacao).toBeGreaterThan(resultado.ultimaPrestacao);
  });

  it("should handle down payment equal to loan value", () => {
    const inputs = {
      valorEmprestimo: 100000,
      valorEntrada: 100000,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(0);
    expect(resultado.totalJurosPagos).toBe(0);
  });
});
```

### Coverage

We aim for high test coverage in calculation functions (`lib/calculators/`). When adding new features, include corresponding tests.

---

## 📂 Project Structure

### Adding a New Calculator

1. **Create calculation logic** in `lib/calculators/`

```typescript
// lib/calculators/new-calculator.ts
export interface InputsNewCalculator {
  // ...
}

export interface ResultadoNewCalculator {
  // ...
}

export function calcularNewCalculator(inputs: InputsNewCalculator): ResultadoNewCalculator {
  // ...
}
```

2. **Add tests** in `lib/calculators/new-calculator.test.ts`

3. **Create URL state management** in `lib/url-state/` (optional)

4. **Create components** in `components/calculators/new-calculator/`

```
components/calculators/new-calculator/
├── calculator-form.tsx    # Input form
├── results-summary.tsx    # Results summary
└── results-table.tsx      # Detailed table (if applicable)
```

5. **Create the page** in `app/calculadoras/new-calculator/`

```
app/calculadoras/new-calculator/
├── layout.tsx
└── page.tsx
```

6. **Register the calculator** in `lib/constants.ts`

```typescript
export const calculators: CalculatorDefinition[] = [
  // ... existing calculators
  {
    id: "new-calculator",
    title: "New Calculator",
    description: "Description of the new calculator",
    href: "/calculadoras/new-calculator",
    icon: Calculator,
    available: true,
  },
];
```

### Modifying UI Components

Reusable UI components are in `components/ui/`. They follow the [shadcn/ui](https://ui.shadcn.com/) pattern:

- Headless components using Radix UI
- Styling with Tailwind CSS
- Variants using `class-variance-authority`

---

## 💡 Tips

### Performance

- Use `useMemo` and `useCallback` to avoid unnecessary re-renders
- Prefer Server Components for static data
- Avoid heavy calculations in render — use effects or actions

### Accessibility

- Use semantic elements (`<main>`, `<section>`, `<nav>`)
- Include `aria-label` when necessary
- Maintain adequate color contrast
- Support keyboard navigation

### Debugging

```bash
# Check types
pnpm exec tsc --noEmit

# Check lint
pnpm lint

# Detailed logs in development
DEBUG=* pnpm dev
```

---

## ❓ Questions

If you have questions about contributing:

1. Check existing documentation
2. Look for similar issues
3. Open a new issue with the `question` tag

---

<div align="center">

**Thank you for contributing!** 🎉

</div>
