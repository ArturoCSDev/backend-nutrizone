export interface JwtPayload {
  userId: string;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

export interface TokenResult {
  token: string;
  expiresIn: string;
}