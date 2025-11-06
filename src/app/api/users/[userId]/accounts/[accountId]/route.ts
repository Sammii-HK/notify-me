import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * DELETE /api/users/[userId]/accounts/[accountId]
 * Unlink an account from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; accountId: string }> }
) {
  try {
    const { userId, accountId } = await params;

    // Check if link exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const link = await (db as any).userAccount.findUnique({
      where: {
        userId_accountId: {
          userId,
          accountId
        }
      },
      include: {
        account: true
      }
    });

    if (!link) {
      return NextResponse.json({ 
        error: 'Account link not found' 
      }, { status: 404 });
    }

    // Delete the link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).userAccount.delete({
      where: {
        userId_accountId: {
          userId,
          accountId
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Account "${link.account.label}" unlinked from user successfully`
    });
  } catch (error) {
    console.error('Account unlinking error:', error);
    return NextResponse.json({ 
      error: 'Failed to unlink account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/users/[userId]/accounts/[accountId]
 * Update the link between user and account (e.g., change role, set primary)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; accountId: string }> }
) {
  try {
    const { userId, accountId } = await params;
    const { role, isPrimary } = await request.json();

    // Check if link exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).userAccount.findUnique({
      where: {
        userId_accountId: {
          userId,
          accountId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ 
        error: 'Account link not found' 
      }, { status: 404 });
    }

    // If setting as primary, unset other primary accounts
    if (isPrimary === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).userAccount.updateMany({
        where: { 
          userId,
          isPrimary: true,
          accountId: { not: accountId }
        },
        data: { isPrimary: false }
      });
    }

    // Update the link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (db as any).userAccount.update({
      where: {
        userId_accountId: {
          userId,
          accountId
        }
      },
      data: {
        role: role !== undefined ? role : existing.role,
        isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary
      },
      include: {
        account: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      link: updated,
      message: `Account link updated successfully`
    });
  } catch (error) {
    console.error('Account link update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update account link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

