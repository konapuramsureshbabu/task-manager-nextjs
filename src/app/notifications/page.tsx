'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function NotificationsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verify admin role and fetch user emails
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.role !== 'admin') {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/allusers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmails(data.emails);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleSendNotification = async (userId: string) => {
    const result = await Swal.fire({
      title: 'Send Notification',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Title" required>
        <textarea id="swal-body" class="swal2-textarea" placeholder="Message" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Send',
      preConfirm: () => {
        const title = (document.getElementById('swal-title') as HTMLInputElement).value;
        const body = (document.getElementById('swal-body') as HTMLTextAreaElement).value;
        if (!title || !body) {
          Swal.showValidationMessage('Title and message are required');
          return false;
        }
        return { title, body };
      },
    });

    if (result.isConfirmed) {
      const { title, body } = result.value;
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, title, body }),
        });

        if (response.ok) {
          await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            text: 'Notification sent successfully',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            padding: '0.75rem',
            width: 'auto',
            background: '#10b981',
            color: '#ffffff',
          });
        } else {
          await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            text: 'Failed to send notification',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.error('Error sending notification:', error);
        await Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          text: 'Error sending notification',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Send Notification</h1>

      {isLoading ? (
        <p>Loading users...</p>
      ) : emails.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul className="space-y-4">
          {emails.map((email) => (
            <li key={email} className="flex items-center justify-between p-3 border rounded-md">
              <span>{email}</span>
              <button
                onClick={() => handleSendNotification(email)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Notification
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}