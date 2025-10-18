import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generatePostsForAccount } from '@/lib/generator';
import { notifyBoth } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // Verify cron token
  const cronToken = request.headers.get('x-cron-token');
  if (cronToken !== process.env.CRON_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    // Get accounts to process
    const accounts = accountId
      ? await db.account.findMany({ 
          where: { id: accountId, active: true } 
        })
      : await db.account.findMany({ 
          where: { active: true } 
        });

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No active accounts found' }, { status: 404 });
    }

    const results = [];

    for (const account of accounts) {
      try {
        const postSet = await generatePostsForAccount(db, account.id);
        
        const reviewUrl = `${process.env.APP_URL}/review/${postSet.id}`;
        await notifyBoth(
          'Posts Ready for Review',
          `Weekly posts generated for ${account.label}\n${reviewUrl}`
        );

        results.push({
          accountId: account.id,
          accountLabel: account.label,
          postSetId: postSet.id,
          status: 'success',
          reviewUrl
        });
      } catch (error) {
        console.error(`Error generating posts for account ${account.id}:`, error);
        results.push({
          accountId: account.id,
          accountLabel: account.label,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedAccounts: results.length,
      results
    });
  } catch (error) {
    console.error('Weekly cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
