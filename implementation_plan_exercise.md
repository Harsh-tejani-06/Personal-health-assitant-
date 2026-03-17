# Exercise Feature Implementation Plan

Build a full exercise tracking feature with AI-generated daily exercise plans (morning/night), daily tracking, next-day suggestions based on previous activity + diet, and YouTube video link suggestions.

## Proposed Changes

### Backend — Model

#### [NEW] [ExercisePlan.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/models/ExercisePlan.js)

New Mongoose model following the [SkinCarePlan](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/services/skinCareService.js#3-8) pattern:

- **exerciseStepSchema**: `step` (number), `name` (string), `instruction` (string), `duration` (string), `sets` (string), `reps` (string), `youtubeUrl` (string — YouTube link for the exercise), `caloriesBurned` (string)
- **dailyLogSchema**: `date` (string), `morningCompleted` (boolean[]), `nightCompleted` (boolean[]), `notes` (string)
- **Main schema**: `user` (ref → User, unique), `plan.morning` (exerciseSteps[]), `plan.night` (exerciseSteps[]), `plan.followFor` (string), `plan.tips` (string[]), `plan.generatedAt` (Date), `plan.basedOnGoal` (string — "weight_loss" or "weight_gain"), `dailyLogs` (dailyLogSchema[])

---

### Backend — Routes

#### [NEW] [exerciseRoutes.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/routes/exerciseRoutes.js)

Following the [skinCareRoutes.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/routes/skinCareRoutes.js) pattern. Endpoints:

1. **GET `/api/exercise/plan`** — Fetch the current exercise plan (returns `{ exists, plan }`)
2. **POST `/api/exercise/plan`** — Generate AI exercise plan using Groq
   - Reads the user's `healthProfile` (primaryGoal, height, weight, activityLevel, ageGroup, gender)
   - Reads the user's latest diet (today's diet from the [Diet](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/components/pages/Diet.jsx#47-593) model) to factor into calorie suggestions
   - Reads recent exercise activity from `DailyActivity` (last 7 days) to check previous activity
   - Builds a detailed prompt asking for morning + night exercises in JSON format
   - Each exercise includes a **YouTube search-friendly name** so the frontend can link to `https://www.youtube.com/results?search_query=...`
   - Parses AI response, upserts `ExercisePlan`
3. **POST `/api/exercise/log`** — Log daily exercise completion (morningCompleted[], nightCompleted[])
4. **GET `/api/exercise/log/:date`** — Get log for a specific date
5. **GET `/api/exercise/calendar`** — Get all logs (last 31 days) for calendar view
6. **POST `/api/exercise/next-day`** — Generate next-day exercise suggestions
   - Reads the previous day's completed exercises from `ExercisePlan.dailyLogs`
   - Reads diet data from [Diet](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/components/pages/Diet.jsx#47-593) model for the previous day
   - Uses Groq to generate exercise adjustments and suggestions
   - Returns a list of suggestions + reasons

#### [MODIFY] [index.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/backend/index.js)

- Import and register `exerciseRoutes` (`app.use("/api", exerciseRoutes)`)

---

### Frontend — Service

#### [NEW] [exerciseService.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/services/exerciseService.js)

API service functions following [skinCareService.js](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/services/skinCareService.js) pattern:
- `getExercisePlan()` — GET `/exercise/plan`
- `generateExercisePlan()` — POST `/exercise/plan`
- `logExerciseTask(date, morningCompleted, nightCompleted)` — POST `/exercise/log`
- `getExerciseLog(date)` — GET `/exercise/log/:date`
- `getExerciseCalendar()` — GET `/exercise/calendar`
- `getNextDaySuggestions()` — POST `/exercise/next-day`

---

### Frontend — Exercise Page

#### [MODIFY] [Exercise.jsx](file:///c:/Users/Dell/Desktop/Mini%20Project/Code/frontend/src/components/pages/Exercise.jsx)

Complete rewrite of the stub. Views:

1. **Loading** — Spinner while checking for existing plan
2. **Generate Plan** — Button to generate AI exercise plan (no product onboarding needed — just uses user's health profile)
3. **Daily Routine View** — Morning + Night exercise cards with checkboxes, progress bar, YouTube links per exercise, day navigation
4. **Next Day Suggestions** — A section/modal showing AI-suggested adjustments based on previous day's activity + diet
5. **Calendar View** — Monthly grid showing completion status (complete ✅ / partial 🟡 / none —)

Design language:
- Gradient headers: blue-to-cyan theme (distinct from pink/rose SkinCare)
- Exercise-specific emojis: 🏋️ 💪 🧘 🏃
- YouTube links as clickable badges on each exercise step
- Premium feel matching existing SkinCare/Diet pages

## Verification Plan

### Manual Verification

Since this project has no test framework set up, verification will be manual:

1. **Start the backend**: `node index.js` from `backend/` directory
2. **Start the frontend**: `npm run dev` from `frontend/` directory
3. **Login** to the app with an existing account
4. **Navigate to `/exercise`** and verify:
   - The "Generate Exercise Plan" button is visible
   - Click it to generate a plan — verify AI plan loads with morning + night exercises
   - Each exercise should have a YouTube link button
   - Check/uncheck exercises and verify they save
   - Navigate between days using the arrows
   - Open Calendar view and verify it shows completion status
   - Click "Next Day Suggestions" and verify AI suggestions appear
5. **Test with different user goals**: Verify that a user with `weight_loss` gets different exercises than one with `weight_gain`
