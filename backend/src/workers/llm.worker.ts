import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { generatePreVisitSummary, generatePostVisitSummary } from '../services/llm.service';

const prisma = new PrismaClient();
const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, tls: { rejectUnauthorized: false } })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null
    });

export const llmWorker = new Worker('llm-queue', async job => {
  if (job.name === 'generate-pre-visit') {
    const { appointmentId, symptoms } = job.data;
    
    console.log(`Processing pre-visit summary for appointment ${appointmentId}`);
    const summaryData = await generatePreVisitSummary(symptoms);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        urgencyLevel: summaryData.urgencyLevel,
        preVisitSummary: summaryData.chiefComplaint,
        suggestedQuestions: summaryData.suggestedQuestions
      }
    });
    console.log(`Successfully generated pre-visit summary for ${appointmentId}`);

  } else if (job.name === 'generate-post-visit') {
    const { appointmentId, doctorNotes } = job.data;
    
    console.log(`Processing post-visit summary for appointment ${appointmentId}`);
    const summaryData = await generatePostVisitSummary(doctorNotes);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        postVisitSummary: summaryData.patientSummary,
        prescription: summaryData.medications.join(', ') // Simple concat for now
      }
    });

    // TODO: Queue medication reminders based on summaryData.medications
    console.log(`Successfully generated post-visit summary for ${appointmentId}`);
  }
}, { 
  connection,
  concurrency: 5 // Process up to 5 LLM requests concurrently
});

llmWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`LLM Job ${job.id} failed with error ${err.message}`);
  }
});
