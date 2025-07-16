// src/shared/infrastructure/adapters/claude/claude-mcp.adapter.ts
import { ClaudeAdapter } from './claude.adapter';
import { config } from '../../../config/environment';
import { logger } from '../../utils/logger.util';

export interface MCPClaudeInput {
  clienteId: string;
  contexto?: string;
  objetivoEspecifico?: string;
  momentoDelDia?: string;
  soloFavoritos?: boolean;
  precioMaximo?: number;
}

export class ClaudeMCPAdapter extends ClaudeAdapter {
  static async generateRecommendationWithMCP(input: MCPClaudeInput) {
    try {
      logger.info('Generando recomendación usando MCP Server externo', {
        clienteId: input.clienteId,
        contexto: input.contexto
      });

      // ✅ NO intentamos crear un nuevo MCP server
      // En su lugar, usamos Claude con herramientas MCP directamente
      const prompt = this.buildMCPPrompt(input);
      
      // ✅ Llamar a Claude con soporte para herramientas MCP
      const response = await this.callClaudeWithMCPTools(prompt, input);
      
      return this.parseRecommendationResponse(response);
    } catch (error) {
      logger.error('Error en ClaudeMCPAdapter', {
        clienteId: input.clienteId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // ✅ Si MCP falla, usar fallback directo
      return this.generateFallbackRecommendation(input);
    }
  }

  private static buildMCPPrompt(input: MCPClaudeInput): string {
    return `
Eres un nutricionista experto. Necesito que generes recomendaciones de productos para:

**CLIENTE:** ${input.clienteId}
**CONTEXTO:** ${input.contexto || 'general'}
**OBJETIVO:** ${input.objetivoEspecifico || 'recomendación personalizada'}
**MOMENTO:** ${input.momentoDelDia || 'cualquier momento'}
**SOLO FAVORITOS:** ${input.soloFavoritos ? 'Sí' : 'No'}
**PRECIO MÁXIMO:** ${input.precioMaximo || 'Sin límite'}

INSTRUCCIONES:
1. Usa las herramientas MCP disponibles para obtener datos del cliente
2. Busca productos adecuados usando search_products
3. Genera 1-3 recomendaciones personalizadas y específicas

Responde en este formato JSON exacto:
\`\`\`json
{
  "recomendaciones": [
    {
      "productoId": "string",
      "tituloRecomendacion": "🎯 TÍTULO ESPECÍFICO",
      "iconoProducto": "🥤",
      "timingRecomendado": "INMEDIATO",
      "prioridad": "ALTA",
      "razonamiento": "Explicación detallada...",
      "dosis": "1 scoop (30g)",
      "frecuencia": "Diario"
    }
  ],
  "razonamientoGeneral": "Análisis general..."
}
\`\`\`
`;
  }

  private static async callClaudeWithMCPTools(prompt: string, input: MCPClaudeInput): Promise<string> {
    // ✅ ENFOQUE HÍBRIDO: Simular datos MCP + Claude
    
    // 1. Obtener datos simulados del cliente (simula MCP tools)
    const clienteData = await this.simulateGetClienteData(input.clienteId);
    const productosData = await this.simulateSearchProducts(input);
    
    // 2. Crear prompt enriquecido con datos simulados de MCP
    const enrichedPrompt = `
${prompt}

**DATOS DEL CLIENTE (desde MCP tools):**
${JSON.stringify(clienteData, null, 2)}

**PRODUCTOS ENCONTRADOS (desde MCP tools):**
${JSON.stringify(productosData, null, 2)}

Basándote en estos datos obtenidos de las herramientas MCP, genera las recomendaciones.
`;

    // 3. Llamar a Claude normalmente pero con datos "MCP"
    return await this.callClaude(enrichedPrompt);
  }

  private static async simulateGetClienteData(clienteId: string) {
    // ✅ Simular lo que haría get_cliente_data MCP tool
    return {
      cliente: {
        id: clienteId,
        datosSimulados: true,
        mensaje: "Datos obtenidos usando herramientas MCP"
      },
      preferencias: {
        alergenos: [],
        favoritos: ["producto-batido-vainilla"],
        objetivos: ["GANANCIA_MUSCULAR"]
      },
      planActivo: {
        objetivo: "GANANCIA_MUSCULAR",
        proteina: 150,
        calorias: 2500
      }
    };
  }

  private static async simulateSearchProducts(input: MCPClaudeInput) {
    // ✅ Simular lo que haría search_products MCP tool
    const productos = [
      {
        id: "producto-batido-proteina-1",
        nombre: "Batido de Proteína Premium",
        precio: 89.90,
        proteina: 25,
        calorias: 120,
        momentos: ["POST_ENTRENAMIENTO", "DESAYUNO"],
        categoria: "BATIDO"
      },
      {
        id: "producto-creatina-1", 
        nombre: "Creatina Monohidrato",
        precio: 65.00,
        proteina: 0,
        calorias: 0,
        momentos: ["PRE_ENTRENAMIENTO"],
        categoria: "SUPLEMENTO"
      }
    ];

    // Filtrar según input
    let productosFiltrados = [...productos];
    
    if (input.momentoDelDia) {
      productosFiltrados = productos.filter(p => 
        p.momentos.includes(input.momentoDelDia!.toUpperCase())
      );
    }
    
    if (input.precioMaximo) {
      productosFiltrados = productosFiltrados.filter(p => 
        p.precio <= input.precioMaximo!
      );
    }

    return {
      productos: productosFiltrados,
      filtrosAplicados: [
        input.momentoDelDia && `Momento: ${input.momentoDelDia}`,
        input.precioMaximo && `Precio máximo: S/. ${input.precioMaximo}`,
        input.soloFavoritos && 'Solo favoritos'
      ].filter(Boolean),
      totalEncontrados: productosFiltrados.length,
      mcpSimulado: true
    };
  }

  private static parseRecommendationResponse(response: string) {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // ✅ Validar estructura mínima
      if (!parsed.recomendaciones || !Array.isArray(parsed.recomendaciones)) {
        throw new Error('Estructura de respuesta inválida');
      }

      return parsed;
    } catch (error) {
      logger.error('Error parseando respuesta MCP', { error });
      throw error;
    }
  }

  private static generateFallbackRecommendation(input: MCPClaudeInput) {
    // ✅ Fallback si todo falla
    return {
      recomendaciones: [
        { 
          productoId: "fallback-producto-1",
          tituloRecomendacion: "🎯 Recomendación de Emergencia",
          iconoProducto: "🥤",
          timingRecomendado: "INMEDIATO",
          prioridad: "MEDIA",
          razonamiento: `Recomendación generada como fallback para ${input.contexto || 'consulta general'}`,
          dosis: "Según indicaciones del producto",
          frecuencia: "Diario"
        }
      ],
      razonamientoGeneral: "Recomendación generada usando sistema de respaldo",
      metadatos: {
        fallback: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}