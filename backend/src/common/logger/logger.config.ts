import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { SENSITIVE_KEYS } from './sensitive-keys';

/**
 * Percorre recursivamente um objeto ou array para ofuscar dados sensíveis.
 * * @param data - O objeto de log, mensagem ou metadados.
 * @returns Uma cópia do objeto com campos sensíveis (ex: password, token) substituídos por '***[REDACTED]***'.
 * @see SENSITIVE_KEYS para a lista de campos bloqueados.
     */
export const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeData(item));
    }

    const sanitized = { ...data };
    for (const key in sanitized) {
      if (SENSITIVE_KEYS.includes(key)) {
        sanitized[key] = '***[REDACTED]***'; 
      } else {
        sanitized[key] = sanitizeData(sanitized[key]); // Recursão
      }
    }
    return sanitized;
  }

  return data;
};

const sanitizerFormat = winston.format((info) => {
  // O 'info' contém o nível do log, a mensagem e os metadados (contexto)
  
  if (typeof info.message === 'object') {
    info.message = sanitizeData(info.message);
  }

  const args = info[Symbol.for('splat')];
  if (args) {
    info[Symbol.for('splat')] = sanitizeData(args);
  }

  Object.keys(info).forEach((key) => {
    if (key !== 'level' && key !== 'message' && key !== 'timestamp') {
      info[key] = sanitizeData(info[key]);
    }
  });

  return info;
});

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        sanitizerFormat(),
        nestWinstonModuleUtilities.format.nestLike('QualeiDer', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
  ],
};