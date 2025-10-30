import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { generatePostsStream, interpolatePrompt, getDoNotRepeat } from '@/lib/generator';
import { nextMondayISODate } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const account = await db.account.findUnique({
      where: { id: accountId, active: true }
    });

    if (!account) {
      return new Response(JSON.stringify({ error: 'Account not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tz = account.timezone || 'Europe/London';
    const weekStartISO = nextMondayISODate(tz);
    const doNotRepeat = await getDoNotRepeat(db, account.id);
    
    const prompt = interpolatePrompt(account.promptTemplate, {
      WEEK_START_ISO: weekStartISO,
      TZ: tz,
      PLATFORMS_JSON: account.platforms,
      PILLARS: account.pillars,
      POSTS_PER_WEEK: account.postsPerWeek.toString(),
      DO_NOT_REPEAT: doNotRepeat
    });

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generatePostsStream(account.openaiApiKey, prompt)) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
