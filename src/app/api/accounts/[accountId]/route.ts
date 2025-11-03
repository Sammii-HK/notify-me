import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        postSets: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const updates = await request.json();

    // Validate account exists
    const existing = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Update account with new configuration
    const updated = await db.account.update({
      where: { id: accountId },
      data: updates as never // Type assertion for dynamic updates
    });

    return NextResponse.json({ 
      success: true, 
      account: updated,
      message: `Account "${updated.label}" updated successfully`
    });
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Deactivate instead of delete to preserve data
    const updated = await db.account.update({
      where: { id: accountId },
      data: { active: false }
    });

    return NextResponse.json({ 
      success: true,
      message: `Account "${updated.label}" deactivated`
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    return NextResponse.json({ 
      error: 'Failed to deactivate account' 
    }, { status: 500 });
  }
}
