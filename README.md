# ApexLift ⚡
> **"Show up. Level up."**

ApexLift is a mobile-first, dark-themed, RPG-style workout consistency web application built for gym-goers who struggle to stay consistent. 

The core rule: **XP rewards SHOWING UP, never lifting heavier. No XP is ever tied to the weight lifted.**

---

## 🎨 Brand & Design System

- **Name**: ApexLift
- **Tagline**: *"Show up. Level up."*
- **Official Icon**: Rounded-square in Ember red (`#E02A1F`) with a white "A" peak (chevron summit) and a horizontal barbell bar with plates through the crossbar.
- **Wordmark**: `APEX` in white + `LIFT` in Ember Hot (`#FF5A4D`).
- **Color Palette**:
  - `Void` (`#0B0B0C`): App canvas background
  - `Carbon` (`#141416`): Cards & elevated surfaces
  - `Steel` (`#2A2A30`): 1px borders & dividers
  - `Ember` (`#E02A1F`): Primary action buttons & badges (white text)
  - `Ember Hot` (`#FF5A4D`): Accents, active indicators & links
  - `XP Gold` (`#F5B53C`): Exclusively for XP, character levels & Personal Records
  - `Streak Green` (`#34D27B`): Consistency wins, streaks & active progress
  - `Chalk` (`#F4F4F5`): Primary typography
  - `Muted` (`#9A9AA3`): Secondary hints, units & timestamps
- **Typography**: `Barlow Condensed 700` uppercase for headlines, badges, numbers & levels; `Inter` for clean body text.
- **Components**: Cards have 1px Steel borders and 14px radius (`rounded-card`). All interactive buttons are min 48px tall.

---

## 🎮 The XP Engine (Exact Implementation)

Daily XP is calculated as:
$$\text{XP per day} = \min\left( (\text{Base} + \text{Bonuses}) \times \text{StreakMult} \times \text{StateMult} \times \text{ComebackMult},\, 300 \right)$$

### 1. Base XP (Once per day)
- **Full Workout** (15+ min or gym check-in): `100 XP`
- **Mini Session** (At least 1 set on low motivation days): `40 XP`
- **Daily Ready Check**: `+10 XP`
- **Completed Planned Session from Program**: `+25 XP`

### 2. Bonuses
- **New Personal Record**: `+50 XP` *(max 2 per session)*
- **New Exercise Tried**: `+15 XP` *(max 2 per week)*
- **Weekly Session Target Hit**: `+150 XP` *(once per week)*
- **Weekly Quest Cleared**: `+100 XP` *(once per week)*
- **First Workout Ever**: `+200 XP` *(one-time achievement)*

### 3. Multipliers
- **StreakMult**: $1 + 0.05 \times \text{weeks\_in\_streak}$ *(capped at $1.5\times$)*
- **StateMult**: $1.5\times$ applied to Base if user checked in "Low energy" and still showed up and trained!
- **ComebackMult**: $2.0\times$ for the first 3 sessions after being inactive for 5+ days.
- **Second Session Rule**: A second session logged on the same day earns only 25% XP.
- **Plausibility Check**: Weight jumps $>50\%$ and $>50\text{kg}$ from previous PR or $>600\text{kg}$ are flagged to protect leaderboard integrity.

### 4. Level Curve
$$\text{XP needed from Level } L \text{ to } L+1 = \text{round}(50 \times L^{1.5}) \quad (\text{Max level 50})$$
Every XP gain is persisted to MongoDB as an immutable `xp_events` record.

### 5. Character Classes & Attribute Radar
Each logged exercise feeds character stats (0-100):
- Heavy compound lifts $\to$ **STR**
- Cardio, high reps & circuits $\to$ **END**
- Unilateral, plyometrics & core $\to$ **AGI**
- Sleep & daily check-ins $\to$ **VIT**
- Consistency & weekly streak targets $\to$ **DISCIPLINE**

After 10 workouts, a class specialization is awarded based on highest stat:
- **Powerlifter** (High STR)
- **Ranger** (High END)
- **Berserker** (High AGI)
- **Monk** (High VIT / DISCIPLINE)

---

## 📱 Core Features

1. **Dashboard (Home)**:
   - Hero: Avatar with XP Gold circular level ring, class title, XP bar (`2,840 / 3,300 XP`), weekly streak badge, streak freezes shield count.
   - "Next Best Action" recommendation card with 1-click Start Workout or Mini Session.
   - Daily Ready Check: Energized / Okay / Low Energy (+10 XP).
   - Attribute radar chart (STR, END, AGI, VIT, DISCIPLINE) with personalized hint for the weakest stat.
   - Current goal progress ring (e.g. 140kg deadlift).
   - Weekly stats: Volume tonnage, Consistency %, recent workouts feed, PR badges.
2. **Log Workout**:
   - 40+ seeded exercises categorized and tagged by attribute (STR, END, AGI).
   - Dynamic sets x reps x weight input with duplicate set and RPE tracking.
   - Mini session toggle for low motivation days (at least 1 set to protect streak).
   - Animated reward screen with XP breakdown, level-up celebration and PR fanfare.
3. **Progress**:
   - Recharts visual volume trend chart (7d / 4w / 3m toggle).
   - Consistency % output area chart.
   - Top working weight progression per exercise with dropdown filter.
   - Complete Personal Record hall of fame.
