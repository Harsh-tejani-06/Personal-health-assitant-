# Exercise Feature — Walkthrough

## Files Created

### Backend
| File | Purpose |
|------|---------|
| [ExercisePlan.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/models/ExercisePlan.js) | MongoDB model — exercise steps (name, instruction, sets, reps, duration, YouTube query, calories), daily logs |
| [exerciseRoutes.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/routes/exerciseRoutes.js) | 6 API endpoints — plan CRUD, daily logging, calendar, next-day AI suggestions |

### Frontend
| File | Purpose |
|------|---------|
| [exerciseService.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/services/exerciseService.js) | API service layer (6 functions) |
| [Exercise.jsx](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/components/pages/Exercise.jsx) | Full exercise page — 4 views |

### Modified
| File | Change |
|------|--------|
| [index.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/index.js) | Registered `exerciseRoutes` |

## Features Implemented

1. **AI Exercise Plan Generation** — Groq AI generates morning (6-8 exercises) and night (4-6 exercises) routines based on:
   - User's `primaryGoal` (weight_loss → cardio/HIIT, weight_gain → strength training)
   - Height, weight, age group, gender, activity level
   - Today's diet data (calorie-aware suggestions)
   - Recent 7-day exercise history (progressive difficulty)

2. **Daily Tracking** — Checkboxes for each exercise, auto-saves on toggle, progress bar with percentage and calorie counter

3. **YouTube Links** — Each exercise has a red YouTube badge that opens a search for that exercise tutorial

4. **Next-Day AI Suggestions** — Modal that analyzes yesterday's completed/skipped exercises + diet, then suggests adjustments with priority levels (high/medium/low)

5. **Calendar View** — Monthly grid showing ✅ complete, 🟡 partial, — not done. Click any day to view/update that day's exercises

## How to Test

```bash
# Terminal 1 — Backend
cd backend
node index.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

1. Login → Navigate to `/exercise`
2. Click **"Generate My Exercise Plan"** → AI generates morning/night exercises
3. Check/uncheck exercises → saves automatically
4. Click YouTube icons → opens YouTube search for that exercise
5. Click **"🤖 Next Day"** → AI suggestion modal
6. Click **"📅 Calendar"** → monthly tracking view
7. Click **"🔄 Regenerate"** → create a new plan
