/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import connectMongoDB, { User } from '@/app/lib/mongodb';

interface UpdateRequest {
  name?: string;
  password?: string;
}

interface DecodedToken {
  userId: string;
  email: string;
}

const verifyToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    return decoded.userId;
  } catch (error) {
    console.log("e",error);
    
    return null;
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('GET /api/users/me called');
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    const user = await User.findById(userId, 'name email');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('User fetched:', { name: user.name, email: user.email });
    return NextResponse.json({ name: user.name, email: user.email }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/users/me error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('PUT /api/users/me called');
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectMongoDB();
    const { name, password }: UpdateRequest = await request.json();

    if (!name && !password) {
      return NextResponse.json({ error: 'At least one field (name or password) is required' }, { status: 400 });
    }

    const update: { name?: string; password?: string } = {};
    if (name) update.name = name;
    if (password) update.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(userId, update, { new: true, select: 'name email' });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User updated:', { name: user.name, email: user.email });
    return NextResponse.json({ name: user.name, email: user.email }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/users/me error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}