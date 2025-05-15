# Task Manager - Next.js Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It is a full-stack task management application with user authentication, task CRUD operations, and a responsive UI styled with Tailwind CSS.

## Features

- **User Authentication**: Register and login with JWT-based authentication.
- **Task Management**: Create, read, update, and delete tasks stored in MongoDB Atlas.
- **Profile Management**: Update user name and password via a dedicated profile page.
- **Responsive Layout**: 
  - Protected routes (`/` for tasks, `/profile`) include a header, collapsible sidebar, and footer.
  - Public routes (`/login`, `/register`) are standalone without navigation elements.
- **Styling**: Built with Tailwind CSS for a modern, responsive design.
- **Database**: MongoDB Atlas for persistent storage of users and tasks.
- **API Routes**: Secure Next.js API routes for authentication, tasks, and user management.

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or later.
- **MongoDB Atlas**: A MongoDB Atlas account with a database named `task-manager`.
- **npm**: Package manager (or use `yarn`, `pnpm`, or `bun`).

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd task-manager


Install dependencies:
npm install


Set up environment variables:Create a .env.local file in the root directory and add the following:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/task-manager?retryWrites=true&w=majority
JWT_SECRET=your-secure-jwt-secret-12345


Replace <username> and <password> with your MongoDB Atlas credentials.
Use a strong, unique JWT_SECRET for token signing.


Run the development server:
npm run dev

Open http://localhost:3000 in your browser.


Project Structure

app/layout.tsx: Root layout with conditional header, sidebar, and footer for protected routes.
app/page.tsx: Tasks page for managing tasks (protected).
app/profile/page.tsx: Profile page for updating user details (protected).
app/login/page.tsx: Login page (public).
app/register/page.tsx: Registration page (public).
app/api/: API routes for authentication (auth), tasks (tasks), and user management (users).
lib/mongodb.ts: MongoDB connection and Mongoose models (Task, User).

Usage

Register: Go to /register to create a new account.
Login: Go to /login to authenticate and receive a JWT (stored in localStorage).
Manage Tasks: Access / to create, edit, or delete tasks.
Update Profile: Visit /profile to update your name or password.
Logout: Use the logout button in the header to clear the JWT and redirect to /login.

API Endpoints

Authentication:
POST /api/auth/register: Register a new user (name, email, password).
POST /api/auth/login: Login and receive a JWT (email, password).


Tasks:
GET /api/tasks: List all tasks for the authenticated user.
POST /api/tasks: Create a new task (title, description).
PUT /api/tasks/[id]: Update a task by ID.
DELETE /api/tasks/[id]: Delete a task by ID.


User:
GET /api/users/me: Get authenticated user’s details (name, email).
PUT /api/users/me: Update user’s name or password.



All protected endpoints require an Authorization: Bearer <jwt-token> header.
Development

Edit Pages: Modify app/*.tsx files to update UI. Pages auto-update with hot reloading.
API Routes: Add or modify routes in app/api/ for backend logic.
Styling: Use Tailwind CSS classes in app/globals.css or inline.
Fonts: Uses next/font with Geist font optimized by Vercel.

Common Issues

MongoDB Connection: Ensure MONGODB_URI is correct and MongoDB Atlas allows your IP.
JWT Errors: Verify JWT_SECRET matches across environments.
OverwriteModelError: Ensure lib/mongodb.ts uses mongoose.models to prevent model redefinition.

Deployment
Deploy the application to Vercel, the easiest platform for Next.js apps.

Push to GitHub:
git add .
git commit -m "Deploy task-manager"
git push origin main


Deploy on Vercel:

Connect your GitHub repository to Vercel.
Set environment variables in Vercel dashboard:
MONGODB_URI
JWT_SECRET


Deploy the app.


Verify:

Check the deployed URL (e.g., https://your-app.vercel.app).
Test login, task management, and profile updates.



See the Next.js deployment documentation for details.
Learn More

Next.js Documentation - Learn about Next.js features and APIs.
Learn Next.js - Interactive Next.js tutorial.
Tailwind CSS Documentation - Styling guide.
MongoDB Atlas - Database setup.
Mongoose - MongoDB ORM for Node.js.

Check out the Next.js GitHub repository for feedback and contributions.
Contributing
Feel free to open issues or submit pull requests to improve the application. Ensure you follow the coding style and include tests for new features.
License
This project is licensed under the MIT License.```
