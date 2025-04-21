import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Capsule } from '@/types';
import dynamic from 'next/dynamic';
import { pool } from '@/lib/postgres';

// Use dynamic import for the Map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false
});

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [publicCapsules, setPublicCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapView, setMapView] = useState(false);

  useEffect(() => {
    // If auth is not loading anymore and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch public capsules that have been unlocked
    const fetchPublicCapsules = async () => {
      if (!user) return;
      
      try {
        // In our PostgreSQL implementation, we'll query opened capsules
        // Note: For this to work, we'd need to add an 'is_public' field to our schema
        // For now, we'll assume all opened capsules are public in this implementation
        const result = await pool.query(
          `SELECT * FROM capsules 
           WHERE status = 'opened'
           ORDER BY opened_at DESC
           LIMIT 20`
        );
        
        const capsules: Capsule[] = result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          creatorName: row.creator_name,
          title: row.title,
          content: row.content,
          location: typeof row.location === 'string' 
            ? JSON.parse(row.location) 
            : row.location,
          unlockMethod: row.unlock_method,
          unlockTime: row.unlock_time ? row.unlock_time.toISOString() : null,
          createdAt: row.created_at.toISOString(),
          openedAt: row.opened_at ? row.opened_at.toISOString() : null,
          status: row.status,
          mediaUrls: row.media_urls || []
        }));
        
        setPublicCapsules(capsules);
      } catch (err) {
        console.error('Error fetching public capsules:', err);
        setError('Failed to load public time capsules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPublicCapsules();
    }
  }, [authLoading, user, router]);

  const handleViewCapsule = (id: string) => {
    router.push(`/capsule/${id}`);
  };

  const toggleView = () => {
    setMapView(!mapView);
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
          <h1 className="text-2xl font-bold">Explore Public Capsules</h1>
          <button
            onClick={toggleView}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            {mapView ? 'List View' : 'Map View'}
          </button>
        </div>

        <p className="text-gray-600">
          Discover memories that others have shared publicly after unlocking their time capsules.
        </p>
        
        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading public capsules...</p>
          </div>
        ) : mapView ? (
          // Map View
          <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
            <MapWithNoSSR
              height="100%"
              markers={publicCapsules.map(capsule => ({
                position: {
                  latitude: capsule.location.latitude,
                  longitude: capsule.location.longitude
                },
                popup: capsule.title
              }))}
              interactive={true}
            />
          </div>
        ) : (
          // List View
          <div>
            {publicCapsules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicCapsules.map(capsule => (
                  <div
                    key={capsule.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewCapsule(capsule.id)}
                  >
                    <h3 className="font-medium text-lg">{capsule.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Shared by {capsule.creatorName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Unlocked on {capsule.openedAt && format(new Date(capsule.openedAt), 'MMM d, yyyy')}
                    </p>
                    <div className="mt-3 text-sm text-gray-800 line-clamp-3">
                      {capsule.content.substring(0, 100)}
                      {capsule.content.length > 100 ? '...' : ''}
                    </div>
                    {capsule.mediaUrls && capsule.mediaUrls.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          Media
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-500">No Public Capsules Yet</h3>
                <p className="mt-2 text-gray-500">
                  Be the first to create and unlock a public time capsule!
                </p>
                <button
                  onClick={() => router.push('/create')}
                  className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Create a Capsule
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}