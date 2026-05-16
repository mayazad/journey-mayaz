# Mayaz OS

A premium, AI-powered personal operating system built to seamlessly manage fitness, academics, continuous learning, and secure metadata. Designed with a clean, Apple-inspired high-fidelity aesthetic, Mayaz OS leverages real-time AI to keep you focused and organized.

## 🚀 Features

- **Personalized Daily Briefing**: An AI-generated summary of your day (split into morning and afternoon sessions) detailing your workout, upcoming academic deadlines, and learning progress.
- **Context-Aware AI Chat**: A floating chat assistant that knows your schedule. Use hotkeys like `/workout`, `/tasks`, or `/motivate` for instant contextual insights.
- **Fitness Tracker**: Plan your weekly workout routine (Push, Pull, Legs, etc.) and track individual exercises, sets, and reps. Uses AI Quick Set to easily parse natural language into structured plans.
- **Academics Hub**: Manage university assignments, exams, and projects. Add tasks effortlessly with natural language using AI Quick Add.
- **Learning Roadmaps**: Paste raw text, syllabus, or ChatGPT output, and the AI will automatically generate a structured, step-by-step learning roadmap.
- **Secure Vault**: Track where you used which email and authentication method (e.g., GitHub OAuth, Google, Magic Link) across the web. **Note:** AI is intentionally restricted from accessing your Vault.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Vanilla CSS, robust Inline Styles, Framer Motion (animations)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Row Level Security)
- **AI Integration**: Groq SDK using the `llama-3.1-8b-instant` model

## 📦 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/mayazad/journey-mayaz.git
cd journey-mayaz
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Database Setup (Supabase)
Run the following SQL files in your Supabase SQL Editor to set up the necessary tables and Row Level Security (RLS) policies:
- `schema.sql` (Base tables)
- `schema_v2.sql` (Fitness, Academics, Vault)
- `schema_briefings.sql` (Daily AI Briefing cache)
- `schema_profiles.sql` (User profiles logic)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎨 Design Philosophy
Mayaz OS focuses on visual stability and a premium user experience. The UI avoids complex CSS cascades in favor of a robust, modular inline-style card architecture over a clean light-grey (`#f0f0f0`) background. Interactive elements feature subtle micro-animations and intuitive feedback loops for a professional, frictionless feel.
