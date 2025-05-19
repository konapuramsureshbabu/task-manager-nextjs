'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of tasks, but received: ' + JSON.stringify(data));
      }
      setTasks(data);
      setError(null);
    } catch (error: any) {
      console.error('Fetch tasks error:', error);
      setError(error.message || 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
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
      // Show SweetAlert2 toast for success
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        text: editingTask ? 'Task updated successfully!' : 'Task added successfully!',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        padding: '0.75rem',
        width: 'auto',
        background: '#10b981',
        color: '#ffffff',
      });
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
      // Show SweetAlert2 toast for deletion
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        text: 'Task deleted successfully!',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        padding: '0.75rem',
        width: 'auto',
        background: '#10b981',
        color: '#ffffff',
      });
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

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 animate-pulse"
    >
      {/* Form Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
      {/* Task List Placeholder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold mb-6 text-gray-800 text-center"
      >
        Task Manager
      </motion.h2>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Task Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 bg-white p-6 rounded-lg shadow-lg sticky top-4 z-10"
          >
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                required
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-lg transition-all duration-200 hover:scale-105"
              >
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
                  className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
              )}
            </form>
          </motion.div>

          {/* Task List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {Array.isArray(tasks) && tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(task)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center text-gray-600 py-8"
                >
                  No tasks available. Add a task to get started!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}