4. **My Plans**:
   - 3 structured templates: *Starter Strength (8 Weeks)*, *Push / Pull / Legs (PPL)*, and *Full Body 3-Day Protocol*.
   - Track active week & day progress; train planned sessions for `+25 XP` bonus.
5. **Quests & Boss Raids**:
   - Daily micro-habits ("Daily Ready Check", "Claim The Bar", "Uncharted Territory").
   - Weekly target quest ("Hit 4 sessions this week" $\to$ reward XP + 1 Streak Freeze).
   - Monthly season raid boss: *Titan of Inertia* with dynamic HP health bar.
   - Comeback Quest: *The Return* with $2.0\times$ multiplier if inactive for 5+ days.
6. **League & Friends**:
   - Weekly ranked tiers: *Bronze, Silver, Gold, Platinum, Diamond, Apex*.
   - Ranked strictly by Consistency Score (sessions + showing up XP), never weight lifted!
   - Top 3 promoted (green line), bottom 3 demoted (red line).
   - Add friends by username and view friends-only circle leaderboard.
   - 15 seeded competitors.
7. **Settings**:
   - Weekly session target slider (2 to 6 days).
   - Measurement unit toggle (`kg` $\leftrightarrow$ `lbs`).
   - Goal description & experience level customization.
   - 1-click restore demo user (Jordan Davis).

---

## 🚀 Quickstart & Setup

### Requirements
- Python 3.10+ (uv or venv)
- Node.js 18+ (bundled in `tools/node/`)
- MongoDB (automatic fallback to in-memory `mongomock` if local MongoDB is not running)

### 1. Run the Backend & Full-Stack App
```powershell
# Activate Python environment
.\.venv\Scripts\activate

# Run the unified server (serves API & built React frontend on port 8000)
python run.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### 2. Demo User Credentials
- **Email**: `jordan@apexlift.app`
- **Password**: `password123`
*(Or click the 1-click "Demo Login" button on the sign-in screen)*

Profile details:
- Level 12 Berserker
- 6-week streak ($1.3\times$ XP multiplier)
- 2 Streak Freezes available
- 3 weeks of rich historical workouts, volume, and personal records

### 3. Run Unit & Integration Tests
```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\pytest.exe backend/tests -v
```
All 20 unit and integration tests verify:
- Exact XP formulas, caps, and multipliers
- Level curve formulas from level 1 to 50
- Weight plausibility validation
- Character class assignment
- All API router endpoints and data structures

---

## 📂 Project Structure

```
ApexLift/
├── backend/
│   ├── app/
│   │   ├── auth.py              # JWT authentication & bcrypt password hashing
│   │   ├── config.py            # JWT secret, algorithm & DB config
│   │   ├── database.py          # MongoDB client with instant MongoMock fallback
│   │   ├── main.py              # FastAPI application & static mount
│   │   ├── seed_data.py         # 40 exercises, 3 programs, 15 league users, Jordan Davis
│   │   ├── xp_engine.py         # Exact RPG XP calculation engine & level curves
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── auth.py          # Sign in, register, me, demo login
│   │       ├── dashboard.py     # Hero, radar, quests, weekly stats, next best action
│   │       ├── workouts.py      # Workout logging, PR detection, XP events
│   │       ├── quests.py        # Daily, weekly, monthly boss & comeback quests
│   │       ├── plans.py         # Starter Strength, PPL, Full Body protocols
│   │       ├── progress.py      # Volume, consistency, exercise progression charts
│   │       ├── league.py        # Weekly tier leaderboard & friends circle
│   │       └── settings.py      # Targets, units (kg/lbs), energy check-in
│   └── tests/
│       ├── test_xp_engine.py    # 11 XP engine and level curve unit tests
│       └── test_api.py          # 9 full API router integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Logo.jsx         # Official Ember chevron barbell logo & wordmark
│   │   │   ├── LevelRing.jsx    # XP Gold circular SVG progress ring & streak badge
│   │   │   ├── Navbar.jsx       # Top sticky header with quick stats
│   │   │   ├── BottomNav.jsx    # Mobile-first bottom navigation bar
│   │   │   └── RewardModal.jsx  # Subtle animated XP gain & level-up fanfare
│   │   ├── screens/
│   │   │   ├── DashboardScreen.jsx
│   │   │   ├── WorkoutScreen.jsx
│   │   │   ├── ProgressScreen.jsx
│   │   │   ├── PlansScreen.jsx
│   │   │   ├── QuestsScreen.jsx
│   │   │   ├── LeagueScreen.jsx
│   │   │   ├── SettingsScreen.jsx
│   │   │   └── AuthScreen.jsx
│   │   ├── api.js               # Clean fetch client with JWT token management
│   │   ├── icons.jsx            # Lucide SVG line icons
│   │   ├── index.css            # Tailwind directives, Void dark theme & glow utilities
│   │   └── App.jsx              # Main React state container & tab routing
│   ├── package.json
│   ├── tailwind.config.js       # Void, Carbon, Steel, Ember, Gold, Streak colors
│   └── vite.config.js
├── tools/node/                  # Standalone portable Node.js runtime
├── run.py                       # Single-command launcher script
└── README.md
```
