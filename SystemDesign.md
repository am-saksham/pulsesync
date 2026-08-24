# System Design Write-Up: PulseSync Platform

## 1. Double-Booking Prevention
In high-concurrency environments like telemedicine, multiple patients might attempt to book the exact same slot with a popular doctor simultaneously. To guarantee true consistency and prevent double-booking, PulseSync employs a two-tier locking strategy:

**Tier 1: Redis Pessimistic Distributed Locking (Application Level)**
When a booking request hits the API, the system instantly calculates a unique lock key: `lock:appointment:{doctorId}:{startTime}`. It attempts to acquire a distributed lock in Redis using the `SETNX` (Set if Not eXists) command. 
- If successful, the request proceeds, and the lock is assigned a 10-second expiration.
- If unsuccessful (the key already exists), the system instantly rejects the request with an HTTP 409 Conflict error, informing the user that the slot is currently being held.
This prevents DB contention and provides immediate feedback.

**Tier 2: PostgreSQL Compound Unique Constraint (Database Level)**
To protect against absolute edge cases (e.g., Redis cluster failure or manual DB insertion), the PostgreSQL `Appointment` table enforces a compound unique constraint: `@@unique([doctorId, startTime])`. Even if the application logic fails, the database physically rejects any attempt to insert a duplicate record for a specific doctor at a specific time, throwing a Prisma `P2002` error which the backend gracefully catches.

## 2. Doctor Leave Conflict Handling
Doctors can take spontaneous or planned leaves. To handle this efficiently without mutating the core appointment schedule algorithm, we implemented a `Leave` table mapped directly to the Doctor entity.

When the Patient Dashboard requests `/available-slots` for a specific date:
1. The backend performs a relational fetch joining the `User` (Doctor) and `Leave` tables.
2. If a leave record exists for the requested date, the algorithm short-circuits and immediately returns `[]` (empty slots).
3. If no leave exists, it proceeds to dynamically generate time slots based on the doctor's custom `workingHours` and `slotDuration`.
4. It then filters out any slots that intersect with already booked `startTime`s in the `Appointment` table.
This design separates "availability intent" (Leave) from "booking state" (Appointments), keeping the domain logic clean.

## 3. Slot Hold Mechanism
In standard ticketing systems, slots are held for users while they check out. PulseSync mimics this behavior via the **Redis Pessimistic Lock** established during the booking sequence.

When a patient confirms a booking, the system acquires a Redis lock that explicitly holds the slot for exactly 10 seconds (`redis.expire(lockKey, 10)`). This short window is sufficient because the booking endpoint immediately writes to PostgreSQL. 
If we were to integrate a payment gateway (e.g., Stripe) in the future, this mechanism is easily extensible: the lock duration would simply be extended to 15 minutes, allowing the user to complete the checkout flow safely while blocking other users. If the checkout fails or times out, Redis automatically evicts the lock, returning the slot to the global pool without requiring complex database cleanup cron jobs.

## 4. Notification & AI Task Failure Handling
PulseSync delegates heavy external API operations (Google Calendar inserts, Email sending, and Gemini AI inference) to background workers using **BullMQ** running on Redis.

**Handling Failures:**
External APIs (like Google or Gemini) are prone to rate limiting, network partitions, and 5xx errors. If executed synchronously, a failed email would cause the entire booking request to fail, frustrating the user.
Instead, PulseSync enqueues these jobs into separate BullMQ queues (`llm-queue` and `notification-queue`). If the Gemini API timeouts or Google Calendar throws a 429 Too Many Requests error:
1. The BullMQ worker catches the exception.
2. It employs an exponential backoff retry strategy (e.g., waiting 5s, 10s, 20s) to automatically re-attempt the task.
3. If the task fails permanently, it is moved to a Dead Letter Queue (DLQ) in Redis, allowing developers to manually inspect the stack trace and replay the job later.
Because these processes run entirely out-of-band, the patient receives instant confirmation that their appointment is booked, ensuring a fast, resilient user experience regardless of third-party API stability.
