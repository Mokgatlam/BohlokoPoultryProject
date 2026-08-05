# Firebase Emulator Setup for Chicken Processing System

## Problem
Firestore requires billing to be enabled on the Google Cloud project, which may not be available or desired for development.

## Solution
Use Firebase Emulator Suite for local development. This provides:
- Full Firestore functionality locally
- No billing required
- Faster development cycles
- Isolated testing environment

## Setup Instructions

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Start the Firebase Emulators
```bash
npm run emulators:start
```

This will start:
- Firestore emulator on port 8080
- Emulator UI on port 4000

### 3. Initialize Emulator with Sample Data
In a new terminal:
```bash
npm run emulators:init
```

### 4. Configure Your Application
Update your application to use the emulator:

```javascript
// In your Firebase configuration
if (process.env.NODE_ENV === 'development') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}
```

### 5. Run Your Application
```bash
npm run dev:with-emulator
```

Or manually:
```bash
# Terminal 1: Start emulators
npm run emulators:start

# Terminal 2: Start your application
node run-server.js
```

## Access Points

- **Emulator UI**: http://localhost:4000
- **Firestore**: localhost:8080
- **Your Application**: http://localhost:3000 (or configured port)

## Features

✅ **Full Firestore functionality** - All CRUD operations work locally
✅ **No billing required** - Completely free for development
✅ **Persistent data** - Data persists between emulator sessions
✅ **Security rules testing** - Test your security rules locally
✅ **Import/export data** - Easily backup and restore test data

## Switching to Production

When ready to deploy to production:

1. Enable billing on your Google Cloud project
2. Create Firestore database in Firebase Console
3. Update environment variables to use production project
4. Update security rules for production

## Troubleshooting

### Emulator won't start
- Ensure Firebase CLI is installed: `firebase --version`
- Check if ports 8080 and 4000 are available

### Application can't connect to emulator
- Verify emulator is running: `firebase emulators:list`
- Check environment variables are set correctly

### Data not persisting
- Emulator data is stored in `.firebase/` directory
- Use `firebase emulators:export` and `firebase emulators:import` to manage data

## Next Steps

1. Start the emulators: `npm run emulators:start`
2. Initialize with sample data: `npm run emulators:init`
3. Run your application: `node run-server.js`
4. Access the emulator UI at http://localhost:4000
