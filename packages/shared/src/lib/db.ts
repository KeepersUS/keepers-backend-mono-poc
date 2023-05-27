import { firestore } from 'firebase-admin';

import {
  Property,
  Task,
  Job,
  BackgroundCheck,
  Reservation,
  User,
  Email,
  Review,
  Push,
  MessageQueueItem,
  Discord,
  Organization,
  Image,
  Pricing,
  ProblemReport,
  Transaction,
  Checklist,
  Zips,
  SMSMessage,
} from '@usekeepers/keepers-shared';

import { RegisterCollection } from './dbbuilder';

/*
Import all interface types here
*/

/**
 * Register our collections here. Add a new property for each new colletion to be used throughout the app.
 */
export const db = {
  createBatch: () => firestore().batch(),
  getTime: () => firestore.Timestamp.now(),
  jobs: new RegisterCollection<Job>('jobs'),
  zips: new RegisterCollection<Zips>('zips'),
  delete: () => firestore.FieldValue.delete(),
  users: new RegisterCollection<User>('users'),
  images: new RegisterCollection<Image>('images'),
  tasks: new RegisterCollection<Task>('syncTasks'),
  reviews: new RegisterCollection<Review>('reviews'),
  pricing: new RegisterCollection<Pricing>('pricing'),
  properties: new RegisterCollection<Property>('properties'),
  getDate: () => new Date(firestore.Timestamp.now().toDate()),
  checklists: new RegisterCollection<Checklist>('checklistItems'),
  reservations: new RegisterCollection<Reservation>('reservations'),
  transactions: new RegisterCollection<Transaction>('transactions'),
  increment: (value: number) => firestore.FieldValue.increment(value),
  smsNotifications: new RegisterCollection<SMSMessage>('smsMessages'),
  pushNotifications: new RegisterCollection<Push>('pushNotifications'),
  organizations: new RegisterCollection<Organization>('organizations'),
  messageQueue: new RegisterCollection<MessageQueueItem>('messageQueue'),
  problemReports: new RegisterCollection<ProblemReport>('problemReports'),
  emailNotifications: new RegisterCollection<Email>('emailNotifications'),
  discordNotifications: new RegisterCollection<Discord>('discordNotifications'),
  backgroundChecks: new RegisterCollection<BackgroundCheck>('backgroundChecks'),
  deletionRequests: new RegisterCollection<{ email: string; uid: string }>(
    'deletionRequests'
  ),
};
