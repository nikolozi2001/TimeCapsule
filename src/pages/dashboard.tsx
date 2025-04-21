import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getUserCapsules, deleteCapsule } from '@/lib/dataProvider';
import { Capsule } from '@/types';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading anymore and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch user's capsules
    const fetchCapsules = async () => {
      if (!user) return;
      
      try {
        const userCapsules = await getUserCapsules(user.uid);
        setCapsules(userCapsules);
      } catch (err) {
        console.error('Error fetching capsules:', err);
        setError('Failed to load your time capsules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCapsules();
    }
  }, [authLoading, user, router]);

  const handleDeleteCapsule = async (capsuleId: string) => {
    if (window.confirm('Are you sure you want to delete this time capsule? This action cannot be undone.')) {
      try {
        await deleteCapsule(capsuleId);
        setCapsules(prevCapsules => prevCapsules.filter(c => c.id !== capsuleId));
      } catch (err) {
        console.error('Error deleting capsule:', err);
        setError('Failed to delete the capsule. Please try again.');
      }
    }
  };

  const handleViewCapsule = (id: string) => {
    router.push(`/capsule/${id}`);
  };

  // Categorize capsules for better organization
  const categorizedCapsules = {
    unlocked: capsules.filter(c => c.status === 'opened'),
    locked: capsules.filter(c => c.status === 'sealed' && c.unlockMethod === 'time' && c.unlockTime && new Date(c.unlockTime) > new Date()),
    unlockable: capsules.filter(c => {
      if (c.status === 'sealed') {
        if (c.unlockMethod === 'immediate') return true;
        if (c.unlockMethod === 'time' && c.unlockTime && new Date(c.unlockTime) <= new Date()) return true;
      }
      return false;
    }),
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Time Capsules</h1>
          <button
            onClick={() => router.push('/create')}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Create New Capsule
          </button>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading your capsules...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Unlockable capsules */}
            {categorizedCapsules.unlockable.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Ready to Unlock</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedCapsules.unlockable.map(capsule => (
                    <div
                      key={capsule.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{capsule.title}</h3>
                        <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                          Unlockable
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Created on {format(new Date(capsule.createdAt), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewCapsule(capsule.id)}
                          className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-blue-600"
                        >
                          Unlock
                        </button>
                        <button
                          onClick={() => handleDeleteCapsule(capsule.id)}
                          className="px-3 py-1 bg-white text-red-600 text-sm border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked capsules */}
            {categorizedCapsules.locked.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Locked Capsules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedCapsules.locked.map(capsule => (
                    <div
                      key={capsule.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{capsule.title}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-full">
                          Locked
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Unlocks on {capsule.unlockTime && format(new Date(capsule.unlockTime), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewCapsule(capsule.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteCapsule(capsule.id)}
                          className="px-3 py-1 bg-white text-red-600 text-sm border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlocked capsules */}
            {categorizedCapsules.unlocked.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Unlocked Memories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedCapsules.unlocked.map(capsule => (
                    <div
                      key={capsule.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{capsule.title}</h3>
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                          Opened
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Unlocked on {capsule.openedAt && format(new Date(capsule.openedAt), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewCapsule(capsule.id)}
                          className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteCapsule(capsule.id)}
                          className="px-3 py-1 bg-white text-red-600 text-sm border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {capsules.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-500">No Time Capsules Yet</h3>
                <p className="mt-2 text-gray-500">
                  Create your first time capsule to start preserving memories.
                </p>
                <button
                  onClick={() => router.push('/create')}
                  className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Create Your First Capsule
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}