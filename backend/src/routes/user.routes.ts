import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

const router = Router();
const prisma = new PrismaClient();
const connection = new Redis(
  process.env.REDIS_HOST 
    ? { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT), maxRetriesPerRequest: null } 
    : { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null }
);
const notificationQueue = new Queue('notification-queue', { connection });

// Get list of doctors, optionally filtered by specialization
router.get('/doctors', async (req, res) => {
  try {
    const { specialization } = req.query;

    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        ...(specialization ? { specialization: String(specialization) } : {})
      },
      select: {
        id: true,
        name: true,
        specialization: true,
        slotDuration: true,
        workingHours: true
      }
    });

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin creates a doctor
router.post('/admin/doctors', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { email, name, specialization, slotDuration, workingHours } = req.body;
    
    // In a real app we'd set a random password and email them
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'dummy_hash', // To be implemented with proper invite flow
        name,
        role: 'DOCTOR',
        specialization,
        slotDuration: slotDuration || 30,
        workingHours: workingHours || { start: "09:00", end: "17:00" }
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin sets doctor leave
router.post('/admin/leaves', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { doctorId, date } = req.body; // date format: YYYY-MM-DD
    
    const leaveDate = new Date(date);

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId,
        date: leaveDate
      }
    });

    // Cancel all appointments for this doctor on this day
    const startOfDay = new Date(leaveDate);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(leaveDate);
    endOfDay.setUTCHours(23,59,59,999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'SCHEDULED'
      },
      include: {
        patient: true
      }
    });

    await prisma.appointment.updateMany({
      where: {
        id: { in: appointments.map(a => a.id) }
      },
      data: { status: 'CANCELLED' }
    });

    // Dispatch BullMQ jobs to send cancellation emails and delete Calendar events
    for (const appt of appointments) {
      await notificationQueue.add('send-cancellation-notice', {
        appointmentId: appt.id,
        patientEmail: appt.patient.email,
        startTime: appt.startTime,
        doctorId: appt.doctorId,
        googleEventId: appt.googleEventId
      });
    }

    res.status(201).json({ message: 'Leave created and appointments cancelled', leave, cancelledCount: appointments.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
