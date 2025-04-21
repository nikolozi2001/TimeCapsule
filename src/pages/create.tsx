import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getCurrentPosition } from '@/lib/geolocation';
import { createCapsule } from '@/lib/capsuleService';
import dynamic from 'next/dynamic';

// Use dynamic import for the Map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false
});

export default function CreateCapsule() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [unlockDate, setUnlockDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week from now
  );
  const [isPublic, setIsPublic] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Detect user location on mount
  useEffect(() => {
    // If auth is not loading anymore and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Get user's current location
    const fetchLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setLocation({
          latitude: position.latitude,
          longitude: position.longitude
        });
      } catch (err) {
        console.error('Error getting location:', err);
        // Don't set error, just leave location null
      }
    };

    if (user) {
      fetchLocation();
    }
  }, [authLoading, user, router]);

  const handleLocationSelect = (position: { latitude: number; longitude: number }) => {
    setLocation(position);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a time capsule');
      return;
    }

    if (!location) {
      setError('Please select a location for your time capsule');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const capsuleData = {
        title,
        content,
        location,
        unlockDate,
        mediaFile,
        isPublic
      };

      const capsuleId = await createCapsule(
        user.uid,
        user.displayName || 'Anonymous',
        capsuleData
      );

      setSuccess(true);
      
      // Redirect to the dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating capsule:', err);
      setError('Failed to create time capsule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1 && (!title || !content)) {
      setError('Please fill in title and content');
      return;
    }
    
    if (currentStep === 2 && !location) {
      setError('Please select a location');
      return;
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 1: Write Your Message</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Give your time capsule a title"
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Write a message to your future self or others..."
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-1">
                Add Media (Optional)
              </label>
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
              />
              <p className="mt-1 text-xs text-gray-500">Max file size: 10MB</p>
              
              {mediaPreview && (
                <div className="mt-3 border border-gray-200 rounded-md p-2">
                  {mediaFile?.type.startsWith('image/') ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="max-h-48 mx-auto"
                    />
                  ) : mediaFile?.type.startsWith('video/') ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-48 mx-auto"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
              >
                Next: Choose Location
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 2: Choose Location</h2>
            <p className="text-gray-600">
              Select the location where this time capsule can be unlocked.
              Click on the map to set the location.
            </p>
            
            <div className="h-96 border border-gray-300 rounded-md overflow-hidden">
              <MapWithNoSSR
                height="100%"
                interactive={true}
                onLocationSelect={handleLocationSelect}
                markers={location ? [
                  {
                    position: location,
                    popup: 'Capsule Location'
                  }
                ] : []}
                center={location}
              />
            </div>
            
            {location && (
              <p className="text-sm text-gray-600">
                Selected location: {location.latitude.toFixed(6)},{' '}
                {location.longitude.toFixed(6)}
              </p>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!location}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                Next: Set Unlock Date
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 3: Set Unlock Date</h2>
            <p className="text-gray-600">
              Choose when your time capsule can be unlocked. It must be a future date.
            </p>
            
            <div>
              <label htmlFor="unlockDate" className="block text-sm font-medium text-gray-700 mb-1">
                Unlock Date
              </label>
              <input
                id="unlockDate"
                type="date"
                value={format(unlockDate, 'yyyy-MM-dd')}
                onChange={(e) => setUnlockDate(new Date(e.target.value))}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                Make this capsule public when unlocked
              </label>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium">Review Your Time Capsule</h3>
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Content:</strong> {content.length > 100 ? `${content.substring(0, 100)}...` : content}</p>
                <p><strong>Media:</strong> {mediaFile ? mediaFile.name : 'None'}</p>
                <p><strong>Location:</strong> {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not selected'}</p>
                <p><strong>Unlock Date:</strong> {format(unlockDate, 'MMMM d, yyyy')}</p>
                <p><strong>Visibility:</strong> {isPublic ? 'Public when unlocked' : 'Always private'}</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Time Capsule'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create a New Time Capsule</h1>
        
        {error && <div className="p-3 bg-red-100 text-red-700 mb-4 rounded">{error}</div>}
        
        {success ? (
          <div className="p-4 bg-green-100 text-green-700 rounded">
            <p>Your time capsule has been created successfully!</p>
            <p>Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        step <= currentStep 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 text-gray-600'
                      } text-sm`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`h-1 w-12 ${
                          step < currentStep ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {renderStepContent()}
          </form>
        )}
      </div>
    </Layout>
  );
}