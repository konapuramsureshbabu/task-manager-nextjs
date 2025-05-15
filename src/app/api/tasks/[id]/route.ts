
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    console.log('PUT /api/tasks/:id called', params.id);
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    const data: ITask = await request.json();
    const task = await Task.findByIdAndUpdate(params.id, data, { new: true });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.log('Task updated:', task);
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/tasks/:id error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    console.log('DELETE /api/tasks/:id called', params.id);
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    const task = await Task.findByIdAndDelete(params.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.log('Task deleted:', task);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('DELETE /api/tasks/:id error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}