<div align="center">

#  Mayaz OS 

**A premium, AI-powered personal operating system**

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-DB-green?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Groq_Llama_3.1-orange?style=for-the-badge&logo=meta" alt="Groq" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" alt="TS" />
</p>

Designed to seamlessly manage fitness, academics, continuous learning, and secure metadata. Built with a clean, Apple-inspired high-fidelity aesthetic, Mayaz OS leverages real-time AI to keep you focused, organized, and moving forward.

</div>

---

## ✨ Features

### 🤖 Intelligent Daily Briefings
Start your day right. An AI-generated summary of your day—split into **Morning** and **Afternoon** sessions—detailing your workout, upcoming academic deadlines, and learning progress.

### 💬 Context-Aware AI Chat
A floating chat assistant that knows your schedule (but never your private Vault). 
Use hotkeys like `/workout`, `/tasks`, or `/motivate` for instant contextual insights and guidance.

### 🏋️ Fitness Tracker & AI Quick Set
Plan your weekly workout routine (Push, Pull, Legs, etc.) and track individual exercises, sets, and reps. Use **AI Quick Set** to easily parse natural language (e.g., *"Monday is push day with bench press 4x8"*) into structured plans.

### 🎓 Academics Hub
Manage university assignments, exams, and projects. Add tasks effortlessly with natural language using **AI Quick Add**. Stay ahead of deadlines with clean, priority-based sorting.

### 🧠 Learning Roadmaps
Paste raw text, syllabus fragments, or ChatGPT output, and the AI will automatically generate a structured, step-by-step learning roadmap to master any topic.

### 🔐 Secure Vault
Track where you used which email and authentication method (e.g., GitHub OAuth, Google, Magic Link) across the web. 
> **Note:** AI is intentionally restricted from accessing your Vault. Your metadata remains strictly private.

---

## 🛠️ Built With

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
* **Library**: [React 19](https://react.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS)
* **AI Engine**: [Groq](https://groq.com/) using `llama-3.1-8b-instant`
* **Styling**: Robust Inline Styles + minimal Tailwind + [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

Follow these steps to set up Mayaz OS locally.

### 1. Clone the Repository
```bash
git clone https://github.com/mayazad/journey-mayaz.git
cd journey-mayaz
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Initialize the Database
Run the following SQL files in your Supabase SQL Editor to set up the necessary tables and Row Level Security (RLS) policies:
- `schema.sql` (Base tables)
- `schema_v2.sql` (Fitness, Academics, Vault)
- `schema_briefings.sql` (Daily AI Briefing cache)
- `schema_profiles.sql` (User profiles logic)

### 4. Start the Application
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the app.

---

## 🎨 Design Philosophy
Mayaz OS focuses on **visual stability** and a **premium user experience**. 
The UI deliberately avoids complex CSS cascades in favor of a robust, modular inline-style card architecture over a clean light-grey (`#f0f0f0`) background. Interactive elements feature subtle micro-animations and intuitive feedback loops for a professional, frictionless feel.

<br />

<div align="center">
  <i>Designed & Built by Mayaz</i>
</div>
