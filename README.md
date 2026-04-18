# Student Placement Prediction System

A full-stack MERN application for predicting student placements based on academic performance, projects, and skills.

## Features
- **Student Dashboard**: Enter academic metrics, CGPA, and soft skills to receive an ML-based placement prediction (High, Medium, Low).
- **Interactive Charts**: View historical prediction trends visually with Recharts.
- **Admin Panel**: Manage students and datasets with pagination and search functionality.
- **PDF Export**: Generate PDF reports for placement predictions.
- **Modern UI**: Built with a sleek, vibrant glassmorphism design.

## Tech Stack
- Frontend: React.js (Vite), React Router, Axios, Recharts, jsPDF, Vanilla CSS
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT Auth

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/student-placement`)

### 1. Backend Setup
```bash
cd backend
npm install
# Set your environment variables (optional, defaults are provided)
# PORT=5000
# MONGO_URI=mongodb://127.0.0.1:27017/student-placement
# JWT_SECRET=your_jwt_secret
npm run dev
```
The server will start on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React app will start on `http://localhost:3000`.

## Architecture Note
The original plan involved a Python Flask API for machine learning. Due to the local environment configuration, the prediction algorithm is currently simulated using a weighted logistic regression mock via Node.js directly in the Profile Controller. To shift strictly to Python `scikit-learn` in the future, extract the `/predict` route functionality to an external microservice.

## Production Deployment (Render + Vercel)

### Backend (Render) Environment Variables
- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = long random secret
- `SESSION_SECRET` = long random secret (different from JWT secret)
- `GEMINI_API_KEY` = your Gemini API key (required for resume PDF parsing)
- `GEMINI_MODEL` = optional model override (default: `gemini-2.0-flash`)
- `FRONTEND_URL` = your Vercel domain (for example: `https://your-frontend.vercel.app`)
- `NODE_ENV` = `production`

### Frontend (Vercel) Environment Variable
- `VITE_API_URL` = your Render backend root URL (for example: `https://placement-prediction-1irb.onrender.com`)

### Important Notes
- Session cookies are configured for cross-site production usage (`secure: true`, `sameSite: none`).
- Axios is configured with `withCredentials: true` so browser cookies are included automatically.
- OAuth redirects now use `FRONTEND_URL` instead of localhost.
