/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Task {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "pending" | "in-progress" | "completed";
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

type DashboardTab = "tasks" | "analytics" | "models" | "chat";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">(
    "pending"
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("tasks");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isClusteringModalOpen, setIsClusteringModalOpen] = useState(false);
  useEffect(() => {
    fetchTasks();
    // Initialize with a welcome message
    setChatMessages([
      {
        id: "1",
        text: "Hello! I'm your Data Science Assistant. How can I help you with your tasks today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const fetchTasks = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(
          "Expected an array of tasks, but received: " + JSON.stringify(data)
        );
      }
      setTasks(data);
      setError(null);
    } catch (error: any) {
      console.error("Fetch tasks error:", error);
      setError(error.message || "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const method = editingTask ? "PUT" : "POST";
    const url = editingTask ? `/api/tasks/${editingTask._id}` : "/api/tasks";
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, status }),
      });
      if (!res.ok) throw new Error("Failed to save task");
      setTitle("");
      setDescription("");
      setStatus("pending");
      setEditingTask(null);
      fetchTasks();
      setError(null);
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        text: editingTask
          ? "Task updated successfully!"
          : "Task added successfully!",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        padding: "0.75rem",
        width: "auto",
        background: "#10b981",
        color: "#ffffff",
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      setError(error.message || "Failed to save task");
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete task");
      fetchTasks();
      setError(null);
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        text: "Task deleted successfully!",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        padding: "0.75rem",
        width: "auto",
        background: "#10b981",
        color: "#ffffff",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete task");
    }
  };

  const handleEdit = (task: Task): void => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: "user",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I've analyzed your task data and found some interesting patterns.",
        "Based on your task completion history, you're most productive in the mornings.",
        "Would you like me to generate a report on your task completion rates?",
        "I notice you have several pending tasks. Would you like help prioritizing them?",
        "Your task completion rate has improved by 15% compared to last month!",
      ];

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        sender: "ai",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
      setIsChatLoading(false);
    }, 1000);
  };

  // Generate analytics data
  const getTaskStatusData = () => {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: ["Pending", "In Progress", "Completed"],
      datasets: [
        {
          label: "Tasks by Status",
          data: [
            statusCounts["pending"] || 0,
            statusCounts["in-progress"] || 0,
            statusCounts["completed"] || 0,
          ],
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(75, 192, 192, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getTaskCompletionTrend = () => {
    // Group tasks by creation date
    const dailyCounts = tasks.reduce((acc, task) => {
      const date = new Date(task.createdAt).toLocaleDateString();
      acc[date] = acc[date] || { total: 0, completed: 0 };
      acc[date].total++;
      if (task.status === "completed") acc[date].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const dates = Object.keys(dailyCounts).sort();
    const completionRates = dates.map((date) => {
      return (dailyCounts[date].completed / dailyCounts[date].total) * 100;
    });

    return {
      labels: dates,
      datasets: [
        {
          label: "Completion Rate (%)",
          data: completionRates,
          fill: false,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
      ],
    };
  };

  const getTaskLengthDistribution = () => {
    const lengthGroups = {
      "Short (<10 chars)": 0,
      "Medium (10-20 chars)": 0,
      "Long (>20 chars)": 0,
    };

    tasks.forEach((task) => {
      const length = task.title.length;
      if (length < 10) lengthGroups["Short (<10 chars)"]++;
      else if (length <= 20) lengthGroups["Medium (10-20 chars)"]++;
      else lengthGroups["Long (>20 chars)"]++;
    });

    return {
      labels: Object.keys(lengthGroups),
      datasets: [
        {
          label: "Task Title Length Distribution",
          data: Object.values(lengthGroups),
          backgroundColor: [
            "rgba(255, 159, 64, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(201, 203, 207, 0.5)",
          ],
          borderColor: [
            "rgba(255, 159, 64, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(201, 203, 207, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 animate-pulse"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold mb-6 text-gray-800 text-center"
      >
        Data Science Task Dashboard
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

      {/* Dashboard Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["tasks", "analytics", "models", "chat"] as DashboardTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </nav>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-8">
          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4">Add/Edit Task</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter task title"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter task description"
                      rows={3}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      {editingTask ? "Update Task" : "Add Task"}
                    </button>
                    {editingTask && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(null);
                          setTitle("");
                          setDescription("");
                          setStatus("pending");
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>

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
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {task.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{task.description}</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Created:{" "}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
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

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4">
                  Task Status Distribution
                </h3>
                <div className="h-64">
                  <Pie data={getTaskStatusData()} />
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <h3 className="text-xl font-semibold mb-4">
                    Completion Trend
                  </h3>
                  <div className="h-64">
                    <Line data={getTaskCompletionTrend()} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-6 rounded-lg shadow-lg"
                >
                  <h3 className="text-xl font-semibold mb-4">
                    Title Length Distribution
                  </h3>
                  <div className="h-64">
                    <Bar data={getTaskLengthDistribution()} />
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Models Tab */}
          {activeTab === "models" && (
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4">
                  Task Completion Predictor
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-gray-700 mb-4">
                    This model predicts the likelihood of task completion based
                    on historical patterns.
                  </p>
                  <div className="h-64 flex items-center justify-center bg-white rounded border border-gray-200">
                    <p className="text-gray-500">
                      Model visualization would appear here
                    </p>
                  </div>
                </div>
                <button
                  data-modal-target="prediction-modal"
                  data-modal-toggle="prediction-modal"
                  onClick={() => setIsPredictionModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200"
                  type="button"
                >
                  Run Prediction Model
                </button>
                {/* Prediction Modal */}
                <div
                  id="prediction-modal"
                  tabIndex={-1}
                  aria-hidden={!isPredictionModalOpen}
                  className={`${
                    isPredictionModalOpen ? "" : "hidden"
                  } fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black bg-opacity-50`}
                >
                  <div className="relative p-4 w-full max-w-2xl max-h-full">
                    <div className="relative bg-white rounded-lg shadow">
                      <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Task Completion Prediction
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                          data-modal-hide="prediction-modal"
                          onClick={() => setIsPredictionModalOpen(false)}
                        >
                          <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                          </svg>
                          <span className="sr-only">Close modal</span>
                        </button>
                      </div>
                      <div className="p-4 md:p-5 space-y-4">
                        <p className="text-base leading-relaxed text-gray-500">
                          Running the prediction model... This would display the
                          results of the task completion prediction based on
                          your task data.
                        </p>
                        <p className="text-base leading-relaxed text-gray-500">
                          Example: Based on current data, theres a 75 likelihood
                          that tasks marked as "in-progress" will be completed
                          within 48 hours.
                        </p>
                      </div>
                      <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b">
                        <button
                          data-modal-hide="prediction-modal"
                          type="button"
                          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                          onClick={() => setIsPredictionModalOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4">Task Clustering</h3>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-gray-700 mb-4">
                    This model clusters similar tasks together based on their
                    titles and descriptions.
                  </p>
                  <div className="h-64 flex items-center justify-center bg-white rounded border border-gray-200">
                    <p className="text-gray-500">
                      Cluster visualization would appear here
                    </p>
                  </div>
                </div>
                <button
                  data-modal-target="clustering-modal"
                  data-modal-toggle="clustering-modal"
                  onClick={() => setIsClusteringModalOpen(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-all duration-200"
                  type="button"
                >
                  Run Clustering Model
                </button>
                {/* Clustering Modal */}
                <div
                  id="clustering-modal"
                  tabIndex={-1}
                  aria-hidden={!isClusteringModalOpen}
                  className={`${
                    isClusteringModalOpen ? "" : "hidden"
                  } fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black bg-opacity-50`}
                >
                  <div className="relative p-4 w-full max-w-2xl max-h-full">
                    <div className="relative bg-white rounded-lg shadow">
                      <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Task Clustering Results
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                          data-modal-hide="clustering-modal"
                          onClick={() => setIsClusteringModalOpen(false)}
                        >
                          <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                          </svg>
                          <span className="sr-only">Close modal</span>
                        </button>
                      </div>
                      <div className="p-4 md:p-5 space-y-4">
                        <p className="text-base leading-relaxed text-gray-500">
                          Running the clustering model... This would display
                          clusters of tasks based on their titles and
                          descriptions.
                        </p>
                        <p className="text-base leading-relaxed text-gray-500">
                          Example: Cluster 1 contains tasks related to data
                          preprocessing, Cluster 2 contains tasks related to
                          model training.
                        </p>
                      </div>
                      <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b">
                        <button
                          data-modal-hide="clustering-modal"
                          type="button"
                          className="text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                          onClick={() => setIsClusteringModalOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold">
                  Data Science Assistant
                </h3>
              </div>
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      x: message.sender === "user" ? 20 : -20,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-emerald-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isChatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none px-4 py-2 max-w-xs">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your tasks..."
                    className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
