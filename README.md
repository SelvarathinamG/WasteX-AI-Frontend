# WasteX AI

**AI-Enabled Smart Waste Segregation and Resource Recovery System**

A software-first municipal waste-operations platform: role-based dashboards for
Admin, Collector, and Vendor, a Leaflet map for creating and monitoring smart
bins, a 2D digital-twin simulator that stands in for real IoT hardware, and a
Firebase Realtime Database backing every number on screen. Nothing here is
static — every count, marker, and chart is a live listener on real data.

---

## 1. Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Map:** Leaflet + OpenStreetMap (via `react-leaflet`)
- **Charts:** Recharts
- **Icons:** lucide-react
- **Backend:** Firebase Authentication + Firebase Realtime Database

## 2. Project structure

```
src/
  components/    Sidebar, Topbar, StatCard, SmartBinCard, SmartBinMap,
                 CreateBinModal, BinSimulator, CollectorTable, VehicleTable,
                 VendorTable, PriorityQueue, WasteChart, InventoryChart,
                 StatusBadge, ProtectedRoute, ConfirmDialog, Toast
  pages/         Login, VendorRegister, AdminDashboard (+ admin/* subpages),
                 CollectorDashboard, VendorDashboard
  firebase/      config.js, auth.js, database.js
  services/      binService, collectorService, vehicleService, vendorService,
                 collectionService, simulationService, seedService
  utils/         priority.js, validation.js, formatting.js
  context/       AuthContext.jsx
database.rules.json   Documented, production-ready Realtime Database rules
.env.example           Firebase environment variable template
```

## 3. Setup instructions

**Step 1 — Install Node.js**
Node.js 18+ is required. Verify with `node -v`.

**Step 2 — Install dependencies**
```bash
npm install
```

