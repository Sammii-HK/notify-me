import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/users/[userId]
 * Get a specific user with their linked accounts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db as any).user.findUnique({
      where: { id: userId },
      include: {
        accountLinks: {
          include: {
            account: {
              include: {
                postSets: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    weekStart: true,
                    status: true,
                    createdAt: true,
                    _count: {
                      select: { posts: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/users/[userId]
 * Update user information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const updates = await request.json();

    // Validate user exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare updates
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.succulentEmail !== undefined) updateData.succulentEmail = updates.succulentEmail;
    if (updates.metadata !== undefined) {
      updateData.metadata = typeof updates.metadata === 'string' 
        ? updates.metadata 
        : JSON.stringify(updates.metadata);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (db as any).user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      user: updated,
      message: `User updated successfully`
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[userId]
 * Delete a user (will cascade delete account links)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if user exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (db as any).user.findUnique({
      where: { id: userId },
      include: {
        accountLinks: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (account links will cascade delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: `User deleted successfully`
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

