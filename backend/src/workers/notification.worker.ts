import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';
import { createCalendarEvent, deleteCalendarEvent } from '../services/calendar.service';

const prisma = new PrismaClient();
const connection = new Redis(
  process.env.REDIS_HOST 
    ? { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT), maxRetriesPerRequest: null } 
    : { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null }
);

export const notificationWorker = new Worker('notification-queue', async job => {
  if (job.name === 'send-booking-confirmation') {
    const { appointmentId, patientEmail, doctorEmail, startTime, doctorId } = job.data;
    
    console.log(`[Notification] Processing booking confirmation for appointment ${appointmentId}`);
    
    // 1. Send Email to Patient
    const subject = 'Appointment Confirmed - Healthcare Manager';
    const text = `Hello,\n\nYour appointment has been successfully scheduled for ${new Date(startTime).toLocaleString()}.\n\nThank you for choosing Healthcare Manager.`;
    await sendEmail(patientEmail, subject, text);

    // 2. Sync to Doctor's Google Calendar
    // Assuming we want to sync it to the Doctor's calendar (hence we pass doctorId to find their refreshToken)
    const eventId = await createCalendarEvent(doctorId, patientEmail, doctorEmail, new Date(startTime), 30);
    
    if (eventId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleEventId: eventId }
      });
    }

  } else if (job.name === 'send-cancellation-notice') {
    const { appointmentId, patientEmail, startTime, doctorId, googleEventId } = job.data;
    
    console.log(`[Notification] Processing cancellation notice for appointment ${appointmentId}`);

    // 1. Send Email to Patient
    const subject = 'Appointment Cancelled - Healthcare Manager';
    const text = `Hello,\n\nUnfortunately, your appointment scheduled for ${new Date(startTime).toLocaleString()} has been cancelled due to a doctor emergency override.\n\nPlease log in to the portal to re-book at your convenience.`;
    await sendEmail(patientEmail, subject, text);

    // 2. Remove from Doctor's Google Calendar
    if (googleEventId) {
      await deleteCalendarEvent(doctorId, googleEventId);
    }
  }
}, { 
  connection,
  concurrency: 10 // Handle up to 10 notifications concurrently
});

notificationWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`Notification Job ${job.name} failed with error ${err.message}`);
  }
});
