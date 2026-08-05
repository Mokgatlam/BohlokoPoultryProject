# Firebase Setup Guide

This guide will help you configure Firebase for your Chicken Processing Platform.

## Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Go to the "Service accounts" tab
6. Click "Generate new private key"
7. Download the JSON file

## Step 2: Update Your .env File

Open the `.env` file in your project and replace these values:

### Required Values:
- `FIREBASE_PROJECT_ID` = Your Firebase project ID
- `FIREBASE_PRIVATE_KEY_ID` = From the downloaded JSON file
- `FIREBASE_PRIVATE_KEY` = From the downloaded JSON file (replace `\n` with actual newlines)
- `FIREBASE_CLIENT_EMAIL` = From the downloaded JSON file
- `FIREBASE_CLIENT_ID` = From the downloaded JSON file

### Web Configuration:
- `FIREBASE_API_KEY` = Your Firebase API key (found in Project settings > General)
- `FIREBASE_AUTH_DOMAIN` = Your project ID + `.firebaseapp.com`
- `FIREBASE_STORAGE_BUCKET` = Your project ID + `.appspot.com`
- `FIREBASE_MESSAGING_SENDER_ID` = Found in Project settings
- `FIREBASE_APP_ID` = Found in Project settings

## Step 3: Example Configuration

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=my-chicken-app-12345
FIREBASE_PRIVATE_KEY_ID=abc123def456
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=my-app@my-chicken-app-12345.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/my-app%40my-chicken-app-12345.iam.gserviceaccount.com

# Firebase Web/API Configuration
FIREBASE_API_KEY=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI
FIREBASE_AUTH_DOMAIN=my-chicken-app-12345.firebaseapp.com
FIREBASE_DATABASE_URL=https://my-chicken-app-12345-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=my-chicken-app-12345.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
FIREBASE_MEASUREMENT_ID=G-ABC123DEF4
```

## Step 4: Restart Your Server

After updating the .env file:
1. Stop your server (Ctrl+C)
2. Restart it: `npm run dev`
3. Your Firebase integration should now work!

## Troubleshooting

### Common Issues:
1. **Invalid PEM formatted message**: Check your private key format
2. **Missing credentials**: Ensure all required fields are filled
3. **Permission errors**: Make sure your service account has proper Firebase permissions

### Need Help?
- Check the Firebase documentation: https://firebase.google.com/docs
- Verify your service account has Editor permissions
- Ensure your Firebase project has the required APIs enabled

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control!
- Add `.env` to your `.gitignore` file
- Keep your private keys secure
- Use different Firebase projects for development and production
