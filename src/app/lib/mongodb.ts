/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Model } from 'mongoose';

interface ITask {
  title: string;
  description: string;
  _id?: string;
}

interface IUser {
  name: string;
  email: string;
  password: string;
  _id?: string;
}

const taskSchema: Schema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const userSchema: Schema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Prevent model redefinition by checking if models exist
export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

const connectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI?.replace(/:.*@/, ':<hidden>@'));
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB Atlas');
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message, error.stack);
    throw new Error('Failed to connect to MongoDB');
  }
};

export default connectMongoDB;