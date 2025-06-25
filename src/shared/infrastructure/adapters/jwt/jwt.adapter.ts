// src/shared/infrastructure/adapters/jwt/jwt.adapter.ts
import jwt from 'jsonwebtoken';
import { config } from '../../../config/environment';
import { JwtPayload, TokenResult } from './jwt.types';

export class JwtAdapter {
  private static readonly SECRET = config.JWT_SECRET;
  private static readonly EXPIRES_IN = config.JWT_EXPIRES_IN;

  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    // Solución definitiva: usar assertion de tipo específica
    return jwt.sign(
      payload, 
      this.SECRET, 
      { 
        expiresIn: this.EXPIRES_IN as jwt.SignOptions['expiresIn']
      }
    );
  }

  static generateTokenWithExpiry(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenResult {
    const token = this.generateToken(payload);
    return {
      token,
      expiresIn: this.EXPIRES_IN
    };
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw new Error('TOKEN_ERROR');
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token);
      return decoded as JwtPayload;
    } catch {
      return null;
    }
  }
}