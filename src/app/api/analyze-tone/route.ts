import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { analyzeWebsiteTone, analyzeCsvTone, parseCsvContent, updateAccountTone } from '@/lib/tone-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { accountId, websiteUrl, csvData, type } = await request.json();
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }
    
    const account = await db.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    let toneAnalysis;
    
    if (type === 'website' && websiteUrl) {
      console.log(`Analyzing tone from website: ${websiteUrl}`);
      toneAnalysis = await analyzeWebsiteTone(account.openaiApiKey, websiteUrl);
      
      // Store website URL for future reference
      await db.account.update({
        where: { id: accountId },
        data: { websiteUrl } as never
      });
      
    } else if (type === 'csv' && csvData) {
      console.log('Analyzing tone from CSV data');
      const posts = parseCsvContent(csvData);
      
      if (posts.length === 0) {
        return NextResponse.json({ error: 'No valid posts found in CSV data' }, { status: 400 });
      }
      
      toneAnalysis = await analyzeCsvTone(account.openaiApiKey, posts.join('\n\n'));
      
      // Store CSV data for future reference
      await db.account.update({
        where: { id: accountId },
        data: { csvData } as never
      });
      
    } else {
      return NextResponse.json({ 
        error: 'Either websiteUrl (for website analysis) or csvData (for CSV analysis) required' 
      }, { status: 400 });
    }
    
    // Update account with analyzed tone
    await updateAccountTone(db, accountId, toneAnalysis);
    
    return NextResponse.json({
      success: true,
      analysis: toneAnalysis,
      message: `Tone analysis complete! Account "${account.label}" has been updated with the analyzed brand voice.`
    });
    
  } catch (error) {
    console.error('Tone analysis error:', error);
    return NextResponse.json({
      error: 'Tone analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
