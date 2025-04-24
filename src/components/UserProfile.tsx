import { useState, useEffect, FormEvent } from 'react';
import { getCurrentUser, fetchUserAttributes, updateUserAttributes, UpdateUserAttributesOutput } from '@aws-amplify/auth';

interface UserAttributes {
  email: string; // Email is usually read-only after signup
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<UserAttributes | null>(null); // Holds fetched attributes
  const [loading, setLoading] = useState(true); // For initial fetch
  const [error, setError] = useState<string | null>(null); // For fetch/update errors
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [updateLoading, setUpdateLoading] = useState(false); // For update process
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null); // Success message

  // State for editable fields
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  // Add state for picture if you want to allow updating it

  useEffect(() => {
    async function fetchUserData() {
      try {
        // First get the current user
        await getCurrentUser();
        
        // Then fetch user attributes
        const attributes = await fetchUserAttributes();
        
        setUser({
          email: attributes.email || '',
          given_name: attributes.given_name,
          family_name: attributes.family_name,
          picture: attributes.picture // Assuming picture is a URL string
        }); // End of object passed to setUser

        // Initialize form state with fetched data
        // Note: We use attributes directly here as setUser might be async
        setGivenName(attributes.given_name || '');
        setFamilyName(attributes.family_name || '');
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []); // Fetch only on initial mount

  // Handle profile update submission
  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);
    setUpdateSuccess(null);

    try {
      const attributesToUpdate = {
        given_name: givenName,
        family_name: familyName,
        // Add picture here if implementing picture update
      };

      const output: UpdateUserAttributesOutput = await updateUserAttributes({
        userAttributes: attributesToUpdate,
      });

      // Check if confirmation is needed for any attribute (e.g., email)
      // This example assumes given_name and family_name don't require confirmation
      console.log('Update output:', output);

      // Update local state to reflect changes immediately
      setUser(prevUser => prevUser ? { ...prevUser, ...attributesToUpdate } : null);
      setUpdateSuccess('Profile updated successfully!');
      setIsEditing(false); // Exit edit mode on success

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setUpdateLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">No user data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      {/* Display Area */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          {user.picture && (
            <img
            src={user.picture} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-2 border-gray-200"
          />
        )}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {user.given_name && user.family_name 
              ? `${user.given_name} ${user.family_name}`
              : user.email}
          </h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Display/Edit Form */}
      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="mt-6 border-t pt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile Information</h3>

          {/* Error and Success Messages */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {updateSuccess && <p className="text-sm text-green-600">{updateSuccess}</p>}

          <div>
            <label htmlFor="givenName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              id="givenName"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email (read-only)</p>
            <p className="mt-1 text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-200">{user.email}</p>
          </div>
          {/* Add input for picture URL if needed */}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset form fields to original values if needed
                setGivenName(user.given_name || '');
                setFamilyName(user.family_name || '');
                setError(null); // Clear errors on cancel
                setUpdateSuccess(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            {user.given_name ? (
              <div>
                <p className="text-sm font-medium text-gray-500">First Name</p>
                <p className="mt-1">{user.given_name}</p>
              </div>
            ) : <p className="text-sm text-gray-500">First Name not set.</p>}
            {user.family_name ? (
              <div>
                <p className="text-sm font-medium text-gray-500">Last Name</p>
                <p className="mt-1">{user.family_name}</p>
              </div>
            ) : <p className="text-sm text-gray-500">Last Name not set.</p>}
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{user.email}</p>
            </div>
            {/* Display picture if available */}
          </div>
        </div>
      )}
    </div>
  );
}
