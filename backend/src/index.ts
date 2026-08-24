import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import appointmentRoutes from './routes/appointment.routes';
import './workers/llm.worker'; // Boot up the background worker
import './workers/notification.worker'; // Boot up the notification worker

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Healthcare Manager API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    name: 'Healthcare Manager API', 
    version: '1.0.0', 
    status: 'Running' 
  });
});

// Attach Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
