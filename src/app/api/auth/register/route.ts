/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectMongoDB, { User } from '@/app/lib/mongodb';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    await connectMongoDB();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isGoogleUser) {
        return NextResponse.json({ error: 'Account exists with Google Sign-In' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, isGoogleUser: false });
    await user.save();

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/auth/register error:', message);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}