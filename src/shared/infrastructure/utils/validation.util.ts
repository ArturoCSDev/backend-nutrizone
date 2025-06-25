export class ValidationUtil {
    static isEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    static isStrongPassword(password: string): boolean {
      // Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(password);
    }
  
    static isDNI(dni: string): boolean {
      // DNI peruano: 8 dígitos
      const dniRegex = /^\d{8}$/;
      return dniRegex.test(dni);
    }
  
    static isPhoneNumber(phone: string): boolean {
      // Teléfono peruano: 9 dígitos empezando por 9
      const phoneRegex = /^9\d{8}$/;
      return phoneRegex.test(phone);
    }
  
    static sanitizeString(str: string): string {
      return str.trim().replace(/\s+/g, ' ');
    }
  
    static isValidAge(age: number): boolean {
      return age >= 16 && age <= 100;
    }
  
    static isValidWeight(weight: number): boolean {
      return weight >= 30 && weight <= 300; // kg
    }
  
    static isValidHeight(height: number): boolean {
      return height >= 100 && height <= 250; // cm
    }
  }
  