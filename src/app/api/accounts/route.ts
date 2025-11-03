import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const accounts = await db.account.findMany({
      select: {
        id: true,
        label: true,
        active: true,
        platforms: true,
        pillars: true,
        postsPerWeek: true,
        timezone: true,
        createdAt: true,
        monthlyGenCount: true,
        contextTokenLimit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Accounts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountData = await request.json();

    // Validate required fields
    const { label, openaiApiKey, pillars, platforms } = accountData;
    if (!label || !openaiApiKey || !pillars || !platforms) {
      return NextResponse.json({ 
        error: 'Missing required fields: label, openaiApiKey, pillars, platforms' 
      }, { status: 400 });
    }

    const newAccount = await db.account.create({
      data: {
        ...accountData,
        pillars: typeof pillars === 'string' ? pillars : JSON.stringify(pillars),
        platforms: typeof platforms === 'string' ? platforms : JSON.stringify(platforms),
      }
    });

    return NextResponse.json({ 
      success: true, 
      account: newAccount,
      message: `Account "${newAccount.label}" created successfully`
    });
  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
