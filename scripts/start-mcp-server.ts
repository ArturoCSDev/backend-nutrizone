import { ProductMCPServer } from '../src/shared/infrastructure/mcp/product-mcp-server';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    console.log('🚀 Iniciando Product MCP Server...');
    console.log('📊 Variables de entorno:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
    
    const server = new ProductMCPServer();
    await server.start();
    
    console.log('✅ Product MCP Server está corriendo');
    console.log('🔧 Herramientas disponibles:');
    console.log('   - search_products');
    console.log('   - get_cliente_data');
    console.log('');
    console.log('💡 Para detener: Ctrl+C');
    
    // Mantener el proceso vivo
    process.on('SIGINT', () => {
      console.log('\n🛑 Cerrando MCP Server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Cerrando MCP Server...');
      process.exit(0);
    });

    // Log cada 30 segundos que sigue funcionando
    setInterval(() => {
      console.log(`⏰ MCP Server activo - ${new Date().toLocaleTimeString()}`);
    }, 30000);

  } catch (error) {
    console.error('❌ Error iniciando MCP Server:', error);
    process.exit(1);
  }
}

main();
