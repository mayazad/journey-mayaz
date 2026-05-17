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
Start your day right. An AI-generated summary of your day—covering your workout plan, upcoming academic deadlines, and active learning roadmaps. Refreshable on-demand via the `/dailybrief` chat shortcut.

### 💬 Context-Aware AI Chat
A floating chat assistant that knows your schedule (but never your private Vault).
Use hotkeys like `/workout`, `/tasks`, `/motivate`, `/week`, or `/dailybrief` for instant contextual insights and guidance.

### 🏋️ Fitness Tracker & AI Quick Set
Plan your weekly workout routine (Push, Pull, Legs, etc.) and track individual exercises, sets, and reps. Use **AI Quick Set** to parse natural language (e.g., *"Monday is push day with bench press 4x8"*) into structured plans. Includes dedicated **Diet** and **Sleep** tracking tabs with AI-powered health insights and icon-based navigation.

### 🎓 Academics Hub
Manage university assignments, exams, and projects. Add tasks with natural language using **AI Quick Add**. Stay ahead of deadlines with clean, urgency-sorted task cards. Tap any task to open a full **detail view** (bottom sheet) showing notes and due time, with the ability to delete tasks inline. Relative times show hour-level precision (e.g., `In 5h`, `In 1d 3h`).

### 🧠 Learning Roadmaps
Paste raw text, syllabus fragments, or ChatGPT output, and the AI will automatically generate a structured, step-by-step learning roadmap to master any topic. Track individual topic nodes as pending, in-progress, or complete.

### 📝 Learning Notes
A personal note-taking system built directly into the Learning module. Create and manage notes with titles and free-form content. Notes open in a **full-screen vault-like bottom sheet** with a clean View Mode and an optional Edit Mode. The AI can parse any note and generate a structured **learning roadmap** from it in one tap.

### 🏠 Interactive Home Dashboard
The home screen features clickable **workout cards** that open a full exercise list in a bottom sheet, and clickable **upcoming task cards** that preview task details. All relative dates show hour-level granularity for precise time awareness.

### 🔐 Secure Vault
Track where you used which email and authentication method (e.g., GitHub OAuth, Google, Magic Link) across the web.
> **Note:** AI is intentionally restricted from accessing your Vault. Your metadata remains strictly private.

### ⚙️ Settings & Profile
Update your display name, upload a profile avatar (stored in Supabase Storage), and manage app preferences including daily briefing cache clearing.

---

## 🛠️ Built With

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
* **Library**: [React 19](https://react.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS)
* **AI Engine**: [Groq](https://groq.com/) using `llama-3.1-8b-instant`
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Styling**: Inline styles + minimal Tailwind CSS

---

## 🚀 Getting Started

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
Run the following SQL files in your Supabase SQL Editor in order:
- `schema.sql` — Base tables (users, sessions)
- `schema_v2.sql` — Fitness, Academics, Vault tables
- `schema_briefings.sql` — Daily AI briefing cache
- `schema_profiles.sql` — User profiles & avatar logic
- `schema_health.sql` — Diet and sleep tracking tables
- `schema_notes.sql` — Learning notes table

### 4. Start the Application
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the app.

---

## 🎨 Design Philosophy
Mayaz OS focuses on **visual stability** and a **premium user experience**.
The UI uses a modular inline-style card architecture over a clean light-grey (`#f0f0f0`) background. All detail views (notes, tasks, workouts) use a **Vault-like bottom sheet** pattern — sliding up from the bottom with a dimming backdrop and spring animation for a native mobile feel. Interactive elements feature subtle micro-animations and intuitive feedback for a professional, frictionless experience.

<br />

<div align="center">
  <i>Designed & Built by <a href="https://www.linkedin.com/in/md-mayaz-ad/" target="_blank">Mayaz</a></i>
</div>
