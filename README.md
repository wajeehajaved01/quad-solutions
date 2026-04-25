# Quad Solutions — Medical Credentialing Management System

A full-stack web application for managing medical credentialing operations and client onboarding.

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Auth**: JWT (JSON Web Tokens)
- **Deploy**: Render (backend) + Vercel/Netlify (frontend)

---

## Project Structure

```
quad-solutions/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model (client + admin roles)
│   │   └── Request.js       # Credentialing request model
│   ├── routes/
│   │   ├── auth.js          # Register, login, /me
│   │   ├── requests.js      # Client: submit + view own requests
│   │   ├── admin.js         # Admin: manage all requests + clients
│   │   └── clients.js       # (extendable)
│   ├── middleware/
│   │   └── auth.js          # JWT protect + adminOnly middleware
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── api.js           # All API calls in one place
    └── pages/
        ├── index.html           # Landing page
        ├── services.html        # Services info page
        ├── contact.html         # Contact form
        ├── login.html           # Login
        ├── register.html        # Client registration
        ├── client-dashboard.html  # Client: view requests + stats
        ├── submit-request.html    # Client: submit new request
        ├── admin-dashboard.html   # Admin: stats overview
        ├── admin-requests.html    # Admin: manage all requests
        └── admin-clients.html     # Admin: view all clients
```

---

## Setup Instructions

### 1. MongoDB Atlas (Free)
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → create free account
2. Create a new cluster (free tier M0)
3. Go to **Database Access** → Add user with username + password
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all)
5. Go to **Connect** → Connect your application → copy the connection string

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/quad-solutions
JWT_SECRET=make_this_a_long_random_string_123!
```

```bash
npm run dev    # uses nodemon for auto-restart
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

### 3. Create Admin User

Use Postman or Thunder Client (VS Code extension):

**POST** `http://localhost:5000/api/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@quad.com",
  "password": "admin123"
}
```

Then go to **MongoDB Atlas** → Browse Collections → users → find that document → change `role` from `"client"` to `"admin"` → Save.

### 4. Frontend Setup

No build step needed! Just open `frontend/pages/index.html` in your browser.

**Or** use VS Code Live Server extension (right-click → Open with Live Server).

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new client | None |
| POST | `/api/auth/login` | Login → returns JWT | None |
| GET  | `/api/auth/me` | Get current user | Token |

### Client Requests
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/requests` | Submit new request | Client token |
| GET  | `/api/requests` | Get my requests | Client token |
| GET  | `/api/requests/:id` | Get single request | Client token |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard stats | Admin token |
| GET | `/api/admin/clients` | All clients | Admin token |
| GET | `/api/admin/requests` | All requests | Admin token |
| GET | `/api/admin/requests/:id` | Single request | Admin token |
| PATCH | `/api/admin/requests/:id/status` | Update status | Admin token |
| DELETE | `/api/admin/requests/:id` | Delete request | Admin token |

---

## Deployment

### Backend → Render (Free)
1. Push backend folder to GitHub
2. Go to [https://render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. Set environment variables (same as .env)
5. Build command: `npm install` | Start command: `node server.js`

### Frontend → Vercel
1. Push frontend folder to GitHub
2. Go to [https://vercel.com](https://vercel.com) → Import project
3. No build settings needed (static HTML)
4. After deploy, update `API` variable in `js/api.js` to your Render URL

---

## Features Implemented

### User Side
- [x] Landing page with services overview
- [x] Client registration and login
- [x] Submit credentialing requests
- [x] Track application status (dashboard)
- [x] Contact support page

### Admin Panel
- [x] Secure admin login (role-based)
- [x] Dashboard with analytics (total, pending, approved, rejected)
- [x] View all client applications
- [x] Update application status (pending → in review → approved/rejected)
- [x] Add admin notes to applications
- [x] Delete requests
- [x] View all registered clients
- [x] Search and filter functionality

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `NODE_ENV` | `development` or `production` |
