/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectMongoDB, { User } from '@/app/lib/mongodb';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { name, email, password, secret } = await request.json();
    if (secret !== process.env.ADMIN_SECRET) { // Secure with a secret
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    await connectMongoDB();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, isGoogleUser: false, role: 'admin' });
    await user.save();

    return NextResponse.json({ message: 'Admin registered successfully' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/auth/create-admin error:', message);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}