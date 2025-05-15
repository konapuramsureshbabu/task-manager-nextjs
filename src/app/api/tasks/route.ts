
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB, { Task } from '@/app/lib/mongodb';

interface ITask {
  _id: string;
  title: string;
  description: string;
}

const verifyToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('GET /api/tasks called');
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    console.log('MongoDB connected, fetching tasks...');
    const tasks: ITask[] = await Task.find();
    console.log('Tasks fetched:', tasks);
    return NextResponse.json(tasks, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/tasks error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('POST /api/tasks called');
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    const data: ITask = await request.json();
    console.log('Data received:', data);
    const task = new Task(data);
    await task.save();
    console.log('Task saved:', task);
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tasks error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}