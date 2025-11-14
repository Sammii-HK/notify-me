import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/post-sets
 * Get all post sets, optionally filtered by accountId or status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const succulentUserId = searchParams.get('succulentUserId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    
    // If filtering by user, get their accounts first
    if (succulentUserId) {
      const { getAccountsForSucculentUser } = await import('@/lib/user-accounts');
      const accounts = await getAccountsForSucculentUser(db, succulentUserId);
      const accountIds = accounts.map((account: { id: string }) => account.id);
      if (accountIds.length > 0) {
        where.accountId = { in: accountIds };
      } else {
        // User has no accounts, return empty
        return NextResponse.json([]);
      }
    } else if (accountId) {
      where.accountId = accountId;
    }
    
    if (status) {
      where.status = status;
    }

    const postSets = await db.postSet.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            label: true,
            platforms: true,
          }
        },
        posts: {
          select: {
            id: true,
            content: true,
            platforms: true,
            scheduledAt: true,
            approved: true,
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(postSets);
  } catch (error) {
    console.error('Post sets fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch post sets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



