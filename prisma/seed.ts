// prisma/seed.ts
import { PrismaClient, RolUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // Verificar si ya existe el usuario admin
    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: 'admin@nutrizone.com' }
    });

    if (existingAdmin) {
      console.log('ℹ️  Usuario administrador ya existe, saltando creación...');
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const adminUser = await prisma.usuario.create({
      data: {
        email: 'admin@nutrizone.com',
        dni: '12345678',
        password: hashedPassword,
        nombre: 'Super',
        apellidoPaterno: 'Admin',
        apellidoMaterno: 'NutriZone',
        rol: RolUsuario.ADMINISTRADOR,
        active: true,
      },
    });

    console.log('✅ Usuario creado:', {
      id: adminUser.id,
      email: adminUser.email,
      dni: adminUser.dni,
      nombre: adminUser.nombre,
      rol: adminUser.rol,
    });

    // Crear perfil de administrador
    console.log('🛡️  Creando perfil de administrador...');
    const adminProfile = await prisma.administrador.create({
      data: {
        usuarioId: adminUser.id,
        departamento: 'Tecnología',
        nivelAcceso: 5, // Nivel máximo
      },
    });

    console.log('✅ Perfil de administrador creado:', {
      id: adminProfile.id,
      departamento: adminProfile.departamento,
      nivelAcceso: adminProfile.nivelAcceso,
    });

    // Crear algunos usuarios cliente de ejemplo (opcional)
    console.log('👥 Creando usuarios cliente de ejemplo...');
    
    const clientUsers = [
      {
        email: 'juan.perez@example.com',
        dni: '87654321',
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        clientData: {
          edad: 28,
          peso: 75.5,
          altura: 175,
          genero: 'Masculino',
          telefono: '987654321',
        }
      },
      {
        email: 'maria.lopez@example.com',
        dni: '11223344',
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Rodríguez',
        clientData: {
          edad: 32,
          peso: 62.0,
          altura: 165,
          genero: 'Femenino',
          telefono: '987654322',
        }
      }
    ];

    for (const userData of clientUsers) {
      const hashedClientPassword = await bcrypt.hash('Cliente123!', 12);
      
      const clientUser = await prisma.usuario.create({
        data: {
          email: userData.email,
          dni: userData.dni,
          password: hashedClientPassword,
          nombre: userData.nombre,
          apellidoPaterno: userData.apellidoPaterno,
          apellidoMaterno: userData.apellidoMaterno,
          rol: RolUsuario.CLIENTE,
          active: true,
        },
      });

      const client = await prisma.cliente.create({
        data: {
          usuarioId: clientUser.id,
          edad: userData.clientData.edad,
          peso: userData.clientData.peso,
          altura: userData.clientData.altura,
          genero: userData.clientData.genero,
          telefono: userData.clientData.telefono,
        },
      });

      // Crear preferencias básicas para el cliente
      await prisma.preferenciaCliente.create({
        data: {
          clienteId: client.id,
          productosFavoritos: [],
          preferenciasDieteticas: ['Sin gluten', 'Bajo en sodio'],
          alergenos: [],
          objetivosFitness: ['PERDIDA_PESO'],
          diasEntrenamiento: ['LUNES', 'MIERCOLES', 'VIERNES'],
          horariosEntrenamiento: ['07:00', '18:00'],
        },
      });

      console.log(`✅ Cliente creado: ${userData.nombre} ${userData.apellidoPaterno}`);
    }

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('=================================');
    console.log('👨‍💼 ADMINISTRADOR:');
    console.log('   Email/DNI: admin@nutrizone.com / 12345678');
    console.log('   Password: Admin123!');
    console.log('\n👤 CLIENTES DE EJEMPLO:');
    console.log('   Email/DNI: juan.perez@example.com / 87654321');
    console.log('   Email/DNI: maria.lopez@example.com / 11223344');
    console.log('   Password: Cliente123!');
    console.log('=================================\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexión a base de datos cerrada');
  });
