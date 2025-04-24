import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '@aws-amplify/api';
import { Event } from '../types/event';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<Event | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const response = await get({
        apiName: 'eventique',
        path: `/events/${id}`
      }).response;

      const jsonData = await response.body.json();
      // Parse the JSON string if it's a string
      const data: Event = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      setEvent(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setLoading(false);
      setEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
        <button
          onClick={() => navigate('/events')}
          className="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={() => navigate('/events')}
        className="mb-8 text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
      >
        ← Back to events
      </button>

      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="w-5 h-5 mr-2" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="w-5 h-5 mr-2" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <User className="w-5 h-5 mr-2" />
            <span>{event.organizer}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About this event</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
        </div>

        {event.category && (
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
            {event.category}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;