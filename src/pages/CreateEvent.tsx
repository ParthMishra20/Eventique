import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '@aws-amplify/api';
import { uploadData } from '@aws-amplify/storage';
import { getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      let imageUrl = '';

      // Step 1: Upload image if provided
      if (imageFile) {
        try {
          const key = `events/${Date.now()}-${imageFile.name}`;
          setDebugInfo(prev => prev ? `${prev}\n1. Uploading image...` : '1. Uploading image...');
          
          await uploadData({
            key,
            data: imageFile,
            options: { contentType: imageFile.type }
          });
          
          imageUrl = key;
          setDebugInfo(prev => `${prev}\n✓ Image uploaded successfully as: ${key}`);
        } catch (imgError) {
          console.error('Image upload error:', imgError);
          setDebugInfo(prev => `${prev}\n⚠️ Image upload failed: ${imgError instanceof Error ? imgError.message : 'Unknown error'}`);
          // Continue without image if upload fails
        }
      }

      // Step 2: Get user data and auth token
      setDebugInfo(prev => `${prev}\n2. Getting user data and authentication...`);
      const user = await getCurrentUser();
      const authSession = await fetchAuthSession();
      const token = authSession.tokens?.idToken?.toString() || '';
      
      if (!token) {
        setDebugInfo(prev => `${prev}\n⚠️ No authentication token available. User might need to re-login.`);
      } else {
        setDebugInfo(prev => `${prev}\n✓ Authentication token retrieved`);
      }
      
      // Step 3: Prepare event data
      setDebugInfo(prev => `${prev}\n3. Preparing event data...`);
      const dateStr = formData.get('date') as string;
      const timeStr = formData.get('time') as string;
      const combinedDateTime = new Date(`${dateStr}T${timeStr}`);
      const isoDateTimeString = combinedDateTime.toISOString();

      const eventId = uuidv4();
      
      const eventData = {
        id: eventId,
        title: formData.get('title') as string,
        date: isoDateTimeString,
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        imageUrl,
        creatorId: user.userId,
        createdAt: new Date().toISOString()
      };

      console.log("Event data prepared:", eventData);
      setDebugInfo(prev => `${prev}\n✓ Event data prepared with ID: ${eventId}`);

      // Step 4: Send API request
      setDebugInfo(prev => `${prev}\n4. Sending API request to /events...`);
      
      const response = await post({
        apiName: 'eventique-api',
        path: '/events',
        options: {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify(eventData)
        }
      });

      console.log("API response:", response);
      setDebugInfo(prev => `${prev}\n✓ API request successful! Response received.`);
      
      // Short delay to show success message
      setTimeout(() => {
        navigate('/events');
      }, 1000);
      
    } catch (err) {
      console.error('Error creating event:', err);
      
      // Detailed error handling
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
        setDebugInfo(prev => `${prev}\n❌ Error: ${err.message}\n${err.stack || ''}`);
      } else if (typeof err === 'object' && err !== null) {
        setError('Error creating event. See details below.');
        setDebugInfo(prev => `${prev}\n❌ Error object: ${JSON.stringify(err, null, 2)}`);
      } else {
        setError('Unknown error occurred');
        setDebugInfo(prev => `${prev}\n❌ Unknown error: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Event</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-48">
          <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Your existing form fields remain unchanged */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              id="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              name="time"
              id="time"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            id="location"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            id="category"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            <option value="tech">Tech</option>
            <option value="music">Music</option>
            <option value="art">Art</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            id="description"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Event Image</label>
          <input
            type="file"
            name="image"
            id="image"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}