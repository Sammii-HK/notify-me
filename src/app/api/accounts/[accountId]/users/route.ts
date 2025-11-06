import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/accounts/[accountId]/users
 * Get all users linked to an account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    
    const account = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userLinks = await (db as any).userAccount.findMany({
      where: { accountId },
      include: {
        user: {
          select: {
            id: true,
            succulentUserId: true,
            succulentEmail: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      users: userLinks.map((link: any) => ({
        ...link.user,
        linkId: link.id,
        role: link.role,
        isPrimary: link.isPrimary
      }))
    });
  } catch (error) {
    console.error('Account users fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch account users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

