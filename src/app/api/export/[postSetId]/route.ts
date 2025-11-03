import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAllSchedulerAdapters } from '@/lib/scheduler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postSetId: string }> }
) {
  try {
    const { postSetId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    const postSet = await db.postSet.findUnique({
      where: { id: postSetId },
      include: {
        posts: true,
        account: {
          select: { label: true }
        }
      }
    });

    if (!postSet) {
      return NextResponse.json({ error: 'Post set not found' }, { status: 404 });
    }

    // Convert posts to scheduler format
    const schedulerPosts = postSet.posts.map(post => ({
      title: post.title || undefined,
      content: post.content,
      platforms: JSON.parse(post.platforms),
      scheduledDate: post.scheduledAt.toISOString(),
      mediaUrls: JSON.parse(post.mediaUrls)
    }));

    // Find the requested export adapter
    const adapters = getAllSchedulerAdapters();
    const adapter = adapters.find(a => a.id === `${format}-export`);
    
    if (!adapter || !adapter.exportFormat) {
      return NextResponse.json({ 
        error: 'Export format not supported',
        availableFormats: adapters.filter(a => a.exportFormat).map(a => a.id.replace('-export', ''))
      }, { status: 400 });
    }

    const exportData = await adapter.exportFormat(schedulerPosts);
    
    // Return the file for download
    return new Response(exportData.data, {
      headers: {
        'Content-Type': exportData.format === 'csv' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="${exportData.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postSetId: string }> }
) {
  try {
    const { postSetId } = await params;
    const { formats } = await request.json();
    
    const postSet = await db.postSet.findUnique({
      where: { id: postSetId },
      include: {
        posts: true,
        account: { select: { label: true } }
      }
    });

    if (!postSet) {
      return NextResponse.json({ error: 'Post set not found' }, { status: 404 });
    }

    const schedulerPosts = postSet.posts.map(post => ({
      title: post.title || undefined,
      content: post.content,
      platforms: JSON.parse(post.platforms),
      scheduledDate: post.scheduledAt.toISOString(),
      mediaUrls: JSON.parse(post.mediaUrls)
    }));

    // Generate exports for all requested formats
    const adapters = getAllSchedulerAdapters();
    const exports = [];
    
    for (const formatId of (formats || ['json', 'buffer', 'later', 'hootsuite'])) {
      const adapter = adapters.find(a => a.id === `${formatId}-export`);
      if (adapter && adapter.exportFormat) {
        try {
          const exportData = await adapter.exportFormat(schedulerPosts);
          exports.push({
            format: formatId,
            adapter: adapter.name,
            filename: exportData.filename,
            downloadUrl: `/api/export/${postSetId}?format=${formatId}`,
            data: exportData.data
          });
        } catch (error) {
          console.warn(`Export failed for ${formatId}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      postSetId,
      accountLabel: postSet.account.label,
      totalPosts: schedulerPosts.length,
      exports
    });
    
  } catch (error) {
    console.error('Bulk export error:', error);
    return NextResponse.json({ 
      error: 'Bulk export failed' 
    }, { status: 500 });
  }
}
