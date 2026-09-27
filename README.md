 Ace Badminton Academy — Court Booking Platform

A full-stack web app for a badminton academy where customers can browse courts, check live slot availability, book a 1-hour or 2-hour session, and pay online.

**Live demo:** https://ace-badminton-cyan.vercel.app
**Backend API:** https://ace-badminton.onrender.com/api

> Note: the backend is hosted on Render's free tier, which sleeps after inactivity. The first request after idle time may take 30-50 seconds to respond.

---

 Features

- **Authentication** — JWT-based signup/login with role support (customer, coach, admin)
- **Court management** — Admins can add courts; customers browse the public list
- **Real-time-style availability** — Booking screen shows hourly slots (6 AM–10 PM) as open or booked, computed live from existing bookings
- **Conflict-safe booking** — Server-side check prevents two customers from booking the same court/date/hour, even under concurrent requests
- **Payment flow** — Order creation → checkout → signature verification, modeled directly on Razorpay's real integration pattern (see note below)
- **My Bookings** — Customers can view their full booking history and status

 Tech Stack

**Frontend:** React (Vite), React Router, Axios, Context API for auth state
**Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

 Architecture Notes

**Booking conflict handling.** Rather than pre-seeding a slot document for every hour of every day forever, each booking stores the hours it occupies directly (`slotTimes: ["07:00", "08:00"]`). Before creating a new booking, the server checks for any existing `pending`/`confirmed` booking on the same court and date whose slot times overlap, rejecting with a `409` if found. This is intentionally simpler than a Redis-based distributed lock; the natural next step to harden it against race conditions at scale would be a Redis `SETNX` lock per slot or a unique compound index — a tradeoff made consciously for this project's scope.

**Payment gateway.** The app uses a mock payment module (`utils/paymentGateway.js`) that mirrors Razorpay's real API shape — order creation, an HMAC-SHA256 signature over `orderId|paymentId`, and server-side signature verification. This lets the full checkout flow (create order → simulate payment → verify signature → confirm booking) be built and demonstrated end-to-end without requiring a live payment gateway account. Swapping in a real Razorpay integration would only mean replacing this one file.

## Local Setup

 Backend
```bash
cd badminton-backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, MOCK_PAYMENT_SECRET
npm run dev
```

 Frontend
```bash
cd badminton-frontend
npm install
# create .env with: VITE_API_URL=http://localhost:5000/api
npm run dev
```

 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |
| GET | `/api/courts` | List all courts |
| POST | `/api/courts` | Create a court (admin only) |
| POST | `/api/bookings` | Create a booking (conflict-checked) |
| GET | `/api/bookings/availability` | Get slot availability for a court/date |
| GET | `/api/bookings/my` | Get the logged-in user's bookings |
| POST | `/api/bookings/:id/pay` | Create a payment order for a booking |
| POST | `/api/bookings/:id/mock-pay` | (dev only) simulate a successful payment |
| POST | `/api/bookings/:id/verify` | Verify payment and confirm booking |

 Deployment

- **Frontend** is deployed on Vercel, root directory `badminton-frontend`, with `VITE_API_URL` pointing at the live backend.
- **Backend** is deployed on Render, root directory `badminton-backend`, with `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MOCK_PAYMENT_SECRET`, and `CLIENT_URL` (set to the Vercel URL, for CORS) configured as environment variables.
- **Database** is MongoDB Atlas, free M0 tier.

 Author
Yeshvaanth A
