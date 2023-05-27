// The Firebase Admin SDK to access Firebase Features from within Cloud Functions.
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { onCall, onRequest } from 'firebase-functions/v2/https';

import { getUser } from './users';

admin.initializeApp();

// Set up extra settings. Since May 29, 2020, Firebase Firebase Added support for
// calling FirebaseFirestore.settings with { ignoreUndefinedProperties: true }.
// When this parameter is set, Cloud Firestore ignores undefined properties
// inside objects rather than rejecting the API call.
admin.firestore().settings({
  ignoreUndefinedProperties: true,
});

export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send(`Hello from Firebase! is 2 even`);
});

export const helloWorld2 = onCall((request) => {
  console.log(request.data);
  console.log(request.auth);
  if (!request.auth) {
    return 'no user';
  }
  return 'Hello from Firebase! is 2 even';
});

export const getUserCallable = onCall(getUser);
