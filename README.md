# Gamified Interview Trainer

An AI-powered, gamified technical interview training platform. It provides adaptive difficulty questions, real-time emotion detection, speech-to-text transcriptions, and comprehensive AI feedback to help you ace your next interview.

## 🚀 Features
- **Adaptive Question Bank**: Questions scale in difficulty based on your performance.
- **Real-Time Emotion Tracking**: Monitors your facial expressions during the interview using a Vision Transformer (ViT) model.
- **AI Feedback**: Generates detailed, 2-line technical feedback highlighting what you got right and what you missed.
- **Resume Parsing**: Automatically extracts skills and experience from your uploaded resume to tailor your interview domain.
- **Gamification**: Earn badges and improve your ELO rating as you answer questions correctly.

## 🛠️ Tech Stack
This project uses a microservices architecture divided into three main components:

### Frontend (`/app`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand, React Query
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui (Radix)

### Backend Server (`/server`)
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via Motor Asyncio driver)
- **AI Integration**: Google Gemini API & local Ollama support

### Machine Learning Service (`/ml`)
- **Framework**: FastAPI (Python)
- **Models**: PyTorch, HuggingFace Transformers, SentenceTransformers
- **Capabilities**: Facial emotion detection, semantic answer scoring, PDF resume parsing.

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- MongoDB instance (local or Atlas)

### 1. Environment Variables
Copy `.env.example` to `.env` and `.env.local` in your root directory and fill in the required values.
```bash
cp .env.example .env
cp .env.example .env.local
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend Server:**
```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**ML Service:**
```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Running Locally
We have a convenient shell script to run all services at once (if configured), but you can also start them individually:

**Frontend:** `npm run dev` (Runs on `localhost:3000`)  
**Backend:** `cd server && uvicorn main:app --reload --port 8080` (Runs on `localhost:8080`)  
**ML Service:** `cd ml && uvicorn main:app --reload --port 8000` (Runs on `localhost:8000`)

---

## 🌍 Deployment Guide

To deploy this platform to production, you will need to host the three components separately.

### 1. Frontend (Next.js)
The easiest way to deploy the frontend is via **Vercel**.
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from your `.env.local` to the Vercel project settings.
   - Make sure `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_ML_URL` point to your live backend URLs.
4. Deploy!

### 2. Backend Server (FastAPI)
You can deploy the Python backend to a PAAS like **Render**, **Railway**, or **Heroku**.
1. Create a new Web Service on Render/Railway.
2. Set the Root Directory to `server`.
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the necessary environment variables (MongoDB URI, Gemini Keys, etc.).

### 3. Machine Learning Service (FastAPI)
The ML service requires significantly more RAM and ideally a GPU to run the transformers efficiently.
- **Option A (Render/Railway):** Deploy similarly to the backend server, setting the root directory to `ml`. Ensure you select a tier with at least 2GB-4GB of RAM, as the models must be loaded into memory.
- **Option B (RunPod / AWS EC2 / GCP):** For better performance (especially emotion detection), deploy this on a GPU instance. You can wrap the `ml` folder in a Docker container and run it on an EC2 instance.
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4. Database (MongoDB)
Use **MongoDB Atlas** for a fully managed database in the cloud.
- Create a free tier cluster.
- Whitelist `0.0.0.0/0` in the Network Access tab so your deployed backends can reach it.
- Copy the connection string into the `MONGODB_URI` environment variable of your Backend Server.

## 🕒 Nightly Background Jobs
There is a cron job designed to retroactively generate missing AI feedbacks. On your production backend server (if you have shell access), you should configure a cron job to execute `server/scripts/retry_feedback.py` nightly:
```bash
0 0 * * * cd /path/to/project && /path/to/venv/bin/python3 server/scripts/retry_feedback.py >> retry_feedback.log 2>&1
```
