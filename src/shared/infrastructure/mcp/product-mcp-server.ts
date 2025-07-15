import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';    
import { prisma } from '../adapters/prisma/prisma.client';

// Schemas de validación con Zod
const SearchProductsSchema = z.object({
  clienteId: z.string(),
  momentoDelDia: z.string().optional(),
  soloFavoritos: z.boolean().optional(),
  alergenos: z.array(z.string()).optional(),
  precioMaximo: z.number().optional(),
  categorias: z.array(z.string()).optional()
});

const GetClienteDataSchema = z.object({
  clienteId: z.string()
});

class ProductMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'nutrition-products-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupTools();
  }

  private setupTools() {
    // Herramienta para buscar productos
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_products',
            description: 'Busca productos nutricionales basados en criterios del cliente',
            inputSchema: {
              type: 'object',
              properties: {
                clienteId: {
                  type: 'string',
                  description: 'ID del cliente'
                },
                momentoDelDia: {
                  type: 'string',
                  description: 'Momento del día para filtrar productos',
                  enum: ['MANANA', 'PRE_ENTRENAMIENTO', 'POST_ENTRENAMIENTO', 'TARDE', 'NOCHE', 'ANTES_DORMIR']
                },
                soloFavoritos: {
                  type: 'boolean',
                  description: 'Solo incluir productos favoritos del cliente'
                },
                alergenos: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Lista de alergenos a excluir'
                },
                precioMaximo: {
                  type: 'number',
                  description: 'Precio máximo de productos'
                },
                categorias: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Categorías de productos a incluir'
                }
              },
              required: ['clienteId']
            }
          },
          {
            name: 'get_cliente_data',
            description: 'Obtiene datos completos del cliente incluyendo preferencias y plan activo',
            inputSchema: {
              type: 'object',
              properties: {
                clienteId: {
                  type: 'string',
                  description: 'ID del cliente'
                }
              },
              required: ['clienteId']
            }
          }
        ]
      };
    });

    // Manejar llamadas a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_products':
          return await this.searchProducts(args);
        case 'get_cliente_data':
          return await this.getClienteData(args);
        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }
    });
  }

  private async searchProducts(args: any) {
    try {
      const params = SearchProductsSchema.parse(args);
      
      // Obtener preferencias del cliente
      const preferencias = await prisma.preferenciaCliente.findUnique({
        where: { clienteId: params.clienteId }
      });

      if (!preferencias) {
        throw new Error('Preferencias del cliente no encontradas');
      }

      // Construir query de productos
      let whereClause: any = {};

      // Filtrar por momento del día
      if (params.momentoDelDia) {
        whereClause.momentosRecomendados = {
          has: params.momentoDelDia
        };
      }

      // Filtrar solo favoritos
      if (params.soloFavoritos && preferencias.productosFavoritos.length > 0) {
        whereClause.id = {
          in: preferencias.productosFavoritos
        };
      }

      // Filtrar por precio máximo
      if (params.precioMaximo) {
        whereClause.precio = {
          lte: params.precioMaximo
        };
      }

      // Filtrar por categorías
      if (params.categorias && params.categorias.length > 0) {
        whereClause.categoriaId = {
          in: params.categorias
        };
      }

      // Buscar productos
      const productos = await prisma.producto.findMany({
        where: whereClause,
        include: {
          categoria: true,
          sabor: true,
          tamano: true
        },
        orderBy: [
          { precio: 'asc' }
        ],
        take: 20 // Limitar a 20 productos
      });

      // Filtrar por alergenos (en memoria porque es lógica compleja)
      const alergenosToExclude = params.alergenos || preferencias.alergenos;
      const productosFiltrados = productos.filter(producto => {
        if (alergenosToExclude.length === 0) return true;
        
        return !alergenosToExclude.some(alergeno => 
          producto.ingredientes.some(ingrediente => 
            ingrediente.toLowerCase().includes(alergeno.toLowerCase())
          )
        );
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              productos: productosFiltrados.map(p => ({
                id: p.id,
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio: p.precio,
                proteina: p.proteina,
                calorias: p.calorias,
                carbohidratos: p.carbohidratos,
                grasas: p.grasas,
                ingredientes: p.ingredientes,
                momentosRecomendados: p.momentosRecomendados,
                categoria: p.categoria?.nombre,
                sabor: p.sabor?.nombre,
                tamano: p.tamano?.nombre
              })),
              filtrosAplicados: this.buildFilterDescription(params),
              totalEncontrados: productosFiltrados.length,
              clienteId: params.clienteId
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error buscando productos: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async getClienteData(args: any) {
    try {
      const params = GetClienteDataSchema.parse(args);

      // Obtener datos del cliente
      const cliente = await prisma.cliente.findUnique({
        where: { id: params.clienteId },
        include: {
          cliente: true // Usuario relacionado
        }
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      // Obtener preferencias
      const preferencias = await prisma.preferenciaCliente.findUnique({
        where: { clienteId: params.clienteId }
      });

      // Obtener plan activo
      const planActivo = await prisma.planNutricional.findFirst({
        where: {
          clienteId: params.clienteId,
          estado: 'ACTIVO'
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              cliente: {
                id: cliente.id,
                nombre: cliente.cliente.nombre,
                apellidoPaterno: cliente.cliente.apellidoPaterno,
                apellidoMaterno: cliente.cliente.apellidoMaterno,
                edad: cliente.edad,
                peso: cliente.peso,
                altura: cliente.altura,
                nivelActividad: cliente.nivelActividad,
                genero: cliente.genero,
                grasaCorporal: cliente.grasaCorporal,
                masaMuscular: cliente.masaMuscular,
                metabolismoBasal: cliente.metabolismoBasal
              },
              preferencias: preferencias ? {
                productosFavoritos: preferencias.productosFavoritos,
                alergenos: preferencias.alergenos,
                objetivosFitness: preferencias.objetivosFitness,
                diasEntrenamiento: preferencias.diasEntrenamiento,
                horariosEntrenamiento: preferencias.horariosEntrenamiento
              } : null,
              planActivo: planActivo ? {
                id: planActivo.id,
                nombre: planActivo.nombre,
                objetivo: planActivo.objetivo,
                caloriasObjetivo: planActivo.caloriasObjetivo,
                proteinaObjetivo: planActivo.proteinaObjetivo,
                diasRestantes: planActivo.fechaFin ? 
                  Math.ceil((planActivo.fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
              } : null
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error obteniendo datos del cliente: ${error instanceof Error ? error.message : error}`);
    }
  }

  private buildFilterDescription(params: any): string[] {
    const filtros: string[] = [];
    
    if (params.momentoDelDia) filtros.push(`Momento: ${params.momentoDelDia}`);
    if (params.soloFavoritos) filtros.push('Solo productos favoritos');
    if (params.precioMaximo) filtros.push(`Precio máximo: S/. ${params.precioMaximo}`);
    if (params.categorias?.length) filtros.push(`Categorías: ${params.categorias.join(', ')}`);
    if (params.alergenos?.length) filtros.push(`Excluir alergenos: ${params.alergenos.join(', ')}`);
    
    return filtros;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Product MCP Server iniciado');
  }
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
  const server = new ProductMCPServer();
  server.start().catch(console.error);
}

export { ProductMCPServer };
