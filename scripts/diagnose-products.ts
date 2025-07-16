// scripts/diagnose-products.ts
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function diagnoseProducts() {
  try {
    console.log('🔍 Diagnóstico de productos en la base de datos...\n');

    // Contar productos
    const totalProductos = await prisma.producto.count();
    console.log(`📊 Total de productos: ${totalProductos}`);

    if (totalProductos === 0) {
      console.log('❌ No hay productos en la base de datos');
      console.log('💡 Ejecuta el seeder de productos antes de usar el MCP Server');
      return;
    }

    // Obtener algunos productos de ejemplo
    const productosEjemplo = await prisma.producto.findMany({
      take: 5,
      include: {
        categoria: true,
        sabor: true,
        tamano: true,
      },
    });

    console.log('\n📦 Productos de ejemplo:');
    productosEjemplo.forEach((producto, index) => {
      console.log(`${index + 1}. ${producto.nombre} (ID: ${producto.id})`);
      console.log(`   - Categoría: ${producto.categoria?.nombre || 'Sin categoría'}`);
      console.log(`   - Sabor: ${producto.sabor?.nombre || 'Sin sabor'}`);
      console.log(`   - Precio: $${producto.precio}`);
      console.log('');
    });

    // Verificar categorías
    const categorias = await prisma.categoria.count();
    const sabores = await prisma.sabor.count();
    const tamanos = await prisma.tamano.count();

    console.log('📋 Resumen:');
    console.log(`   - Productos: ${totalProductos}`);
    console.log(`   - Categorías: ${categorias}`);
    console.log(`   - Sabores: ${sabores}`);
    console.log(`   - Tamaños: ${tamanos}`);

    // Verificar si hay productos sin relaciones
    const productosSinCategoria = await prisma.producto.count({
      where: { categoriaId: null }
    });

    if (productosSinCategoria > 0) {
      console.log(`\n⚠️  ${productosSinCategoria} productos sin categoría`);
    }

    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnoseProducts();