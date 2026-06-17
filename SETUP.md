# Leave Management System - Setup Instructions

## Adsul's Technical Campus

### Prerequisites
- **Node.js** (v18 or later): https://nodejs.org/
- **npm** (comes with Node.js)

### Quick Start

1. **Install all dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Seed the database** (creates tables and sample data):
   ```bash
   cd backend && node seed.js
   ```

3. **Start the backend server** (terminal 1):
   ```bash
   cd backend && node server.js
   ```
   Server runs on http://localhost:5000

4. **Start the frontend dev server** (terminal 2):
   ```bash
   cd frontend && npm run dev
   ```
   App opens at http://localhost:3000

### Login Credentials (after seeding)

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@adsl.edu.in   | password123 |
| Faculty | sharma@adsl.edu.in  | password123 |
| Faculty | patil@adsl.edu.in   | password123 |
| Student | rahul@adsl.edu.in   | password123 |
| Student | priya@adsl.edu.in   | password123 |
| Student | amit@adsl.edu.in    | password123 |
| Student | sneha@adsl.edu.in   | password123 |

### Project Structure

```
Leave Management System/
├── backend/
│   ├── server.js          # Express server entry point
│   ├── seed.js            # Database seeder
│   ├── config/database.js # SQLite setup & schema
│   ├── middleware/auth.js  # JWT authentication
│   ├── routes/
│   │   ├── auth.js        # Login/Register endpoints
│   │   ├── leaves.js      # Leave CRUD endpoints
│   │   └── ai.js          # AI feature endpoints
│   └── services/
│       └── aiService.js   # AI-powered analysis
├── frontend/
│   └── src/
│       ├── App.jsx        # Root component with routing
│       ├── context/       # Auth state management
│       ├── pages/         # All page components
│       ├── components/    # Reusable components
│       └── api/           # API client
└── SETUP.md
```

### AI Features

1. **Leave Reason Analyzer** - Suggests leave type based on reason text using keyword matching
2. **Pattern Detection** - Analyzes leave history for suspicious patterns (frequent Monday/Friday leaves, long leaves, high frequency)
3. **Smart Recommendations** - Monitors leave balance usage and provides alerts
4. **AI-Comment Generation** - Generates professional approval/rejection comments for faculty
5. **Department Statistics** - Admin dashboard with department-wise analytics
