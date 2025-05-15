import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectMongoDB, { User } from '@/app/lib/mongodb';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('POST /api/auth/register called');
    await connectMongoDB();
    const { name, email, password }: RegisterRequest = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    console.log('User registered:', { name, email });
    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/auth/register error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}