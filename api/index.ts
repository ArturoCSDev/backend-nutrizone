// Backend: api/index.ts - Wrapper simple para Vercel (sin @vercel/node)
import app from '../src/app';

export default async function handler(req: any, res: any) {
  // ✅ CORS headers ANTES de Express
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://frontend-nitruzone.vercel.app',
    'https://frontend-nutrizone.vercel.app', 
    'https://frontend-nitruzone-dcwsec8jt-arturocsdevs-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ];

  console.log(`🔍 Request: ${req.method} ${req.url} from ${origin}`);

  // ✅ Configurar CORS headers
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization,Origin,Cache-Control');
  res.setHeader('Access-Control-Max-Age', '86400');

  // ✅ Responder OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS preflight handled at Vercel level for:', origin);
    res.status(200).end();
    return;
  }

  // ✅ Delegar a Express app
  try {
    await app(req, res);
  } catch (error) {
    console.error('❌ Error in Express app:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}