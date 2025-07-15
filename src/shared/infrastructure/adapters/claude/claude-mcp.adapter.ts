import { ClaudeAdapter } from './claude.adapter';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface MCPClaudeInput {
  clienteId: string;
  contexto?: string;
  objetivoEspecifico?: string;
  momentoDelDia?: string;
  soloFavoritos?: boolean;
  precioMaximo?: number;
}

export class ClaudeMCPAdapter extends ClaudeAdapter {
  private mcpProcess: ChildProcess | null = null;

  static async generateRecommendationWithMCP(input: MCPClaudeInput) {
    const adapter = new ClaudeMCPAdapter();
    
    try {
      // Iniciar MCP Server
      await adapter.startMCPServer();
      
      // Generar prompt que usa herramientas MCP
      const prompt = adapter.buildMCPPrompt(input);
      
      // Llamar a Claude con capacidades MCP
      const response = await adapter.callClaudeWithMCP(prompt);
      
      return adapter.parseRecommendationResponse(response);
    } finally {
      // Limpiar MCP Server
      adapter.stopMCPServer();
    }
  }

  private async startMCPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '../../mcp/product-mcp-server.ts');
      
      this.mcpProcess = spawn('npx', ['tsx', serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.mcpProcess.on('error', reject);
      
      // Esperar a que el servidor esté listo
      setTimeout(resolve, 2000);
    });
  }

  private stopMCPServer(): void {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }

  private buildMCPPrompt(input: MCPClaudeInput): string {
    return `
Eres un nutricionista experto. Usa las herramientas MCP disponibles para:

1. Obtener datos completos del cliente (ID: ${input.clienteId})
2. Buscar productos adecuados basado en:
   - Momento del día: ${input.momentoDelDia || 'cualquiera'}
   - Contexto: ${input.contexto || 'general'}
   - Objetivo específico: ${input.objetivoEspecifico || 'recomendación general'}
   - Solo favoritos: ${input.soloFavoritos || false}
   - Precio máximo: ${input.precioMaximo || 'sin límite'}

3. Analizar los datos y generar 1-3 recomendaciones personalizadas

IMPORTANTE: Primero usa get_cliente_data, luego search_products, y finalmente genera recomendaciones.

Responde en este formato JSON:
\`\`\`json
{
  "recomendaciones": [
    {
      "productoId": "string",
      "tituloRecomendacion": "🎯 TÍTULO",
      "iconoProducto": "emoji",
      "timingRecomendado": "string",
      "prioridad": "ALTA|MEDIA|BAJA",
      "razonamiento": "string",
      "dosis": "string",
      "frecuencia": "string"
    }
  ],
  "razonamientoGeneral": "string"
}
\`\`\`
`;
  }

  private async callClaudeWithMCP(prompt: string): Promise<string> {
    // Esta implementación dependería de cómo Claude maneja las herramientas MCP
    // Por ahora, simulamos la respuesta
    
    const requestBody = {
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      tools: [
        {
          type: 'mcp',
          server: 'nutrition-products-server'
        }
      ]
    };

    // Aquí iría la llamada real a Claude con soporte MCP
    // Por ahora devolvemos una respuesta simulada
    return ClaudeAdapter.callClaude(prompt);
  }

  private parseRecommendationResponse(response: string) {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);
    
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta MCP');
    }

    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
}
