/**
 * Utilidad para parsear y validar horarios específicos
 */
export class HorarioUtil {
    /**
     * Parsea un horario específico a un objeto Date válido
     * @param horario - String de horario en formato HH:MM, HH:MM:SS o Date
     * @returns Date válido o null si el formato es inválido
     */
    static parseHorarioEspecifico(horario: string | Date | null | undefined): Date | null {
      if (!horario) return null;
      
      // Si ya es una fecha válida, validar que sea válida
      if (horario instanceof Date) {
        return !isNaN(horario.getTime()) ? horario : null;
      }
      
      // Convertir a string para el procesamiento
      const horarioStr = horario.toString().trim();
      
      // Intentar parsear diferentes formatos de hora
      const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      const match = horarioStr.match(timeRegex);
      
      if (match) {
        const [, hours, minutes, seconds = '00'] = match;
        const parsedHours = parseInt(hours, 10);
        const parsedMinutes = parseInt(minutes, 10);
        const parsedSeconds = parseInt(seconds, 10);
        
        // Validar rangos de tiempo
        if (parsedHours >= 0 && parsedHours <= 23 && 
            parsedMinutes >= 0 && parsedMinutes <= 59 && 
            parsedSeconds >= 0 && parsedSeconds <= 59) {
          
          // Crear fecha base en 1970-01-01 UTC
          const date = new Date('1970-01-01T00:00:00.000Z');
          date.setUTCHours(parsedHours, parsedMinutes, parsedSeconds, 0);
          return date;
        }
      }
      
      // Intentar parsear como fecha ISO completa
      try {
        const parsed = new Date(horarioStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (error) {
        // Ignorar errores de parsing
      }
      
      // Si no es un formato válido, log warning y retornar null
      console.warn(`Formato de horario inválido: "${horarioStr}"`);
      return null;
    }
  
    /**
     * Valida si un string es un horario válido
     * @param horario - String a validar
     * @returns boolean indicando si es válido
     */
    static isValidHorario(horario: string | null | undefined): boolean {
      return this.parseHorarioEspecifico(horario) !== null;
    }
  
    /**
     * Convierte un Date a string de horario HH:MM
     * @param date - Date a convertir
     * @returns String en formato HH:MM o null si es inválido
     */
    static dateToHorarioString(date: Date | null): string | null {
      if (!date || isNaN(date.getTime())) return null;
      
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }