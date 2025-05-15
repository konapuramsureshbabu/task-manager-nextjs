'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user data
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setUser(data);
      setName(data.name);
      setError(null);
    } catch (error: any) {
      console.error('Fetch user error:', error);
      setError(error.message || 'Failed to fetch user data');
    }
  };

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const updateData: { name?: string; password?: string } = {};
      if (name && name !== user?.name) updateData.name = name;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        setError('No changes to update');
        return;
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setName(updatedUser.name);
      setPassword('');
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  return (
    <div className="container mx-auto bg-white p-6 rounded-lg shadow-md max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Profile</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {!user ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">User Information</h3>
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Name:</span> {user.name}
            </p>
          </div>

          {/* Update Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password (optional)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full"
            >
              Update Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}