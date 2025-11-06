import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/users
 * Get all users, optionally filtered by Succulent user ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const succulentUserId = searchParams.get('succulentUserId');
    
    const where = succulentUserId 
      ? { succulentUserId } 
      : {};
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = await (db as any).user.findMany({
      where,
      include: {
        accountLinks: {
          include: {
            account: {
              select: {
                id: true,
                label: true,
                active: true,
                platforms: true,
                postsPerWeek: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Create or update a user linked to Succulent profile
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { succulentUserId, succulentEmail, name, metadata } = userData;

    if (!succulentUserId) {
      return NextResponse.json({ 
        error: 'succulentUserId is required' 
      }, { status: 400 });
    }

    // Upsert user (create or update if exists)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db as any).user.upsert({
      where: { succulentUserId },
      update: {
        succulentEmail,
        name,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        updatedAt: new Date()
      },
      create: {
        succulentUserId,
        succulentEmail,
        name,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      },
      include: {
        accountLinks: {
          include: {
            account: {
              select: {
                id: true,
                label: true,
                active: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      user,
      message: `User ${user.name || user.succulentUserId} ${user.id ? 'updated' : 'created'} successfully`
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create/update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

