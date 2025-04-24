import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from '@aws-amplify/auth';

export default function Sidebar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    // Base classes for button-like appearance
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-colors duration-150 ease-in-out';
    
    // Active state classes
    const activeClasses = 'bg-indigo-600 text-white';
    
    // Inactive state classes with hover effect
    const inactiveClasses = 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700';

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Eventique</span>
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
              <Link to="/events" className={navLinkClasses('/events')}>
                <span>Events</span>
              </Link>
              <Link to="/events/create" className={navLinkClasses('/events/create')}>
                <span>Create Event</span>
              </Link>
              <Link to="/profile" className={navLinkClasses('/profile')}>
                <span>Profile</span>
              </Link>
            </div>
          </div>

          {/* Right side: Sign Out & Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md flex items-center space-x-2"
            >
              <span>Sign Out</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-4 md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1">
          {/* Mobile Menu Dropdown */}
          <Link
            to="/events"
            className={`${navLinkClasses('/events')} block w-full text-left`} // Ensure block and text alignment
            onClick={() => setIsMenuOpen(false)}
          >
            Events
          </Link>
          <Link
            to="/events/create"
            className={`${navLinkClasses('/events/create')} block w-full text-left`}
            onClick={() => setIsMenuOpen(false)}
          >
            Create Event
          </Link>
          <Link
            to="/profile"
            className={`${navLinkClasses('/profile')} block w-full text-left`}
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </nav>
  );
}