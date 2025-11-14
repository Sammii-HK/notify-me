'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  label: string;
  openaiApiKey: string;
  promptTemplate: string;
  pillars: string;
  platforms: string;
  timezone: string;
  postsPerWeek: number;
  active: boolean;
  brandVoice: string | null;
  targetAudience: string | null;
  brandValues: string | null;
  contentGuidelines: string | null;
  examplePosts: string | null;
  contextTokenLimit: number;
}

export default function AccountEditorClient({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  async function loadAccount() {
    try {
      const response = await fetch(`/api/accounts/${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to load account');
      }
      const data = await response.json();
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!account) return;
    
    setSaving(true);
    setError(null);

    try {
      // Parse JSON fields for editing
      const brandVoice = account.brandVoice ? JSON.parse(account.brandVoice) : {};
      const targetAudience = account.targetAudience ? JSON.parse(account.targetAudience) : {};
      const brandValues = account.brandValues ? JSON.parse(account.brandValues) : {};
      const contentGuidelines = account.contentGuidelines ? JSON.parse(account.contentGuidelines) : {};
      const examplePosts = account.examplePosts ? JSON.parse(account.examplePosts) : [];

      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: account.label,
          openaiApiKey: account.openaiApiKey,
          promptTemplate: account.promptTemplate,
          pillars: account.pillars,
          platforms: account.platforms,
          timezone: account.timezone,
          postsPerWeek: account.postsPerWeek,
          active: account.active,
          brandVoice: JSON.stringify(brandVoice),
          targetAudience: JSON.stringify(targetAudience),
          brandValues: JSON.stringify(brandValues),
          contentGuidelines: JSON.stringify(contentGuidelines),
          examplePosts: JSON.stringify(examplePosts),
          contextTokenLimit: account.contextTokenLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      alert('Account saved successfully!');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSaving(false);
    }
  }

  function updateBrandVoice(field: string, value: string) {
    if (!account) return;
    const brandVoice = account.brandVoice ? JSON.parse(account.brandVoice) : {};
    brandVoice[field] = value;
    setAccount({ ...account, brandVoice: JSON.stringify(brandVoice) });
  }

  function updateTargetAudience(field: string, value: string) {
    if (!account) return;
    const targetAudience = account.targetAudience ? JSON.parse(account.targetAudience) : {};
    targetAudience[field] = value;
    setAccount({ ...account, targetAudience: JSON.stringify(targetAudience) });
  }

  function updateBrandValues(field: string, value: string) {
    if (!account) return;
    const brandValues = account.brandValues ? JSON.parse(account.brandValues) : {};
    brandValues[field] = value;
    setAccount({ ...account, brandValues: JSON.stringify(brandValues) });
  }

  function updateContentGuidelines(field: string, value: string) {
    if (!account) return;
    const contentGuidelines = account.contentGuidelines ? JSON.parse(account.contentGuidelines) : {};
    contentGuidelines[field] = value;
    setAccount({ ...account, contentGuidelines: JSON.stringify(contentGuidelines) });
  }

  function updateExamplePosts(value: string) {
    if (!account) return;
    const posts = value.split('\n').filter(p => p.trim());
    setAccount({ ...account, examplePosts: JSON.stringify(posts) });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Account not found</div>
      </div>
    );
  }

  const brandVoice = account.brandVoice ? JSON.parse(account.brandVoice) : {};
  const targetAudience = account.targetAudience ? JSON.parse(account.targetAudience) : {};
  const brandValues = account.brandValues ? JSON.parse(account.brandValues) : {};
  const contentGuidelines = account.contentGuidelines ? JSON.parse(account.contentGuidelines) : {};
  const examplePosts = account.examplePosts ? JSON.parse(account.examplePosts) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Account: {account.label}
          </h1>
          <p className="text-gray-600">
            Configure brand voice, audience, and content guidelines for this persona
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Quick Import from JSON */}
        {showJsonPaste && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste JSON from AI</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste the JSON output from ChatGPT/Claude here to auto-fill all brand context fields.
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 font-mono text-sm"
              rows={8}
              placeholder='{\n  "brandVoice": {...},\n  "targetAudience": {...},\n  ...\n}'
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    const data = JSON.parse(jsonInput);
                    if (data.brandVoice) {
                      updateBrandVoice('tone', data.brandVoice.tone || '');
                      updateBrandVoice('personality', data.brandVoice.personality || '');
                      updateBrandVoice('styleGuidelines', data.brandVoice.styleGuidelines || '');
                    }
                    if (data.targetAudience) {
                      updateTargetAudience('demographics', data.targetAudience.demographics || '');
                      updateTargetAudience('interests', data.targetAudience.interests || '');
                      updateTargetAudience('painPoints', data.targetAudience.painPoints || '');
                    }
                    if (data.brandValues) {
                      updateBrandValues('coreValues', data.brandValues.coreValues || '');
                      updateBrandValues('mission', data.brandValues.mission || '');
                      updateBrandValues('usp', data.brandValues.usp || '');
                    }
                    if (data.contentGuidelines) {
                      updateContentGuidelines('dos', data.contentGuidelines.dos || '');
                      updateContentGuidelines('donts', data.contentGuidelines.donts || '');
                      updateContentGuidelines('hashtags', data.contentGuidelines.hashtags || '');
                    }
                    if (data.examplePosts && Array.isArray(data.examplePosts)) {
                      updateExamplePosts(data.examplePosts.join('\n'));
                    }
                    setShowJsonPaste(false);
                    setJsonInput('');
                    alert('Brand context imported successfully!');
                  } catch (err) {
                    alert('Invalid JSON. Please check the format.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Import JSON
              </button>
              <button
                onClick={() => {
                  setShowJsonPaste(false);
                  setJsonInput('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            {!showJsonPaste && (
              <button
                onClick={() => setShowJsonPaste(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                📋 Paste JSON from AI →
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={account.label}
                onChange={(e) => setAccount({ ...account, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={account.openaiApiKey}
                onChange={(e) => setAccount({ ...account, openaiApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="sk-..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={account.active}
                onChange={(e) => setAccount({ ...account, active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Active (include in automated generation)</label>
            </div>
          </div>
        </div>

        {/* Brand Voice */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Voice</h2>
          <p className="text-sm text-gray-600 mb-4">
            Define the tone, personality, and style for this account (e.g., "Professional", "Casual", "Inspirational")
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <input
                type="text"
                value={brandVoice.tone || ''}
                onChange={(e) => updateBrandVoice('tone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Professional yet approachable"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
              <input
                type="text"
                value={brandVoice.personality || ''}
                onChange={(e) => updateBrandVoice('personality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Friendly, data-driven, inspiring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style Guidelines</label>
              <textarea
                value={brandVoice.styleGuidelines || ''}
                onChange={(e) => updateBrandVoice('styleGuidelines', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="e.g., Use short sentences, include emojis sparingly, avoid jargon"
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Audience</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demographics</label>
              <input
                type="text"
                value={targetAudience.demographics || ''}
                onChange={(e) => updateTargetAudience('demographics', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Entrepreneurs and professionals 30-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
              <input
                type="text"
                value={targetAudience.interests || ''}
                onChange={(e) => updateTargetAudience('interests', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Business growth, photography, creativity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pain Points</label>
              <textarea
                value={targetAudience.painPoints || ''}
                onChange={(e) => updateTargetAudience('painPoints', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g., Time management, finding clients, creative blocks"
              />
            </div>
          </div>
        </div>

        {/* Brand Values */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Values</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Core Values</label>
              <input
                type="text"
                value={brandValues.coreValues || ''}
                onChange={(e) => updateBrandValues('coreValues', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Authenticity, creativity, excellence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
              <textarea
                value={brandValues.mission || ''}
                onChange={(e) => updateBrandValues('mission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g., Empower creators to share their unique vision"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unique Selling Points</label>
              <textarea
                value={brandValues.usp || ''}
                onChange={(e) => updateBrandValues('usp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g., Professional photography with artistic vision"
              />
            </div>
          </div>
        </div>

        {/* Content Guidelines */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Guidelines</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dos</label>
              <textarea
                value={contentGuidelines.dos || ''}
                onChange={(e) => updateContentGuidelines('dos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g., Share behind-the-scenes, use storytelling, include call-to-action"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Don'ts</label>
              <textarea
                value={contentGuidelines.donts || ''}
                onChange={(e) => updateContentGuidelines('donts', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g., Avoid overselling, don't use stock photos, no clickbait"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
              <input
                type="text"
                value={contentGuidelines.hashtags || ''}
                onChange={(e) => updateContentGuidelines('hashtags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., #photography #creativity #portrait"
              />
            </div>
          </div>
        </div>

        {/* Example Posts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Example Posts</h2>
            <a
              href="/BRAND-CONTEXT-GENERATOR.md"
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📋 Copy AI Prompt →
            </a>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add example posts (one per line) that represent your best content. These will be used as style references.
            <br />
            <span className="text-xs text-gray-500">
              💡 Tip: Use ChatGPT/Claude with the prompt template to generate context quickly
            </span>
          </p>
          <textarea
            value={Array.isArray(examplePosts) ? examplePosts.join('\n') : ''}
            onChange={(e) => updateExamplePosts(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={6}
            placeholder="Every sunset is a reminder that endings can be beautiful too. 📸&#10;&#10;Behind every great photo is a story waiting to be told. What's yours? ✨"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

