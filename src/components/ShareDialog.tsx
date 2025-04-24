import React, { useState } from 'react';
import { Copy, X } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, eventId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/event/${eventId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4">Share Event</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Copy size={20} />
          </button>
        </div>
        
        {copied && (
          <p className="text-green-600 text-sm mt-2">Link copied to clipboard!</p>
        )}
      </div>
    </div>
  );
};

export default ShareDialog;