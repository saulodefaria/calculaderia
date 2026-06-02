import { expect, test } from "@playwright/test";
import { expectResults } from "./helpers/calculator";

const restoredCalculations = [
  {
    name: "financiamento",
    path: "/calculadoras/financiamento?ve=300000&vn=60000&tj=10&m=240&ci=6&mt=sac",
    heading: "Calculadora de Financiamento",
    results: ["Resumo do Financiamento", "Tabela de Amortização"],
  },
  {
    name: "consorcio",
    path: "/calculadoras/consorcio?vb=300000&m=180&ta=15&ca=6&ct=6&am=2000&ig=6",
    heading: "Calculadora de Consórcio",
    results: ["Resumo do Consórcio", "Tabela de Parcelas"],
  },
  {
    name: "comparativo",
    path: "/calculadoras/comparativo?vi=300000&ve=60000&tj=10&mf=240&mt=sac&ci=6&mc=180&ta=15&cc=6&tr=10&am=2000&ig=6",
    heading: "Financiamento vs Consórcio",
    results: ["Detalhes da simulação", "Evolução Mensal"],
  },
  {
    name: "alugar vs comprar",
    path: "/calculadoras/alugar-vs-comprar?vi=500000&ve=100000&tj=10&m=240&mt=sac&ci=5&am=2500&caa=6&tr=10",
    heading: "Alugar vs Comprar",
    results: ["Detalhes da Comparação", "Evolução Mensal"],
  },
  {
    name: "tir",
    path: "/calculadoras/tir?cf=-100000,25000,30000,40000,50000&p=m",
    heading: "Calculadora de TIR",
    results: ["Taxa Interna de Retorno (TIR)", "Resumo dos Fluxos"],
  },
  {
    name: "juros compostos",
    path: "/calculadoras/juros-compostos?vi=10000&tj=1&p=m&ap=500&qp=24",
    heading: "Juros Compostos",
    results: ["Resumo do Investimento", "Evolução do Investimento"],
  },
  {
    name: "renda fixa",
    path: "/calculadoras/renda-fixa?v=10000&d=730&pr=11&cp=100&ia=6&sa=10.5&cdi=10.5&ipca=4&fee=0.2",
    heading: "Comparador de Renda Fixa",
    results: ["Comparação Detalhada", "Evolução ao Longo do Tempo"],
  },
  {
    name: "rescisao trabalhista",
    path: "/calculadoras/rescisao-trabalhista?s=3000&ad=2025-01-15&dd=2026-01-20&mt=sjc&av=ind&dt=20&fv=0&fg=4000&dl=0",
    heading: "Calculadora de Rescisão Trabalhista",
    results: ["Resumo da rescisão", "Verbas rescisórias detalhadas"],
  },
];

test.describe("calculator shared state", () => {
  for (const calculation of restoredCalculations) {
    test(`restores ${calculation.name} results from query params`, async ({ page }) => {
      await page.goto(calculation.path);

      await expect(page.getByRole("heading", { name: calculation.heading }).first()).toBeVisible();
      await expectResults(page, calculation.results);
    });
  }
});
