'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';

interface Task {
  _id: string;
  title: string;
  description: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Fetched tasks:', data);
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of tasks, but received: ' + JSON.stringify(data));
      }
      setTasks(data);
      setError(null);
    } catch (error: any) {
      console.error('Fetch tasks error:', error);
      setError(error.message || 'Failed to fetch tasks');
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const method = editingTask ? 'PUT' : 'POST';
    const url = editingTask ? `/api/tasks/${editingTask._id}` : '/api/tasks';
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error('Failed to save task');
      setTitle('');
      setDescription('');
      setEditingTask(null);
      fetchTasks();
      setError(null);
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to save task');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      fetchTasks();
      setError(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError(error.message || 'Failed to delete task');
    }
  };

  const handleEdit = (task: Task): void => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
  };

  return (
    <div className="container mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Tasks</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task Title"
          className="border p-2 rounded flex-1"
          required
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task Description"
          className="border p-2 rounded flex-1"
          required
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
          {editingTask ? 'Update Task' : 'Add Task'}
        </button>
        {editingTask && (
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setTitle('');
              setDescription('');
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>
      <ul className="space-y-4">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          tasks.map((task) => (
            <li
              key={task._id}
              className="border p-4 rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100"
            >
              <div>
                <h3 className="font-bold text-gray-800">{task.title}</h3>
                <p className="text-gray-600">{task.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-600">No tasks available</p>
        )}
      </ul>
    </div>
  );
}