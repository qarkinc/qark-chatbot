import { NextResponse } from "next/server";

import { saveUserCredentials } from "@/db/queries";


export async function POST(request: Request) {
  try {
    const { user_id, credentials } = await request.json();

    if (!user_id || !credentials) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const {expires_in } = credentials;

    // Convert `expires_in` from seconds to an actual Date object
    const accessTokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Save user credentials in the database
    const result = await saveUserCredentials(user_id, {
      ...credentials,
      expires_in: accessTokenExpiry.getTime()
    });

    if (result.length > 0) {
      return NextResponse.json({ message: 'Credentials saved successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to save user credentials:', error);
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
  }
}