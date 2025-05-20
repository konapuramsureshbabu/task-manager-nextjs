/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Model, Document } from 'mongoose';

interface ITask {
  title: string;
  description: string;
  _id?: string;
}

interface IUser {
  name: string;
  email: string;
  password?: string;
  isGoogleUser?: boolean;
  _id?: string;
}

interface ISubscription extends Document {
  token: string;
  userId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface INotification extends Document {
  message: string;
  userId?: string;
  createdAt: Date;
}

const taskSchema: Schema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const userSchema: Schema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  isGoogleUser: { type: Boolean, default: false },
});

const subscriptionSchema: Schema = new Schema<ISubscription>({
  token: { type: String, required: true, unique: true },
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const NotificationSchema: Schema<INotification> = new Schema({
  message: { type: String, required: true },
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

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