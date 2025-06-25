import bcrypt from 'bcryptjs';

export class BcryptAdapter {
  private static readonly SALT_ROUNDS = 12;

  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.SALT_ROUNDS);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }

  static async generateSalt(rounds: number = this.SALT_ROUNDS): Promise<string> {
    return bcrypt.genSalt(rounds);
  }
}
