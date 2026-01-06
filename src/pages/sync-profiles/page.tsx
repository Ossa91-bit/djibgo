import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import LoadingSpinner from '../../components/base/LoadingSpinner';

interface SyncResult {
  total_auth_users: number;
  existing_profiles: number;
  missing_profiles: number;
  created_profiles: Array<{
    user_id: string;
    email: string;
    user_type: string;
    full_name: string;
  }>;
  errors: Array<{
    user_id: string;
    email: string;
    error: string;
  }>;
}

export default function SyncProfilesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-all-missing-profiles', {
        body: {}
      });

      if (syncError) {
        throw syncError;
      }

      setResult(data.results);
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'An error occurred during sync');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <i className="ri-refresh-line text-3xl text-teal-600"></i>
              <h1 className="text-3xl font-bold text-gray-900">Sync Missing Profiles</h1>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <i className="ri-information-line text-xl text-blue-600 mt-0.5"></i>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">What does this do?</h3>
                  <p className="text-sm text-blue-800">
                    This tool finds all users in Supabase Authentication who don't have corresponding profiles 
                    in the profiles table and creates them automatically. It also creates professional_profiles 
                    for users marked as professionals.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Syncing profiles...</span>
                </>
              ) : (
                <>
                  <i className="ri-refresh-line text-xl"></i>
                  <span>Start Sync</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ri-error-warning-line text-xl text-red-600"></i>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <i className="ri-checkbox-circle-line text-xl text-green-600"></i>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Sync Completed Successfully!</h3>
                      <p className="text-sm text-green-800">
                        Created {result.created_profiles.length} new profiles
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className="ri-user-line text-2xl text-blue-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Auth Users</p>
                        <p className="text-2xl font-bold text-blue-900">{result.total_auth_users}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Existing Profiles</p>
                        <p className="text-2xl font-bold text-green-900">{result.existing_profiles}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <i className="ri-add-circle-line text-2xl text-orange-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Created Profiles</p>
                        <p className="text-2xl font-bold text-orange-900">{result.created_profiles.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {result.created_profiles.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Created Profiles</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {result.created_profiles.map((profile) => (
                            <tr key={profile.user_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{profile.full_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{profile.email}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  profile.user_type === 'professional' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {profile.user_type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 font-mono">{profile.user_id.substring(0, 8)}...</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                    <div className="bg-red-100 px-4 py-3 border-b border-red-200">
                      <h3 className="font-semibold text-red-900">Errors ({result.errors.length})</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {result.errors.map((err, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-red-900">{err.email}</p>
                          <p className="text-red-700">{err.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <i className="ri-lightbulb-line text-xl text-yellow-600 mt-0.5"></i>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Tips</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Run this sync whenever you notice users in Authentication without profiles</li>
                    <li>This is safe to run multiple times - it won't create duplicate profiles</li>
                    <li>Professional users will automatically get a professional_profiles entry</li>
                    <li>All created users will receive a welcome notification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}