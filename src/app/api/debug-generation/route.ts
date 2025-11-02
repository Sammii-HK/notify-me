import { NextRequest, NextResponse } from 'next/server';
import { generatePosts, buildBrandContext, getDoNotRepeat, interpolatePrompt } from '@/lib/generator';
import { nextMondayISODate } from '@/lib/time';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    
    const account = await db.account.findUnique({
      where: { id: accountId || 'acc_main', active: true }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const tz = account.timezone || 'Europe/London';
    const weekStartISO = nextMondayISODate(tz, 1);
    const doNotRepeat = await getDoNotRepeat(db, account.id);
    const brandContext = await buildBrandContext(db, account.id);
    
    let fullContext = brandContext;
    if (doNotRepeat !== 'None') {
      fullContext += `\n\nRECENT CONTENT TO AVOID REPEATING:\n${doNotRepeat}`;
    }
    
    const prompt = interpolatePrompt(account.promptTemplate, {
      WEEK_START_ISO: weekStartISO,
      TZ: tz,
      PLATFORMS_JSON: account.platforms,
      PILLARS: account.pillars,
      POSTS_PER_WEEK: account.postsPerWeek.toString(),
      DO_NOT_REPEAT: doNotRepeat,
      BRAND_CONTEXT: fullContext
    });

    console.log('=== DEBUG INFO ===');
    console.log('Account:', account.label);
    console.log('Week Start:', weekStartISO);
    console.log('Prompt Length:', prompt.length);
    console.log('Full Prompt:', prompt);
    console.log('==================');

    // Try generating with detailed error catching
    try {
      const response = await generatePosts(account.openaiApiKey, prompt);
      return NextResponse.json({ 
        success: true, 
        debug: {
          weekStartISO,
          promptLength: prompt.length,
          accountLabel: account.label
        },
        response 
      });
    } catch (genError: any) {
      console.error('Generation Error Details:', {
        message: genError.message,
        cause: genError.cause,
        stack: genError.stack
      });
      
      return NextResponse.json({ 
        error: 'Generation failed', 
        details: genError.message,
        debug: {
          weekStartISO,
          promptLength: prompt.length,
          accountLabel: account.label,
          prompt: prompt.substring(0, 500) + '...'
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}