**Step 3 — Create a Firebase project**
Go to the [Firebase console](https://console.firebase.google.com/) and create
a new project.

**Step 4 — Register a Web App**
In your Firebase project, click the **Web** (`</>`) icon to register a new web
app. Firebase will show you a config object — you'll need these values in
Step 7.

**Step 5 — Enable Authentication**
In the console, go to **Build → Authentication → Sign-in method** and enable
**Email/Password**. (WasteX AI maps human usernames like `arun01` to
`arun01@wastex.local` internally — see `src/firebase/auth.js`.)

**Step 6 — Create a Realtime Database**
Go to **Build → Realtime Database → Create Database**. Choose a region close
to your users (the app defaults to Puducherry / Madukarai on the map, but the
database region is independent of that).

**Step 7 — Configure environment variables**
```bash
cp .env.example .env.local
```
Fill in every `VITE_FIREBASE_*` value from your Step 4 config object. Never
hardcode these inside components — everything reads from `import.meta.env`.

**Step 8 — Add Firebase rules**
Copy the contents of `database.rules.json` into **Realtime Database → Rules**
in the Firebase console and publish. (For a quick local prototype only, you
can temporarily use `{ "rules": { ".read": true, ".write": true } }`, but do
not ship that.)

**Step 9 — Run the app**
```bash
npm run dev
```

**Step 10 — Open the app**
Visit **http://localhost:5173**

## 4. First run: seed demo data

On the login screen, click **"First time here? Seed demo data"**. This writes
real records into your Firebase project:

- 1 admin account — `Selva` / `selva2005`
- 6 smart bins across Puducherry/Madukarai, each with independent
  fill % and weight per compartment
- 4 vehicles — `PLASTIC-01`, `PAPER-01`, `METAL-01`, `ORGANIC-01`
- 4 collectors, one per waste class, each pre-assigned to a vehicle
  (e.g. `arun01` / `arun123` → Plastic → `PLASTIC-01`)
- 4 vendors, one per recovery type (Plastic/Paper/Metal Recycler, Biogas
  Station), each with a self-registered-style login
- Starting regional waste inventory for the Madukarai region

Collector and vendor credentials are listed in
`src/services/seedService.js` if you need to look them up again.

## 5. How the core workflow actually works

```
Admin login (Selva / selva2005)
  → Admin Dashboard → Smart Bins → "+ Add Smart Bin"
  → Map renders INSIDE the creation modal
  → Admin clicks a location → lat/lng captured → marker placed
  → Admin fills Bin ID / Name / Region → "Create Smart Bin"
  → A real record is written to Firebase at bins/{binId}
  → Marker appears immediately on every open map (realtime listener)
  → Admin opens 2D Simulator → selects the bin
  → Drags fill / weight sliders → "Apply values" → Firebase updates
  → Bin status recalculates (NORMAL/MEDIUM/HIGH/CRITICAL) everywhere at once
  → Collector (scoped to one waste class) logs in
  → Sees only their class's bins, sorted by priority score
  → Advances the job: Dispatch → In transit → Arrived → Collecting → Collect
  → Collector location and vehicle load update in real time; unload resets the load
  → Collecting empties the bin compartment and credits regional inventory
  → Vendor dashboard shows the new material available, and can claim/dispatch it
  → Admin verifies new vendor registrations before dispatch access is enabled
```

No step in this chain is hardcoded — every arrow above is a Firebase write
followed by a listener update.

## 6. Waste-class isolation

Collectors are **only** ever created by an Admin (never self-service).
Each collector document stores a single `wasteClass`, and the collector
dashboard's priority queue is built exclusively from that class's
compartment data (`buildPriorityQueue` in `src/utils/priority.js`). A Plastic
collector will never see a Paper, Metal, or Organic job.

## 7. Priority scoring (initial implementation)

```
priorityScore = (fillPercent × 0.5) + (normalizedWeight × 0.3) + (waitingFactor × 0.2)
```

This lives entirely in `src/utils/priority.js` so it can be swapped for a
Genetic Algorithm, Ant Colony Optimization, or a PPO/DQN policy later without
touching any UI component.

## 8. Designed for hardware & AI you don't have yet

- **IoT:** The 2D simulator (`src/services/simulationService.js`) writes to
  the exact same `bins/{id}/compartments/{type}` schema that a real ESP32 +
  ultrasonic + HX711 load cell + DHT22 + MQ135 rig would write to. Swap the
  simulator for real sensor firmware and the dashboards don't change.
- **AI classification:** The schema already has one compartment per waste
  class. A future YOLOv11 camera pipeline only needs to write classification
  results into the same structure.
- **Route optimization:** `buildPriorityQueue` combines bin priority with
  distance from the live vehicle position and returns the next recommended stop.

## 9. Known prototype limitations (documented, not hidden)

- Collector/vendor account creation happens client-side using a short-lived
  secondary Firebase App instance so the Admin's session isn't disrupted.
  A full production deployment should move this to a Cloud Function using
  the Firebase Admin SDK.
- Deleting a collector removes their profile/assignment but not their
  underlying Firebase Auth account (client SDKs can't delete other users'
  accounts without the Admin SDK).
- `database.rules.json` is a solid, documented starting point, not a final
  security audit — review it against your deployment before going live.

## 10. Acceptance test checklist

- [ ] Sign in as `Selva` / `selva2005` → Admin dashboard loads
- [ ] Add Smart Bin by clicking the map → record appears in Firebase, marker renders immediately
- [ ] Simulator: raise Organic to 95% / 30kg → bin status flips to CRITICAL everywhere
- [ ] Create collector "Arun" on Organic + `ORGANIC-01` → account + profile created
- [ ] Log out, log in as that collector → only Organic jobs are visible
- [ ] Collect the bin → compartment resets to 0/0, inventory increases
- [ ] Register a new vendor → can log in independently, sees Admin-only nothing
- [ ] Admin Vendors → Verify the pending vendor before dispatch access is enabled
- [ ] Vendor dashboard shows the updated organic material availability
- [ ] Admin dashboard reflects every change above without a page refresh
