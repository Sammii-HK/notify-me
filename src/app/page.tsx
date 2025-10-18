export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Social Content Engine
          </h1>
          <p className="text-gray-600">
            Automated social media content generation and scheduling
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Weekly Generation
            </h3>
            <p className="text-gray-600 text-sm">
              Posts are automatically generated every Sunday at 6 PM UTC
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Auto-Send
            </h3>
            <p className="text-gray-600 text-sm">
              Pending posts are automatically sent Monday at 7:30 AM UTC if not reviewed
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Review & Approve
            </h3>
            <p className="text-gray-600 text-sm">
              Click review links from notifications to approve posts manually
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Database Setup</h3>
              <p className="text-gray-600 text-sm mb-2">
                Set up your database and run migrations:
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                npx prisma migrate dev
              </code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Add Account</h3>
              <p className="text-gray-600 text-sm mb-2">
                Create your first account using the seed script:
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                npm run seed
              </code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Test Generation</h3>
              <p className="text-gray-600 text-sm mb-2">
                Test the weekly generation manually:
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                curl -X POST &quot;http://localhost:3000/api/cron/weekly&quot; -H &quot;x-cron-token: your-token&quot;
              </code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Deploy Cloudflare Worker</h3>
              <p className="text-gray-600 text-sm">
                Set up the Cloudflare Worker for automated cron triggers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
