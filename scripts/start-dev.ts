import { spawn, ChildProcess } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno
config({ path: path.join(__dirname, '../.env') });

class DevServerManager {
  private mcpProcess: ChildProcess | null = null;
  private backendProcess: ChildProcess | null = null;

  async startBoth() {
    console.log('🚀 Iniciando servidores de desarrollo...\n');

    try {
      // Iniciar MCP Server
      await this.startMCPServer();
      
      // Esperar un poco antes de iniciar el backend
      await this.delay(3000);
      
      // Iniciar Backend
      await this.startBackend();
      
      console.log('\n✅ Ambos servidores están corriendo!');
      console.log('📡 Backend API: http://localhost:3000');
      console.log('🔧 MCP Server: Corriendo en STDIO');
      console.log('\n💡 Para detener ambos: Ctrl+C');

    } catch (error) {
      console.error('❌ Error iniciando servidores:', error);
      this.cleanup();
      process.exit(1);
    }
  }

  private async startMCPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔧 Iniciando MCP Server...');
      
      this.mcpProcess = spawn('npm', ['run', 'mcp:dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.mcpProcess.stdout?.on('data', (data) => {
        console.log(`[MCP] ${data.toString().trim()}`);
      });

      this.mcpProcess.stderr?.on('data', (data) => {
        console.error(`[MCP ERROR] ${data.toString().trim()}`);
      });

      this.mcpProcess.on('error', (error) => {
        console.error('❌ Error en MCP Server:', error);
        reject(error);
      });

      // Resolver después de un tiempo (asumiendo que inició correctamente)
      setTimeout(() => {
        console.log('✅ MCP Server iniciado');
        resolve();
      }, 2000);
    });
  }

  private async startBackend(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🌐 Iniciando Backend API...');
      
      this.backendProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.backendProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`[API] ${output}`);
        
        // Detectar cuando el backend esté listo
        if (output.includes('Server running on port') || output.includes('listening on')) {
          console.log('✅ Backend API iniciado');
          resolve();
        }
      });

      this.backendProcess.stderr?.on('data', (data) => {
        console.error(`[API ERROR] ${data.toString().trim()}`);
      });

      this.backendProcess.on('error', (error) => {
        console.error('❌ Error en Backend API:', error);
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanup() {
    console.log('\n🧹 Limpiando procesos...');
    
    if (this.mcpProcess) {
      this.mcpProcess.kill('SIGTERM');
      this.mcpProcess = null;
      console.log('🔧 MCP Server detenido');
    }
    
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      this.backendProcess = null;
      console.log('🌐 Backend API detenido');
    }
  }

  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n🛑 Deteniendo todos los servidores...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Deteniendo todos los servidores...');
      this.cleanup();
      process.exit(0);
    });
  }
}

// Iniciar todo
const devManager = new DevServerManager();
devManager.setupSignalHandlers();
devManager.startBoth();
