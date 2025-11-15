import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generatePostsForAccount } from '@/lib/generator';
import { notifyBoth } from '@/lib/notifications';

/**
 * POST /api/generate
 * Manual post generation endpoint for UI (no cron token required)
 * Accepts accountId in body or query params
 */
export async function POST(request: NextRequest) {
  console.log('[API /generate] Request received');
  
  try {
    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    console.log('[API /generate] Account ID:', accountId);

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    // Get the account
    const account = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!account.active) {
      return NextResponse.json({ error: 'Account is not active' }, { status: 400 });
    }

    // Generate posts
    const postSet = await generatePostsForAccount(db, account.id);
    
    const reviewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/review/${postSet.id}`;
    
    // Optionally send notification (can be disabled for manual generation)
    if (process.env.NOTIFY_ON_MANUAL_GENERATION !== 'false') {
      try {
        await notifyBoth(
          'Posts Ready for Review',
          `Posts generated for ${account.label}\n${reviewUrl}`
        );
      } catch (notifError) {
        console.error('Notification error (non-fatal):', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      accountLabel: account.label,
      postSetId: postSet.id,
      reviewUrl,
      message: `Posts generated successfully for ${account.label}`
    });
  } catch (error) {
    console.error('[API /generate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('[API /generate] Full error:', {
      message: errorMessage,
      stack: errorStack,
      error
    });
    
    return NextResponse.json({
      error: 'Failed to generate posts',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}

