export type TokenPayload = Record<string, unknown>;

export const ITokenService = Symbol('ITokenService');

export interface ITokenService {
  sign(
    payload: TokenPayload,
    options?: { expiresIn?: string | number },
  ): Promise<string>;
}
