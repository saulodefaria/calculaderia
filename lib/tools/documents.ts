export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function validateCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);

  const firstSum = numbers.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0);
  const firstCheck = firstSum % 11 < 2 ? 0 : 11 - (firstSum % 11);

  if (numbers[9] !== firstCheck) {
    return false;
  }

  const secondSum = numbers.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0);
  const secondCheck = secondSum % 11 < 2 ? 0 : 11 - (secondSum % 11);

  return numbers[10] === secondCheck;
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function validateCnpj(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];

  const firstSum = firstWeights.reduce((sum, weight, index) => sum + numbers[index] * weight, 0);
  const firstRemainder = firstSum % 11;
  const firstCheck = firstRemainder < 2 ? 0 : 11 - firstRemainder;

  if (numbers[12] !== firstCheck) {
    return false;
  }

  const secondSum = secondWeights.reduce((sum, weight, index) => sum + numbers[index] * weight, 0);
  const secondRemainder = secondSum % 11;
  const secondCheck = secondRemainder < 2 ? 0 : 11 - secondRemainder;

  return numbers[13] === secondCheck;
}
