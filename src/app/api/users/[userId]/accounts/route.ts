import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/users/[userId]/accounts
 * Get all accounts linked to a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const accountLinks = await db.userAccount.findMany({
      where: { userId },
      include: {
        account: {
          include: {
            postSets: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                status: true,
                weekStart: true
              }
            }
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ 
      accounts: accountLinks.map(link => ({
        ...link.account,
        linkId: link.id,
        role: link.role,
        isPrimary: link.isPrimary
      }))
    });
  } catch (error) {
    console.error('User accounts fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/users/[userId]/accounts
 * Link an account to a user
 * Body: { accountId: string, role?: string, isPrimary?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { accountId, role, isPrimary } = await request.json();

    if (!accountId) {
      return NextResponse.json({ 
        error: 'accountId is required' 
      }, { status: 400 });
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate account exists
    const account = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // If setting as primary, unset other primary accounts for this user
    if (isPrimary) {
      await db.userAccount.updateMany({
        where: { 
          userId,
          isPrimary: true
        },
        data: { isPrimary: false }
      });
    }

    // Create or update the link
    const link = await db.userAccount.upsert({
      where: {
        userId_accountId: {
          userId,
          accountId
        }
      },
      update: {
        role: role || undefined,
        isPrimary: isPrimary ?? false
      },
      create: {
        userId,
        accountId,
        role: role || 'owner',
        isPrimary: isPrimary ?? false
      },
      include: {
        account: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      link,
      message: `Account "${account.label}" linked to user successfully`
    });
  } catch (error) {
    console.error('Account linking error:', error);
    return NextResponse.json({ 
      error: 'Failed to link account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

