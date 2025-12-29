// ==========================
// IRR / TIR helpers
// ==========================

/**
 * Calcula o NPV (Valor Presente Líquido) de uma série de fluxos de caixa
 * para uma taxa de retorno periódica.
 *
 * Observação: assumimos períodos igualmente espaçados (mensais neste projeto)
 * e consideramos o primeiro fluxo no período 1 (mês 1), não no tempo 0.
 *
 * Retorna NaN se ocorrer overflow numérico.
 */
export function npv(rate: number, cashflows: number[]): number {
  let total = 0;
  for (let i = 0; i < cashflows.length; i++) {
    const t = i + 1;
    const discountFactor = Math.pow(1 + rate, t);
    // Se o fator de desconto for 0, Infinity, ou NaN, retornamos NaN
    if (!Number.isFinite(discountFactor) || discountFactor === 0) {
      return NaN;
    }
    total += cashflows[i] / discountFactor;
    // Verificar overflow acumulado
    if (!Number.isFinite(total)) {
      return NaN;
    }
  }
  return total;
}

/**
 * Calcula a TIR (IRR) periódica de uma série de fluxos de caixa.
 *
 * - Retorna a taxa por período (no nosso caso, ao mês), como número decimal
 *   (ex: 0.01 = 1% ao mês).
 * - Retorna null se não houver mudança de sinal (todos fluxos positivos ou todos negativos)
 *   ou se não for possível encontrar uma raiz no intervalo pesquisado.
 *
 * Implementação: método da bisseção em um intervalo de taxas razoável.
 */
export function calculateIrr(cashflows: number[]): number | null {
  if (!cashflows.length) return null;

  const minCf = Math.min(...cashflows);
  const maxCf = Math.max(...cashflows);

  // Escala típica dos fluxos (usada para definir tolerância relativa)
  const maxAbsCf = Math.max(...cashflows.map((cf) => Math.abs(cf)));
  if (!Number.isFinite(maxAbsCf) || maxAbsCf === 0) {
    return null;
  }

  // Precisa ter pelo menos um fluxo negativo e um positivo
  if (!(minCf < 0 && maxCf > 0)) {
    return null;
  }

  // Para cenários de longa duração, começamos com um limite inferior menos extremo
  // para evitar overflow numérico em Math.pow(1+rate, n) com n grande.
  // Usamos -0.5 como ponto de partida e expandimos se necessário.
  let low = -0.5;
  let high = 1.0;

  // Tolerância relativa ao tamanho típico dos fluxos de caixa
  const tolerance = 1e-7 * maxAbsCf;

  // Função auxiliar para verificar se o NPV é válido (finito)
  const isValidNpv = (val: number) => Number.isFinite(val);

  // Primeiro, encontramos um bracket válido [low, high] onde NPV muda de sinal
  let npvLow = npv(low, cashflows);
  let npvHigh = npv(high, cashflows);

  // Se npvLow não é válido, tentamos mover low para direita até ficar válido
  if (!isValidNpv(npvLow)) {
    // Procurar um low válido entre -0.5 e 0
    for (let testLow = -0.4; testLow < 0; testLow += 0.1) {
      npvLow = npv(testLow, cashflows);
      if (isValidNpv(npvLow)) {
        low = testLow;
        break;
      }
    }
    // Se ainda não é válido, começamos de 0
    if (!isValidNpv(npvLow)) {
      low = 0;
      npvLow = npv(low, cashflows);
    }
  }

  // Se npvHigh não é válido, ajustamos
  if (!isValidNpv(npvHigh)) {
    high = 0.5;
    npvHigh = npv(high, cashflows);
  }

  // Agora tentamos encontrar um bracket com mudança de sinal
  // Primeiro, expandimos para baixo (taxas mais negativas) se necessário
  if (isValidNpv(npvLow) && isValidNpv(npvHigh) && npvLow * npvHigh > 0) {
    // Se ambos NPVs têm mesmo sinal, tentamos expandir o intervalo
    // Primeiro, tentamos expandir para baixo (para encontrar TIRs negativas)
    let testLow = low - 0.1;
    while (testLow > -0.99 && npvLow * npvHigh > 0) {
      const testNpv = npv(testLow, cashflows);
      if (isValidNpv(testNpv)) {
        if (testNpv * npvHigh < 0) {
          // Encontramos mudança de sinal!
          low = testLow;
          npvLow = testNpv;
          break;
        }
        // Mesmo sinal, continue expandindo
        low = testLow;
        npvLow = testNpv;
      }
      testLow -= 0.1;
    }
  }

  // Se ainda não há mudança de sinal, tentamos expandir para cima
  if (isValidNpv(npvLow) && isValidNpv(npvHigh) && npvLow * npvHigh > 0) {
    const maxHigh = 5.0;
    while (high < maxHigh && npvLow * npvHigh > 0) {
      high *= 1.5;
      npvHigh = npv(high, cashflows);
      if (!isValidNpv(npvHigh)) break;
    }
  }

  // Se ainda não encontramos mudança de sinal ou valores inválidos, desistimos
  if (!isValidNpv(npvLow) || !isValidNpv(npvHigh) || npvLow * npvHigh > 0) {
    return null;
  }

  const maxIterations = 300;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid, cashflows);

    // Se NPV no meio não é válido, tentamos aproximar de outro lado
    if (!isValidNpv(npvMid)) {
      // Se o mid está muito perto de um limite problemático,
      // movemos o limite problemático para mid
      if (!isValidNpv(npv(low, cashflows))) {
        low = mid;
        continue;
      }
      high = mid;
      continue;
    }

    if (Math.abs(npvMid) < tolerance) {
      return mid;
    }

    // Decide em qual subintervalo está a raiz
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }

    // Verificar convergência pelo tamanho do intervalo
    if (Math.abs(high - low) < 1e-10) {
      return mid;
    }
  }

  // Se não convergiu com a precisão desejada, verificamos se o resultado é aceitável
  const mid = (low + high) / 2;
  const npvMid = npv(mid, cashflows);
  if (isValidNpv(npvMid) && Math.abs(npvMid) < tolerance * 10) {
    return mid;
  }

  // Última tentativa: retornar o meio se o intervalo ficou pequeno o suficiente
  if (Math.abs(high - low) < 1e-6) {
    return mid;
  }

  return null;
}
