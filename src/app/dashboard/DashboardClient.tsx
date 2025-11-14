'use client';

import { useEffect, useState } from 'react';

interface Account {
  id: string;
  label: string;
  active: boolean;
  platforms: string;
  pillars: string;
  postsPerWeek: number;
  monthlyGenCount: number;
}

interface PostSet {
  id: string;
  accountId: string;
  weekStart: string;
  status: string;
  createdAt: string;
  account: {
    id: string;
    label: string;
  };
  posts: Array<{
    id: string;
    content: string;
    platforms: string;
    scheduledAt: string;
    approved: boolean;
  }>;
  _count: {
    posts: number;
  };
}

export default function DashboardClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [postSets, setPostSets] = useState<PostSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [accountsRes, postSetsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/post-sets?limit=10')
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
      }

      if (postSetsRes.ok) {
        const postSetsData = await postSetsRes.json();
        setPostSets(postSetsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePosts(accountId: string) {
    setGenerating(accountId);
    try {
      const response = await fetch('/api/cron/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Posts generated! Post set ID: ${result.postSetId || 'N/A'}`);
        loadData(); // Refresh
      } else {
        const error = await response.text();
        alert(`Failed to generate posts: ${error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate posts');
    } finally {
      setGenerating(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your accounts and review generated posts
          </p>
        </div>

        {/* Accounts Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Accounts / Personas</h2>
            <button
              onClick={() => window.location.href = '/api/accounts'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              View All (API)
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              No accounts found. Create one via API or seed script.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const platforms = JSON.parse(account.platforms || '[]');
                const pillars = JSON.parse(account.pillars || '[]');
                
                return (
                  <div key={account.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{account.label}</h3>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                          account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Platforms:</span>{' '}
                        {platforms.length > 0 ? platforms.join(', ') : 'None'}
                      </div>
                      <div>
                        <span className="font-medium">Posts/week:</span> {account.postsPerWeek}
                      </div>
                      <div>
                        <span className="font-medium">Generations this month:</span> {account.monthlyGenCount}
                      </div>
                      {pillars.length > 0 && (
                        <div>
                          <span className="font-medium">Pillars:</span>{' '}
                          <span className="text-xs">{pillars.slice(0, 2).join(', ')}{pillars.length > 2 ? '...' : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/accounts/${account.id}`}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm text-center"
                      >
                        Edit Context
                      </a>
                      <button
                        onClick={() => generatePosts(account.id)}
                        disabled={generating === account.id || !account.active}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        {generating === account.id ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Post Sets */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Post Sets</h2>

          {postSets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              No post sets yet. Generate posts for an account to get started.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {postSets.map((postSet) => (
                    <tr key={postSet.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{postSet.account.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(postSet.weekStart)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{postSet._count.posts}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(postSet.status)}`}>
                          {postSet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(postSet.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={`/review/${postSet.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

