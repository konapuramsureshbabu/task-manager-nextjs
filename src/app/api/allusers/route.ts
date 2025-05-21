/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB, { User } from '@/app/lib/mongodb';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    await connectMongoDB();
    const users = await User.find({}, 'email').lean();
    const emails = users.map((user) => user.email);

    return NextResponse.json({ emails }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/users error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}