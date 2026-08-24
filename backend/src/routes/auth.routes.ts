import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, specialization, slotDuration, workingHours } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'PATIENT',
        // Doctor specific fields only applied if role is DOCTOR
        ...(role === 'DOCTOR' && {
          specialization,
          slotDuration: slotDuration || 30,
          workingHours: workingHours || { start: "09:00", end: "17:00" },
        })
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Redirect to Google Consent Screen
router.get('/google', (req, res) => {
  // We expect the frontend to pass the JWT token in the query so we know who is authenticating
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: token as string // Pass the JWT in the state parameter
  });

  res.redirect(url);
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });

    // Decode JWT from state to find the user
    const decoded = jwt.verify(state as string, JWT_SECRET) as { id: string };
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (tokens.refresh_token) {
      await prisma.user.update({
        where: { id: decoded.id },
        data: { googleRefreshToken: tokens.refresh_token }
      });
      res.send('<h2>Google Calendar linked successfully!</h2><p>You can close this window.</p>');
    } else {
      res.send('<h2>Already linked!</h2><p>No new refresh token provided. You can close this window.</p>');
    }
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(500).send('<h2>Authentication Failed</h2>');
  }
});

export default router;
