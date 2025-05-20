/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { useAppDispatch } from '../redux/redux-hooks';
import { addNotification ,clearNotifications} from '../redux/slices/notificationSlice';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
console.log('Firebase initialized:', app.name);

let messaging:any;
try {
  messaging = getMessaging(app);
  console.log('Messaging initialized:', !!messaging);
} catch (error) {
  console.error('Error initializing messaging:', error);
}

interface Notification {
  title: string;
  body: string;
  timestamp: string;
}

const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        if (permission === 'granted') {
          console.log('Notification permission granted');
          if (!messaging) {
            console.error('Messaging not initialized');
            return;
          }
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });
          console.log('FCM Token:', token);

          let userId = 'default-user';
          const jwtToken = localStorage.getItem('token');
          if (jwtToken) {
            try {
              const decoded = JSON.parse(atob(jwtToken.split('.')[1]));
              userId = decoded.email || decoded.sub || 'default-user';
              console.log('Derived userId from JWT:', userId);
            } catch (error) {
              console.error('Error decoding JWT token:', error);
            }
          }

          console.log('Subscribing token with userId:', userId);
          const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, userId }),
          });
          if (response.ok) {
            console.log('Token subscribed successfully');
          } else {
            console.error('Failed to subscribe token:', await response.text());
          }
        } else {
          console.warn('Notification permission denied');
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    if (messaging) {
      console.log('Setting up onMessage handler...');
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        const notification: Notification = {
          title: payload.notification?.title || 'No Title',
          body: payload.notification?.body || 'No Body',
          timestamp: new Date().toISOString(),
        };
        console.log('Dispatching notification:', notification);
        dispatch(addNotification(notification));
      });

      return () => {
        console.log('Unsubscribing onMessage handler');
        unsubscribe();
      };
    }
  }, [dispatch]);

  return <>{children}</>;
};

export default PushNotificationProvider;

// Export clearNotifications for use in RootLayout
export { clearNotifications };