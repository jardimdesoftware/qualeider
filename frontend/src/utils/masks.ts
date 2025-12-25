/**
 * (000.000.000-00)
 */
export function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.substring(0, 11);
  
  return limited
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * (00.000.000/0000-00)
 */
export function maskCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.substring(0, 14);
  
  return limited
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/**
 * (00000-000)
 */
export function maskCEP(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.substring(0, 8);
  
  if (limited.length <= 5) {
    return limited;
  }
  return `${limited.slice(0, 5)}-${limited.slice(5, 8)}`;
}

export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const limited = cleaned.substring(0, 11);
  
  if (limited.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return limited
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    // Celular: (00) 00000-0000
    return limited
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
}

export function cleanDocument(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPFFormat(cpf: string): boolean {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

export function isValidCNPJFormat(cnpj: string): boolean {
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
}

export function isValidCEPFormat(cep: string): boolean {
  return /^\d{5}-\d{3}$/.test(cep);
}

export function isValidPhoneFormat(phone: string): boolean {
  return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone);
}
