# PulseSync ⚡️ 

> **The Next-Generation AI-Powered Medical Appointment & Consultation Platform.**

PulseSync is a highly resilient, globally scalable telemedicine appointment platform built for the modern era. It seamlessly connects patients with doctors, eliminates booking conflicts via distributed locking, and leverages **Google Gemini AI** to analyze symptoms and synthesize complex doctor notes into patient-friendly summaries.

Built with an enterprise-grade stack: **Next.js, Express, Prisma, BullMQ, Redis, and Neon PostgreSQL.**

---

## 🔗 Live Deployments
- **Frontend App (Vercel):** [https://pulsesync-ochre.vercel.app](https://pulsesync-ochre.vercel.app)
- **Backend API (Render):** [https://pulsesync-backend-sxvf.onrender.com](https://pulsesync-backend-sxvf.onrender.com)

---

## 🏗️ Detailed System Architecture

PulseSync separates the frontend and backend to allow for independent scaling. Heavy processing (like AI analysis and Calendar sync) is fully decoupled from the main HTTP thread using asynchronous background workers.

```mermaid
graph TB
    subgraph Frontend [Client Layer - Next.js on Vercel]
        UI[Glassmorphic UI]
        PatientDash[Patient Dashboard]
        DoctorDash[Doctor Dashboard]
        UI --> PatientDash
        UI --> DoctorDash
    end

    subgraph Backend [API Layer - Express.js on Render]
        Router[API Router]
        AuthMiddleware[JWT + OAuth Middleware]
        Booking[Booking Controller]
        
        Router --> AuthMiddleware
        AuthMiddleware --> Booking
    end

    subgraph Data [Persistence Layer]
        DB[(Neon PostgreSQL)]
        Cache[(Upstash Redis)]
        
        Booking -->|1. Pessimistic Lock SETNX| Cache
        Booking -->|2. ACID Transaction| DB
    end

    subgraph Workers [Background Processing - BullMQ]
        LLMQueue[LLM Task Queue]
        NotifyQueue[Notification Queue]
        
        Booking -.->|Enqueue Event| LLMQueue
        Booking -.->|Enqueue Event| NotifyQueue
        
        LLMWorker[Gemini AI Worker]
        CalWorker[Google Calendar Worker]
        
        LLMQueue --> LLMWorker
        NotifyQueue --> CalWorker
        
        LLMWorker -.->|Update DB| DB
    end

    subgraph External [Third-Party APIs]
        Gemini[Google Gemini AI]
        GoogleOAuth[Google Auth & Calendar API]
        
        LLMWorker -->|REST POST| Gemini
        CalWorker -->|OAuth2 Token| GoogleOAuth
        AuthMiddleware -->|SSO| GoogleOAuth
    end

    PatientDash ==>|HTTP Requests| Router
    DoctorDash ==>|HTTP Requests| Router
```

### 🧠 Core Architectural Concepts

1. **Distributed Locking (Double-Booking Prevention):**
   When a booking request is made, the backend instantly issues a `SETNX lock:appointment:{doctorId}:{time}` to Upstash Redis with a 10-second TTL. This pessimistic lock prevents concurrent requests from causing race conditions. The PostgreSQL database acts as the final source of truth with a compound unique constraint on `[doctorId, startTime]`.
2. **Asynchronous Task Offloading:**
   Calls to Google Gemini API (for AI summaries) and Google Calendar API take time and are prone to network latency/rate-limits. By pushing these events to **BullMQ** (backed by Redis), the HTTP response is returned to the user in ~50ms, while the workers process the external APIs in the background with automatic exponential backoff retries on failure.

---

## 🚀 Detailed Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL Database** (We recommend [Neon.tech](https://neon.tech/) for serverless Postgres)
- **Redis Instance** (We recommend [Upstash](https://upstash.com/) for serverless Redis)
- **Google Cloud Console Account** (For OAuth and Calendar API)
- **Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

### 2. Clone the Repository
```bash
git clone https://github.com/am-saksham/pulsesync.git
cd pulsesync
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `/backend` directory:
```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
REDIS_URL="rediss://default:password@host:port"
JWT_SECRET="your_super_secret_jwt_key"
FRONTEND_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
GEMINI_API_KEY="your_gemini_api_key"
```

Initialize the Database:
```bash
npx prisma generate
npx prisma db push
```

Start the Backend Server (Runs on Port 3001 and spawns BullMQ workers):
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `/frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Start the Frontend Application (Runs on Port 3000):
```bash
npm run dev
```

---

## 📅 Google Calendar & OAuth Integration Guide

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a New Project and go to **APIs & Services**.
3. Click **Enable APIs and Services** and search for the **Google Calendar API**. Enable it.
4. Go to the **OAuth consent screen** tab, configure it as "External", and add the scopes: 
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/calendar.events`
5. Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
6. Set the Application Type to **Web application**.
7. Add the Authorized Redirect URIs:
   - For local development: `http://localhost:3001/api/auth/google/callback`
   - For production: `https://your-backend-url.onrender.com/api/auth/google/callback`
8. Copy the generated `Client ID` and `Client Secret` into your backend `.env` file.

When users select "Sign in with Google", the platform exchanges the authorization code for an access token and a `refreshToken`, which is stored in the database. The background BullMQ worker uses this `refreshToken` to transparently inject appointments directly into the user's Google Calendar.

---

## 🗄️ Database Schema (Prisma)

The database schema is fully relational and highly optimized for quick lookups and referential integrity.

```prisma
model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String
  role               Role      @default(PATIENT)
  name               String
  specialization     String?   
  slotDuration       Int?      @default(30)
  workingHours       Json?     // Custom hours: { "start": "09:00", "end": "17:00" }
  googleRefreshToken String?   // Used by background workers to sync calendars

  doctorAppointments  Appointment[] @relation("DoctorAppointments")
  patientAppointments Appointment[] @relation("PatientAppointments")
  leaves              Leave[]
}

model Appointment {
  id                 String    @id @default(uuid())
  patientId          String
  doctorId           String
  startTime          DateTime
  endTime            DateTime
  status             String    @default("SCHEDULED") // SCHEDULED, COMPLETED, CANCELLED
  
  // Pre-Visit Details
  symptoms           String?
  preVisitSummary    String?   // AI Generated
  urgencyLevel       String?   // AI Generated (STANDARD, MEDIUM, HIGH)
  suggestedQuestions Json?     // AI Generated (Array of Strings)
  
  // Post-Visit Details
  doctorNotes        String?
  prescription       String?
  postVisitSummary   String?   // AI Translated summary for the patient

  patient            User      @relation("PatientAppointments", fields: [patientId], references: [id])
  doctor             User      @relation("DoctorAppointments", fields: [doctorId], references: [id])
  
  // Strictly prevent double-booking at the DB layer
  @@unique([doctorId, startTime])
}

model Leave {
  id       String   @id @default(uuid())
  doctorId String
  date     DateTime
  reason   String?

  doctor   User     @relation(fields: [doctorId], references: [id])
  
  @@unique([doctorId, date])
}

enum Role {
  PATIENT
  DOCTOR
}
```

---

## 🤖 Advanced LLM Prompts (Google Gemini)

PulseSync utilizes the `gemini-1.5-flash` model for high-speed, cost-effective inference. We rely on strict JSON schema enforcement to ensure structured responses that parse flawlessly in the backend.

### 1. Pre-Visit Patient Intake Analysis
Fired instantly when a patient books an appointment.
> **System Instructions:**
> "You are an expert medical AI assistant. A patient has described their symptoms: '{symptoms}'. Analyze this and provide a concise JSON object containing:
> - 'chiefComplaint': A 1-2 sentence medical summary of the symptoms.
> - 'urgencyLevel': Either 'STANDARD', 'MEDIUM', or 'HIGH' based on clinical triage standards.
> - 'suggestedQuestions': An array of exactly 3 specific clinical questions the doctor should ask during the consultation to narrow down the differential diagnosis."

### 2. Post-Visit Clinical Translation
Fired instantly when a doctor completes a visit and saves their clinical notes.
> **System Instructions:**
> "You are an empathetic medical AI. The doctor has written the following complex clinical notes: '{doctorNotes}'. Translate these clinical notes into a simple, easy-to-understand summary tailored for a patient with no medical background. Avoid dense medical jargon. Keep it comforting, clear, and actionable. Output plain text formatting that the patient can read directly."

---

## 🌐 Complete API Documentation

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register a new PATIENT or DOCTOR | No |
| POST | `/login` | Authenticate and return JWT token | No |
| GET | `/google` | Initiates Google OAuth2 SSO | No |
| GET | `/google/callback`| Handles Google OAuth callback & stores Refresh Token | No |

### User Profile Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/me` | Get the currently authenticated user's profile | Yes |
| PUT | `/me` | Update settings (name, specialization, working hours) | Yes |
| GET | `/doctors` | Fetch a list of all available doctors | Yes |

### Appointment Routes (`/api/appointments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/available-slots` | Fetch dynamically generated open time slots (checks leaves) | Yes |
| POST | `/book` | Acquire Redis lock, book slot, enqueue AI & Email tasks | Yes (PATIENT)|
| GET | `/doctor` | Fetch a doctor's active queue of scheduled visits | Yes (DOCTOR) |
| GET | `/patient` | Fetch a patient's historical and upcoming visits | Yes (PATIENT) |
| POST | `/:id/post-visit` | Submit notes, complete visit, enqueue Post-Visit AI task | Yes (DOCTOR) |
