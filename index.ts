// index.ts - EN LA RAÍZ del proyecto
import app from './src/app'; // ✅ Usar app sin Prisma

export default async function handler(req: any, res: any) {
  // ✅ CORS headers ANTES de Express
  const origin = req.headers.origin;
  
  console.log(`🚀 VERCEL HANDLER - ${req.method} ${req.url} from ${origin}`);

  // ✅ Configurar CORS headers agresivamente
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization,Origin,Cache-Control');
  res.setHeader('Access-Control-Max-Age', '86400');

  // ✅ Responder OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS preflight handled at ROOT level for:', origin);
    res.status(200).end();
    return;
  }

  // ✅ Delegar a Express app
  try {
    return app(req, res);
  } catch (error) {
    console.error('❌ Error in Express app:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}