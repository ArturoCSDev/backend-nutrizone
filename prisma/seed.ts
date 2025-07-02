// prisma/seed.ts
import { PrismaClient, TipoProducto } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // =============================================
  // TAMAÑOS
  // =============================================
  console.log('📏 Creando tamaños...');
  
  const tamanoMega = await prisma.tamano.upsert({
    where: { nombre: 'Mega' },
    update: {},
    create: {
      nombre: 'Mega',
      volumen: 600, // ml
      proteina: 27, // gramos
    },
  });

  const tamanoMini = await prisma.tamano.upsert({
    where: { nombre: 'Mini' },
    update: {},
    create: {
      nombre: 'Mini',
      volumen: 420, // ml
      proteina: 18, // gramos
    },
  });

  console.log(`✅ Tamaños creados: ${tamanoMega.nombre} (${tamanoMega.volumen}ml), ${tamanoMini.nombre} (${tamanoMini.volumen}ml)`);

  // =============================================
  // CATEGORÍAS
  // =============================================
  console.log('📂 Creando categorías...');

  const categoriaWaffles = await prisma.categoria.upsert({
    where: { nombre: 'Waffles' },
    update: {},
    create: {
      nombre: 'Waffles',
      descripcion: 'Deliciosos waffles nutritivos',
      tipoProducto: TipoProducto.WAFFLE,
    },
  });

  const categoriaBatidos = await prisma.categoria.upsert({
    where: { nombre: 'Batidos' },
    update: {},
    create: {
      nombre: 'Batidos',
      descripcion: 'Batidos proteicos y nutritivos',
      tipoProducto: TipoProducto.BATIDO,
    },
  });

  const categoriaRefrescos = await prisma.categoria.upsert({
    where: { nombre: 'Refrescos' },
    update: {},
    create: {
      nombre: 'Refrescos',
      descripcion: 'Bebidas refrescantes y saludables',
      tipoProducto: TipoProducto.REFRESCO,
    },
  });

  console.log(`✅ Categorías creadas: ${categoriaWaffles.nombre}, ${categoriaBatidos.nombre}, ${categoriaRefrescos.nombre}`);

  // =============================================
  // SABORES (OPCIONAL - Para que tengas algunos datos)
  // =============================================
  console.log('🍓 Creando sabores básicos...');

  const saborVainilla = await prisma.sabor.upsert({
    where: { nombre: 'Vainilla' },
    update: {},
    create: {
      nombre: 'Vainilla',
      descripcion: 'Sabor clásico y cremoso',
    },
  });

  const saborChocolate = await prisma.sabor.upsert({
    where: { nombre: 'Chocolate' },
    update: {},
    create: {
      nombre: 'Chocolate',
      descripcion: 'Rico sabor a chocolate',
    },
  });

  const saborFresa = await prisma.sabor.upsert({
    where: { nombre: 'Fresa' },
    update: {},
    create: {
      nombre: 'Fresa',
      descripcion: 'Sabor natural a fresa',
    },
  });

  console.log(`✅ Sabores creados: ${saborVainilla.nombre}, ${saborChocolate.nombre}, ${saborFresa.nombre}`);

  // =============================================
  // PRODUCTOS DE EJEMPLO (OPCIONAL)
  // =============================================
  console.log('🥤 Creando productos de ejemplo...');

  // Batido de Vainilla Mega
  const batidoVainillaMega = await prisma.producto.upsert({
    where: { id: 'Batido Proteico Vainilla Mega' },
    update: {},
    create: {
      nombre: 'Batido Proteico Vainilla Mega',
      descripcion: 'Batido proteico sabor vainilla en presentación Mega',
      precio: 15.50,
      proteina: 27,
      calorias: 150,
      volumen: 600,
      carbohidratos: 8,
      grasas: 2,
      fibra: 1,
      azucar: 5,
      categoriaId: categoriaBatidos.id,
      saborId: saborVainilla.id,
      tamanoId: tamanoMega.id,
      ingredientes: ['Proteína de suero', 'Saborizante natural', 'Vitaminas', 'Minerales'],
      etiquetas: ['Alto en proteína', 'Bajo en grasa', 'Post-entreno'],
      momentosRecomendados: ['POST_ENTRENAMIENTO', 'MANANA'],
    },
  });

  // Batido de Chocolate Mini
  const batidoChocolateMini = await prisma.producto.upsert({
    where: { id: 'Batido Proteico Chocolate Mini' },
    update: {},
    create: {
      nombre: 'Batido Proteico Chocolate Mini',
      descripcion: 'Batido proteico sabor chocolate en presentación Mini',
      precio: 12.00,
      proteina: 18,
      calorias: 110,
      volumen: 420,
      carbohidratos: 6,
      grasas: 1,
      fibra: 1,
      azucar: 4,
      categoriaId: categoriaBatidos.id,
      saborId: saborChocolate.id,
      tamanoId: tamanoMini.id,
      ingredientes: ['Proteína de suero', 'Cacao natural', 'Vitaminas', 'Minerales'],
      etiquetas: ['Alto en proteína', 'Sabor intenso', 'Pre-entreno'],
      momentosRecomendados: ['PRE_ENTRENAMIENTO', 'TARDE'],
    },
  });

  // Waffle de Fresa
  const waffleFresa = await prisma.producto.upsert({
    where: { id: 'Waffle Proteico Fresa' },
    update: {},
    create: {
      nombre: 'Waffle Proteico Fresa',
      descripcion: 'Waffle proteico con sabor natural a fresa',
      precio: 8.50,
      proteina: 15,
      calorias: 200,
      carbohidratos: 25,
      grasas: 6,
      fibra: 3,
      azucar: 8,
      categoriaId: categoriaWaffles.id,
      saborId: saborFresa.id,
      ingredientes: ['Harina de avena', 'Proteína vegetal', 'Fresa deshidratada', 'Huevo'],
      etiquetas: ['Desayuno saludable', 'Rico en fibra', 'Sabor natural'],
      momentosRecomendados: ['MANANA', 'TARDE'],
    },
  });

  console.log(`✅ Productos creados: ${batidoVainillaMega.nombre}, ${batidoChocolateMini.nombre}, ${waffleFresa.nombre}`);

  console.log('🎉 ¡Seed completado exitosamente!');
  console.log('\n📊 Resumen de datos creados:');
  console.log(`- Tamaños: 2 (Mega, Mini)`);
  console.log(`- Categorías: 3 (Waffles, Batidos, Refrescos)`);
  console.log(`- Sabores: 3 (Vainilla, Chocolate, Fresa)`);
  console.log(`- Productos: 3 (ejemplos de cada categoría)`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });