import crypto from "crypto";

/**
 * Gera um token aleatório seguro para verificação de email ou reset de senha
 * @returns Token aleatório de 32 caracteres hexadecimais
 */
export function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Calcula a data de expiração do token
 * @param minutes Número de minutos até expirar
 * @returns Data de expiração
 */
export function generateExpiration(minutes: number): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
}

/**
 * Verifica se um token expirou
 * @param expiresAt Data de expiração
 * @returns true se expirou, false caso contrário
 */
export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) {
    return true;
  }
  return new Date() > new Date(expiresAt);
}

/**
 * Gera token de verificação de email com expiração de 15 minutos
 */
export function generateEmailVerificationToken(): { token: string; expiresAt: Date } {
  return {
    token: generateToken(),
    expiresAt: generateExpiration(15),
  };
}

/**
 * Gera token de reset de senha com expiração de 1 hora
 */
export function generatePasswordResetToken(): { token: string; expiresAt: Date } {
  return {
    token: generateToken(),
    expiresAt: generateExpiration(60),
  };
}
