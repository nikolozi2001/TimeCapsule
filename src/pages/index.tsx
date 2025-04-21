import React from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Layout>
      <div className="space-y-16 py-8">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-primary">Local</span> Time Capsules
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Create memories tied to specific locations and unlock them when you return.
            Share your past with your future self, or leave surprises for friends and loved ones.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <button
                onClick={() => router.push('/create')}
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg text-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Create a Time Capsule
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-primary text-white font-medium rounded-lg text-lg shadow-md hover:bg-blue-600 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-white text-primary font-medium rounded-lg text-lg shadow-md border border-primary hover:bg-gray-50 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Create a Capsule</h3>
              <p className="text-gray-600">
                Write a message, upload photos or videos, and select a location where your capsule should be unlocked.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Wait for the Date</h3>
              <p className="text-gray-600">
                Set an unlock date in the future. Your capsule will stay securely locked until then.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Return to Unlock</h3>
              <p className="text-gray-600">
                Visit the location after the unlock date has passed to open your time capsule and relive the memory.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Travelers</h3>
              <p className="text-gray-600">Leave messages for your future self at memorable destinations.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Couples</h3>
              <p className="text-gray-600">Create romantic surprises at places special to your relationship.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Families</h3>
              <p className="text-gray-600">Preserve memories of family trips and milestones for years to come.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Friends</h3>
              <p className="text-gray-600">Leave fun surprises for friends to discover when they visit certain places.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Start Creating Memories Today</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Don't let special moments fade away. Capture them in time and space with Local Time Capsules.
          </p>
          {user ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg text-lg shadow-md hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          ) : (
            <Link
              href="/signup"
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg text-lg shadow-md hover:bg-blue-600 transition-colors"
            >
              Create Your Free Account
            </Link>
          )}
        </section>
      </div>
    </Layout>
  );
}