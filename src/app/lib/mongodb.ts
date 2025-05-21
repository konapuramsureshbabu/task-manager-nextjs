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
  role?: string;
  password?: string;
  isGoogleUser?: boolean;
  _id?: string;
  createdAt: Date;
}

interface ISubscription {
  userId: string;
  createdAt: Date;
  _id?: string;
}

interface INotification {
  title: string;
  body: string;
  userId: string;
  createdAt: Date;
}

const taskSchema: Schema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const userSchema: Schema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isGoogleUser: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const subscriptionSchema: Schema = new Schema<ISubscription>({
  userId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const notificationSchema: Schema<INotification> = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

const connectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    // Clean up endpoint_1 index and field
    await Subscription.collection.dropIndex('endpoint_1').catch((err) => {
      if (err.codeName === 'IndexNotFound') {
      } else {
        console.error('Error dropping endpoint_1 index:', err);
      }
    });
    await Subscription.updateMany({}, { $unset: { endpoint: '' } });
    await Subscription.syncIndexes();
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message, error.stack);
    throw new Error('Failed to connect to MongoDB');
  }
};

export default connectMongoDB;