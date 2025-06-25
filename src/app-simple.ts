// src/app-simple.ts - SIN PRISMA para testing CORS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// =============================================
// CORS ULTRA PERMISIVO
// =============================================

const corsOptions = {
  origin: true, // ✅ Permite CUALQUIER origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'], 
  exposedHeaders: ['Authorization'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Manejo manual de OPTIONS
app.use('*', (req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl} from ${req.get('Origin')}`);
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS handled in Express');
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control');
    res.header('Access-Control-Max-Age', '1728000');
    return res.status(200).end();
  }
  next();
});

// =============================================
// SECURITY MIDDLEWARE
// =============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// =============================================
// REQUEST PARSING
// =============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// SIMPLE ROUTES - SIN PRISMA
// =============================================

app.get('/health', (req, res) => {
  console.log('🏥 Health check from:', req.get('Origin'));
  res.status(200).json({
    status: 'OK',
    message: 'Nutrition API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    corsTest: 'Working!'
  });
});

app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS Test endpoint hit from:', req.get('Origin'));
  res.status(200).json({
    message: 'CORS is working!',
    method: req.method,
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint from:', req.get('Origin'));
  res.status(200).json({
    message: '🥤 Welcome to Nutrition API',
    version: '1.0.0',
    docs: '/health',
    corsTest: '/cors-test',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// SIMPLE AUTH ROUTES - SIN PRISMA
// =============================================

app.post('/api/v1/auth/login', (req, res) => {
  console.log('🔐 Login endpoint hit from:', req.get('Origin'));
  console.log('Body:', req.body);
  
  res.status(200).json({
    success: true,
    message: 'Login simulado exitoso',
    data: {
      user: { id: '1', email: 'test@test.com', nombre: 'Test User' },
      token: 'fake-jwt-token'
    }
  });
});

app.post('/api/v1/auth/register/client', (req, res) => {
  console.log('📝 Register client endpoint hit from:', req.get('Origin'));
  
  res.status(201).json({
    success: true,
    message: 'Cliente registrado exitosamente (simulado)',
    data: {
      user: { id: '2', email: req.body.email, nombre: req.body.nombre },
      client: { id: '1', hasCompleteProfile: false }
    }
  });
});

// =============================================
// ERROR HANDLING
// =============================================

app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

export default app;