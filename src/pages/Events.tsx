import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, AlertCircle } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Event } from '../types/event';
import { getUpcomingEvents } from '../services/events';

const Events = () => {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [category, setCategory] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchEvents();
  }, []); // Initial fetch on mount

  // Re-fetch events when the window gains focus
  React.useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, re-fetching events...");
      fetchEvents();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array means this effect runs once to set up the listener

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching events from service...");
      
      const eventsData = await getUpcomingEvents();
      console.log("Events received:", eventsData);
      
      // Filter out any invalid events
      const validEvents = eventsData.filter(event => {
        if (!event.id || !event.title || !event.date) {
          console.warn('Invalid event data:', event);
          return false;
        }
        return true;
      });

      setEvents(validEvents);
      setError(null);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = !category || event.category === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-4xl font-bold text-gray-900">Upcoming Events</h1>
          <button
            onClick={() => navigate('/create-event')} // Fixed navigation path
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="w-full sm:w-64 pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
            />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 appearance-none bg-white"
            >
              <option value="">All Categories</option>
              <option value="tech">Tech</option>
              <option value="music">Music</option>
              <option value="art">Art</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error message display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button 
            onClick={fetchEvents} 
            className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
      
      {!error && filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;