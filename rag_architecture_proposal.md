# Mayaz OS — AI Accuracy Diagnosis & RAG Upgrade Roadmap

A candid, expert-level analysis of the current AI implementation identifying exactly why hallucinations still occur and what a proper fix looks like — without vendor lock-in or over-engineering.

---

## 🔬 Honest Diagnosis: Why the Current AI Still Hallucinates

After reviewing the entire source code — specifically `src/actions/ai.ts`, `src/app/home/page.tsx`, and `src/components/HomeChatPanel.tsx` — here are the five precise root causes:

---

### Root Cause 1 — The Timezone Resolution was Broken at Page Load (FIXED ✅)

**The Problem (was):**  
In `src/app/home/page.tsx` the server was reading `todayName` from `new Date().getDay()` using **Vercel's UTC server clock**, not the user's timezone cookie. The actual `DAYS[now.getDay()]` index that powered `workoutPlans.find(wp => wp.day_of_week === todayName)` was UTC-based.

At 9 PM in Bangladesh (UTC+6), Vercel's server clock reads 3 PM UTC — still Sunday. So `todayName = 'Sunday'`, and the query finds nothing. The AI tells the user they have no workout even though locally it is already Monday.

**The Fix (applied):**  
`todayName` is now resolved using `Intl.DateTimeFormat` with the user's timezone cookie, exactly the same way `ai.ts` already does it for the briefing.

---

### Root Cause 2 — The AI Had to Infer "Tomorrow" from Dates (FIXED ✅)

**The Problem (was):**  
The context snapshot listed all workout days in a flat string and the AI had to infer: *"Today is Sunday → tomorrow is Monday → look up Monday in the list."* 8B models frequently get this multi-step inference wrong.

**The Fix (applied):**  
`tomorrowName` and `tomorrowPlan` are now pre-computed server-side and injected as **explicit dedicated lines** in the context snapshot:

```
Today's Day of Week: Sunday
Tomorrow's Day of Week: Monday

Today (Sunday): No workout plan set.
Tomorrow (Monday - Legs day, Muscles: Quadriceps, Hamstrings...): Bodyweight Squats (2x12), Barbell Squat (3x8), ...
```

The AI now reads "Tomorrow (Monday)" directly — zero inference required.

---

### Root Cause 3 — Context Snapshot Was Built Once at Page Load (Ongoing)

The context string is built when the server renders the home page and then sits static in the browser. If a user opens the page and chats hours later, the snapshot is stale. This is an inherent limitation of the current architecture.

**Mitigation (already applied):** The browser sends `clientTime` at chat-send time via `HomeChatPanel.tsx` so the AI at least knows the current time even if the workout snapshot is stale.

**Proper Fix:** Phase 2 — Agentic Tool-Calling RAG (see below).

---

### Root Cause 4 — The AI Cannot Compute Aggregations (Ongoing)

The AI has no access to meal logs, sleep logs, or calorie history. Questions like *"How many calories did I eat yesterday?"* or *"How was my sleep this week?"* will always either fail or hallucinate because the data simply is not in the context snapshot.

**Proper Fix:** Phase 2 — Agentic Tool-Calling RAG (see below).

---

## 🗺️ Phased Upgrade Plan

### Phase 1 — Timezone + Tomorrow Fix ✅ DONE

- Fixed `todayName` to use timezone-aware `Intl.DateTimeFormat` (was using UTC `now.getDay()`)
- Pre-computed `tomorrowName` and `tomorrowPlan` server-side
- Injected explicit `Today:` and `Tomorrow:` workout lines into the context snapshot
- Injected `Tomorrow's Day of Week:` header so the AI reads it directly, not infers it

---

### Phase 2 — Agentic Tool-Calling RAG (When Ready)

This is the full solution. It eliminates the stale-snapshot problem entirely by letting the AI **query your live database on demand** through a set of secure, pre-compiled Next.js Server Actions.

**New file to create: `src/actions/tools.ts`**

| Tool | Query | Returns |
|:---|:---|:---|
| `get_workout_schedule(day)` | `SELECT * FROM workout_plans WHERE day_of_week = $day` | Full exercise list with sets/reps |
| `get_academic_tasks(status, days_ahead)` | `SELECT * FROM academic_tasks WHERE due_date <= NOW() + INTERVAL...` | Filtered, dated task list |
| `get_nutrition_summary(date)` | `SELECT SUM(calories), SUM(protein_g)... FROM meal_logs WHERE logged_date = $date` | Aggregated macros |
| `get_active_roadmaps()` | `SELECT title, node_count, done_count FROM roadmaps` | Roadmap progress |

**Updated `chatWithAI` flow:**
```typescript
// Step 1: Ask AI which tool(s) it needs
const response1 = await groq.chat.completions.create({
  model: 'llama-3.1-8b-instant',
  tools: MAYAZ_OS_TOOLS,
  tool_choice: 'auto',
  messages: [systemPrompt, { role: 'user', content: message }]
})

// Step 2: Execute the tool calls → run the real SQL
if (response1.choices[0].finish_reason === 'tool_calls') {
  const toolResults = await executeTools(response1.choices[0].message.tool_calls)
  
  // Step 3: Feed fresh DB results back → get grounded final answer
  const response2 = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [..., toolResultMessages]
  })
  return response2.choices[0].message.content
}
```

**Security guarantees:**
- No `vault_credentials` tool exists → AI physically cannot access passwords
- All tool parameters are validated server-side before query execution
- No external APIs needed — Groq SDK supports `tool_calls` natively

---

### Phase 3 — UI Feedback Polish (Bundled with Phase 2)

Add a live tool-execution indicator in `HomeChatPanel.tsx`:
- *"🔍 Checking your workout schedule..."*
- *"📚 Looking up your academic tasks..."*
- *"🍎 Calculating nutrition summary..."*

---

## 📊 Current State After Phase 1

| Question | Before | Now |
|:---|:---|:---|
| *Do I have workout tomorrow?* | ❌ Wrong (UTC day mismatch) | ✅ Correct |
| *What's my Monday workout?* | ⚠️ Sometimes wrong | ✅ Correct |
| *How many calories did I eat yesterday?* | ❌ Cannot compute | ❌ Needs Phase 2 |
| *What's due this week?* | ⚠️ Partial | ✅ Full list |
| *What roadmap am I working on?* | ✅ Titles only | ✅ Titles (Phase 2 adds progress %) |

---

*Last updated: May 17, 2026 — Phase 1 implemented and verified.*
