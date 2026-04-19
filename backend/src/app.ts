import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import database from './utils/database';

// Import routes
import authRoutes from './routes/auth';
import journeyRoutes from './routes/journey';
import peerForumRoutes from './routes/peerForum';
import chatbotRoutes from './routes/chatbot';
import appointmentRoutes from './routes/appointments';
import resourceRoutes from './routes/resources';
import analyticsRoutes from './routes/analytics';
import assessmentRoutes from './routes/assessments';
import crisisDetectionRoutes from './routes/crisis-detection';
import aiChatbotRoutes from './routes/ai-chatbot';

// Import chat module (multilingual chatbot microservice)
const { router: chatModuleRouter, initChatModule } = require('../server/app');

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Initialize database
let dbConnection: any = null;
database.initialize().then((db) => {
  dbConnection = db;
  console.log('💾 Database connection established');
  // Initialize chat module databases (Sequelize + MongoDB + Redis)
  return initChatModule();
}).catch((error) => {
  console.error('💥 Failed to initialize database:', error);
  process.exit(1);
});

// Make database available to routes
app.locals.db = () => dbConnection;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'NEONEXUS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/forum', peerForumRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/crisis-detection', crisisDetectionRoutes);
app.use('/api/ai-chatbot', aiChatbotRoutes);
app.use('/api/chat', chatModuleRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);

  // Don't expose sensitive error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(isDev && { stack: err.stack })
  });
});

export default app;