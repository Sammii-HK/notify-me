'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateForDisplay } from '@/lib/time';

interface Post {
  id: string;
  title?: string;
  content: string;
  platforms: string;
  scheduledAt: string;
  mediaUrls: string;
  approved: boolean;
}

interface Account {
  id: string;
  label: string;
  timezone: string;
  platforms: string;
  pillars: string;
}

interface PostSet {
  id: string;
  weekStart: string;
  status: string;
  account: Account;
  posts: Post[];
}

interface ReviewClientProps {
  postSetId: string;
}

export default function ReviewClient({ postSetId }: ReviewClientProps) {
  const router = useRouter();
  const [postSet, setPostSet] = useState<PostSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostSet = useCallback(async () => {
    try {
      const response = await fetch(`/api/review/${postSetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post set');
      }
      const data = await response.json();
      setPostSet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [postSetId]);

  useEffect(() => {
    if (!postSetId) return;
    fetchPostSet();
  }, [postSetId, fetchPostSet]);

  const updatePost = (postId: string, updates: Partial<Post>) => {
    if (!postSet) return;

    setPostSet({
      ...postSet,
      posts: postSet.posts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    });
  };

  const saveDraft = async () => {
    if (!postSet) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/review/${postSetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: postSet.posts }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      alert('Draft saved successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const approveAndQueue = async () => {
    if (!postSet) return;

    const approvedPosts = postSet.posts.filter(post => post.approved);
    if (approvedPosts.length === 0) {
      alert('Please approve at least one post before submitting');
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`/api/approve/${postSetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: approvedPosts }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve posts');
      }

      alert('Posts approved and queued successfully!');
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve posts');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !postSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">{error || 'Post set not found'}</div>
      </div>
    );
  }

  const weekStart = new Date(postSet.weekStart);
  const pillars = JSON.parse(postSet.account.pillars);
  const platforms = JSON.parse(postSet.account.platforms);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Review Weekly Posts
          </h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Account:</strong> {postSet.account.label}</p>
            <p><strong>Week Starting:</strong> {formatDateForDisplay(weekStart, postSet.account.timezone)}</p>
            <p><strong>Timezone:</strong> {postSet.account.timezone}</p>
            <p><strong>Platforms:</strong> {platforms.join(', ')}</p>
            <p><strong>Content Pillars:</strong> {pillars.join(', ')}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                postSet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                postSet.status === 'sent' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {postSet.status}
              </span>
            </p>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4 mb-6">
          {postSet.posts.map((post, index) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Post {index + 1}
                </h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={post.approved}
                    onChange={(e) => updatePost(post.id, { approved: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Approve</span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={post.title || ''}
                    onChange={(e) => updatePost(post.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={new Date(post.scheduledAt).toISOString().slice(0, 16)}
                    onChange={(e) => updatePost(post.id, { 
                      scheduledAt: new Date(e.target.value).toISOString() 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateForDisplay(post.scheduledAt, postSet.account.timezone)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={post.content}
                  onChange={(e) => updatePost(post.id, { content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {post.content.length} characters
                </p>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                <strong>Platforms:</strong> {JSON.parse(post.platforms).join(', ')}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {postSet.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={approveAndQueue}
                disabled={approving || postSet.posts.filter(p => p.approved).length === 0}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {approving ? 'Approving...' : 
                 `Approve & Queue (${postSet.posts.filter(p => p.approved).length} posts)`}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-4 text-center">
              Select posts to approve, then click &quot;Approve &amp; Queue&quot; to send them to your scheduler.
            </p>
          </div>
        )}

        {postSet.status !== 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-lg text-gray-600">
              This post set has already been {postSet.status}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
