import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

const router = Router();
const prisma = new PrismaClient();
const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, tls: { rejectUnauthorized: false } })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null
    });
const redis = connection;
const llmQueue = new Queue('llm-queue', { connection });
const notificationQueue = new Queue('notification-queue', { connection });

// Helper to check slots
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query; // date: YYYY-MM-DD
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: String(doctorId), role: 'DOCTOR' },
      include: {
        leaves: {
          where: {
            date: new Date(String(date))
          }
        }
      }
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    
    // Check if doctor is on leave
    if (doctor.leaves.length > 0) {
      return res.json({ slots: [] }); // No slots available if on leave
    }

    const workingHours = doctor.workingHours as { start: string, end: string };
    const slotDuration = doctor.slotDuration || 30;

    // Fetch existing scheduled appointments
    const startOfDay = new Date(String(date));
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(String(date));
    endOfDay.setUTCHours(23,59,59,999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: String(doctorId),
        startTime: { gte: startOfDay, lte: endOfDay },
        status: 'SCHEDULED'
      }
    });

    const bookedTimes = appointments.map(a => a.startTime.getTime());

    // Generate slots
    const slots = [];
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    
    let currentSlot = new Date(startOfDay);
    currentSlot.setUTCHours(startHour, startMin, 0, 0);

    const endTime = new Date(startOfDay);
    endTime.setUTCHours(endHour, endMin, 0, 0);

    while (currentSlot < endTime) {
      if (!bookedTimes.includes(currentSlot.getTime())) {
        slots.push(new Date(currentSlot));
      }
      currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
    }

    res.json({ slots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book appointment
router.post('/book', authenticate, requireRole(['PATIENT']), async (req: AuthRequest, res) => {
  try {
    const { doctorId, startTime, symptoms } = req.body;
    const patientId = req.user!.id;
    
    const start = new Date(startTime);
    const lockKey = `lock:appointment:${doctorId}:${start.getTime()}`;

    // 1. Pessimistic Lock in Redis (holds for 10 seconds)
    const acquiredLock = await redis.setnx(lockKey, "LOCKED");
    if (!acquiredLock) {
      return res.status(409).json({ error: 'Slot is currently being booked by someone else. Try again in a few seconds.' });
    }
    await redis.expire(lockKey, 10);

    // 2. Validate doctor and duration
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== 'DOCTOR') {
      await redis.del(lockKey);
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const endTime = new Date(start.getTime() + (doctor.slotDuration || 30) * 60000);

    // 3. Database operation (relies on compound unique index [doctorId, startTime])
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        startTime: start,
        endTime,
        symptoms
      }
    });

    await redis.del(lockKey);

    // Enqueue BullMQ job for LLM pre-visit summary
    await llmQueue.add('generate-pre-visit', {
      appointmentId: appointment.id,
      symptoms
    });

    // Enqueue Notification (Email + Google Calendar)
    const patientUser = await prisma.user.findUnique({ where: { id: patientId } });
    const doctorUser = await prisma.user.findUnique({ where: { id: doctorId } });
    if (patientUser && doctorUser) {
      await notificationQueue.add('send-booking-confirmation', {
        appointmentId: appointment.id,
        patientEmail: patientUser.email,
        doctorEmail: doctorUser.email,
        startTime: appointment.startTime,
        doctorId: doctorUser.id
      });
    }

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error: any) {
    console.error(error);
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Slot is already booked' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to bypass Auth and seed dummy data for testing the Gemini AI and Redis Lock
import { generatePreVisitSummary } from '../services/llm.service';

router.post('/test-book', async (req, res) => {
  try {
    const { startTime, symptoms } = req.body;
    const start = new Date(startTime);

    // 1. Seed Dummy Doctor & Patient
    const doctor = await prisma.user.upsert({
      where: { email: 'dr.test@example.com' },
      update: {},
      create: { email: 'dr.test@example.com', passwordHash: 'mock', role: 'DOCTOR', name: 'Dr. Sarah Jenkins', specialization: 'Cardiology' }
    });
    const patient = await prisma.user.upsert({
      where: { email: 'patient.test@example.com' },
      update: {},
      create: { email: 'patient.test@example.com', passwordHash: 'mock', role: 'PATIENT', name: 'Test Patient' }
    });

    const lockKey = `lock:appointment:${doctor.id}:${start.getTime()}`;

    // 2. Pessimistic Lock in Redis (holds for 10 seconds)
    const acquiredLock = await redis.setnx(lockKey, "LOCKED");
    if (!acquiredLock) {
      return res.status(409).json({ error: 'Slot is currently being booked by someone else (Redis Locked!). Try again in a few seconds.' });
    }
    await redis.expire(lockKey, 10);

    const endTime = new Date(start.getTime() + 30 * 60000);

    // 3. Database operation (Prisma unique constraint)
    const appointment = await prisma.appointment.create({
      data: { patientId: patient.id, doctorId: doctor.id, startTime: start, endTime, symptoms }
    });
    
    await redis.del(lockKey);

    // 4. Fire Gemini LLM immediately to test it
    console.log(`[TEST-BOOK] Calling Gemini LLM to analyze symptoms: "${symptoms}"...`);
    const aiSummary = await generatePreVisitSummary(symptoms);
    console.log(`[TEST-BOOK] Gemini AI Result:`, aiSummary);

    // Save AI result back to database
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { 
        preVisitSummary: aiSummary.chiefComplaint,
        urgencyLevel: aiSummary.urgencyLevel,
        suggestedQuestions: aiSummary.suggestedQuestions as any
      }
    });

    res.status(201).json({ message: 'Appointment booked successfully & AI Summary generated (Check backend terminal!)', aiSummary });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'Slot is already booked in the Database' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Doctor gets their own scheduled appointments
router.get('/doctor', authenticate, requireRole(['DOCTOR']), async (req: AuthRequest, res) => {
  try {
    const doctorId = req.user!.id;
    // Get all scheduled appointments for this doctor from today onwards
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: today },
        status: 'SCHEDULED'
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Patient gets their own appointments
router.get('/patient', authenticate, requireRole(['PATIENT']), async (req: AuthRequest, res) => {
  try {
    const patientId = req.user!.id;
    
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { id: true, name: true, specialization: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post-visit notes
router.post('/:id/post-visit', authenticate, requireRole(['DOCTOR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes, prescription } = req.body;

    const appointment = await prisma.appointment.findUnique({ where: { id: String(id) } });
    if (!appointment || appointment.doctorId !== req.user!.id) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id: String(id) },
      data: {
        doctorNotes,
        prescription,
        status: 'COMPLETED'
      }
    });

    // Enqueue BullMQ job for LLM post-visit summary generation
    await llmQueue.add('generate-post-visit', {
      appointmentId: id,
      doctorNotes
    });

    res.json({ message: 'Visit completed! AI is generating the summary in the background.', appointment: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
