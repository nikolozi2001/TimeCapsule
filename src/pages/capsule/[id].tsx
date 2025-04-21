import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getCapsuleById, openCapsule, checkCapsuleStatus } from '@/lib/capsuleService';
import { getCurrentPosition } from '@/lib/geolocation';
import { Capsule, CapsuleStatus } from '@/types';
import dynamic from 'next/dynamic';

// Use dynamic import for the Map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false
});

export default function CapsuleView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [capsuleStatus, setCapsuleStatus] = useState<CapsuleStatus>('locked');
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);

  useEffect(() => {
    // If auth is not loading anymore and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch capsule when id is available
    const fetchCapsule = async () => {
      if (!id || !user) return;
      
      try {
        const capsuleData = await getCapsuleById(id as string);
        
        if (!capsuleData) {
          setError('Capsule not found.');
          return;
        }
        
        // Check if user owns this capsule
        if (capsuleData.userId !== user.uid && !capsuleData.isPublic) {
          setError('You do not have permission to view this capsule.');
          return;
        }
        
        setCapsule(capsuleData);
        
        // If capsule is already opened, update status
        if (capsuleData.isOpened) {
          setCapsuleStatus('unlocked');
        }
      } catch (err) {
        console.error('Error fetching capsule:', err);
        setError('Failed to load the time capsule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchCapsule();
    }
  }, [id, authLoading, user, router]);

  const checkLocation = async () => {
    if (!capsule) return;
    
    setLocationCheckInProgress(true);
    
    try {
      // Get user's current location
      const position = await getCurrentPosition();
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
      
      // Check if capsule can be unlocked
      const status = checkCapsuleStatus(
        capsule,
        position.latitude,
        position.longitude
      );
      
      setCapsuleStatus(status);
      
      // If it's unlockable, mark it as opened
      if (status === 'unlockable' && !capsule.isOpened) {
        await openCapsule(capsule.id);
        setCapsule(prev => prev ? { ...prev, isOpened: true } : null);
        setCapsuleStatus('unlocked');
      }
    } catch (err: any) {
      console.error('Error checking location:', err);
      setError(`Location check failed: ${err.message}`);
    } finally {
      setLocationCheckInProgress(false);
    }
  };

  // Helper function to determine if the capsule is ready to unlock
  const isUnlockDatePassed = capsule ? new Date() >= new Date(capsule.unlockDate) : false;

  const renderCapsuleContent = () => {
    if (!capsule) return null;
    
    if (capsuleStatus === 'locked') {
      return (
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">This capsule is still locked</h3>
          <p className="text-gray-600 mb-4">
            {!isUnlockDatePassed ? (
              <>
                This capsule will be unlockable on{' '}
                {format(new Date(capsule.unlockDate), 'MMMM d, yyyy')} when you
                visit the location where it was created.
              </>
            ) : (
              <>
                The unlock date has passed. You need to visit the location
                where this capsule was created to unlock it.
              </>
            )}
          </p>
          <button
            onClick={checkLocation}
            disabled={locationCheckInProgress || !isUnlockDatePassed}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            {locationCheckInProgress
              ? 'Checking location...'
              : !isUnlockDatePassed
              ? 'Unlock date has not passed yet'
              : 'Check if I\'m at the right location'}
          </button>
        </div>
      );
    }
    
    if (capsuleStatus === 'unlockable') {
      return (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Ready to Unlock!</h3>
          <p className="text-gray-600 mb-4">
            You're at the right location and the unlock date has passed.
            You can now unlock this time capsule!
          </p>
          <button
            onClick={checkLocation}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Unlock Now
          </button>
        </div>
      );
    }
    
    // Capsule is unlocked
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-700 text-center">
            This time capsule has been unlocked!
          </p>
        </div>
        
        <div className="prose max-w-none">
          <p className="whitespace-pre-line">{capsule.content}</p>
        </div>
        
        {capsule.mediaUrl && (
          <div className="mt-6">
            {capsule.mediaType === 'image' ? (
              <div className="relative h-96 w-full">
                <Image
                  src={capsule.mediaUrl}
                  alt="Capsule media"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : capsule.mediaType === 'video' ? (
              <video
                src={capsule.mediaUrl}
                controls
                className="w-full max-h-96"
              />
            ) : null}
          </div>
        )}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <p>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  if (!capsule) {
    return (
      <Layout>
        <div className="text-center p-8">
          <p>Capsule not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary hover:underline flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{capsule.title}</h1>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                capsuleStatus === 'unlocked'
                  ? 'bg-green-200 text-green-800'
                  : capsuleStatus === 'unlockable'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {capsuleStatus === 'unlocked'
                ? 'Unlocked'
                : capsuleStatus === 'unlockable'
                ? 'Ready to Unlock'
                : 'Locked'}
            </span>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <p>Created by {capsule.creatorName || 'Anonymous'}</p>
            <p>
              Created on {format(new Date(capsule.createdAt), 'MMMM d, yyyy')}
            </p>
            <p>
              Unlock date: {format(new Date(capsule.unlockDate), 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            {renderCapsuleContent()}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-3">Capsule Location</h3>
            <div className="h-64 border border-gray-300 rounded-md overflow-hidden">
              <MapWithNoSSR
                height="100%"
                interactive={false}
                markers={[
                  {
                    position: {
                      latitude: capsule.location.latitude,
                      longitude: capsule.location.longitude,
                    },
                    popup: 'Capsule Location',
                  },
                ]}
              />
            </div>
            {userLocation && (
              <p className="mt-2 text-xs text-gray-500">
                Your current location: {userLocation.latitude.toFixed(6)},{' '}
                {userLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}