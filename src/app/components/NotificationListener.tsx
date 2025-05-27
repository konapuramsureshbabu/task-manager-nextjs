'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '../redux/redux-hooks';

export default function NotificationListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let userId: string | null = null;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        userId = decoded.email || decoded.sub || null; // Adjust based on your token structure
        
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Connect to SSE endpoint with userId
    const url = userId ? `/api/notifications/stream?userId=${userId}` : '/api/notifications/stream';
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
    };

    eventSource.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      
      // Dispatch to Redux
      dispatch({
        type: 'sseMessages/addSSEMessage',
        payload: {
          id: notification.id,
          title:notification.title,
          body: notification.body,
          timestamp: notification.createdAt || new Date().toISOString(),
        },
      });
    });

    eventSource.addEventListener('ping', (event) => {
        console.log("e",event);
        
    });

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setTimeout(() => {
      }, 5000);
    };
    // Subscribe user if not already subscribed
    if (userId && token) {
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      })?.catch((error) => console?.error('Error subscribing:', error));
    }


    return () => {
      
      eventSource.close();
    };
  }, [dispatch]);

  return null;
}