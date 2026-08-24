import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const createCalendarEvent = async (userId: string, patientEmail: string, doctorEmail: string, startTime: Date, durationMinutes: number) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.googleRefreshToken) {
      console.log(`[Google Calendar] Skipped: User ${userId} has no linked Google account.`);
      return null;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const event = {
      summary: `Medical Appointment - Healthcare Manager`,
      description: `Appointment with Patient: ${patientEmail}`,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      attendees: [
        { email: patientEmail },
        { email: doctorEmail }
      ],
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all'
    });

    console.log(`[Google Calendar] Event created: ${res.data.htmlLink}`);
    return res.data.id;
  } catch (error) {
    console.error(`[Google Calendar] Error creating event:`, error);
    return null;
  }
};

export const deleteCalendarEvent = async (userId: string, eventId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.googleRefreshToken) return false;

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });

    console.log(`[Google Calendar] Event deleted: ${eventId}`);
    return true;
  } catch (error) {
    console.error(`[Google Calendar] Error deleting event ${eventId}:`, error);
    return false;
  }
};
