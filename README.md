# Healthcare Appointment & Follow-up Manager

A comprehensive full-stack platform designed to handle complex clinic scheduling, prevent double-bookings, and leverage AI to enhance doctor-patient communication.

## System Architecture Highlights
* **Frontend:** Next.js with Tailwind CSS
* **Backend:** Node.js, Express.js, TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Background Processing:** Redis + BullMQ (Handles LLM, Email, and Google Calendar tasks)

## Problem Solving & Technical Implementation

### Double-Booking Prevention
The system leverages a **two-layered approach** to prevent double booking:
1. **Pessimistic Redis Lock:** When a patient attempts to book, a 10-second `setnx` lock is placed in Redis for that specific `(doctorId, startTime)`. If multiple requests hit the server at the exact same millisecond, only the first request acquires the Redis lock.
2. **Database Constraint:** A compound unique index `@@unique([doctorId, startTime])` in PostgreSQL acts as a strict final safeguard. If the Redis cache were to fail or drop, the database will actively reject overlapping slot insertions.

### Doctor Leave Conflict Handling
When an admin creates a `DoctorLeave` for a specific date, the API calculates the 24-hour window for that date, identifies all `SCHEDULED` appointments for the affected doctor, and updates their statuses to `CANCELLED`. A BullMQ background job is immediately dispatched to send email cancellation notices.

### AI Integration & Failure Handling
Generating AI summaries can be slow and unpredictable. To prevent booking failures, the LLM integration (Google Gemini) is completely decoupled from the main thread using BullMQ.
* **Graceful Fallback:** If the LLM API times out or throws an error, the BullMQ worker automatically triggers a fallback block that returns standard predefined text (e.g., using the patient's raw symptoms as the chief complaint) so that the user experience is never broken.

## Local Development Setup

### 1. Start Services
Ensure Docker is installed and running, then start the PostgreSQL and Redis containers:
```bash
docker-compose up -d
```

### 2. Configure Environment
1. Copy `backend/.env.example` to `backend/.env`
2. Make sure the database URL points to the local Postgres container (already pre-configured in `.env.example`).
3. Add your `GEMINI_API_KEY` for the LLM.

### 3. Setup Backend
Navigate into the backend and run migrations:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

### 4. Setup Frontend
Navigate into the frontend:
```bash
cd frontend
npm install
npm run dev
```

## LLM Prompts Used

**Pre-visit Summary Prompt:**
> "Analyse these symptoms and return: urgency level (LOW / MEDIUM / HIGH), chief complaint, and three suggested questions for the doctor. Symptoms: {symptoms}"

**Post-visit Summary Prompt:**
> "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps. Clinical notes: {notes}"
