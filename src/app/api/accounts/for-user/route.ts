import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAccountsForSucculentUser } from '@/lib/user-accounts';

/**
 * GET /api/accounts/for-user?succulentUserId=xxx
 * Get all accounts linked to a Succulent user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const succulentUserId = searchParams.get('succulentUserId');

    if (!succulentUserId) {
      return NextResponse.json(
        { error: 'succulentUserId is required' },
        { status: 400 }
      );
    }

    const accounts = await getAccountsForSucculentUser(db, succulentUserId);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch accounts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
