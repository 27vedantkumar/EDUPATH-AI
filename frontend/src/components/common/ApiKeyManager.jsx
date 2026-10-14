import React, { useState, useEffect } from 'react';

export default function ApiKeyManager() {
  const [apiKey, setApiKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load existing key on mount
  useEffect(() => {
    const existingKey = localStorage.getItem('GEMINI_API_KEY');
    if (existingKey) {
      setApiKey(existingKey);
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim() === '') {
      localStorage.removeItem('GEMINI_API_KEY');
      setIsSaved(false);
    } else {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setIsSaved(true);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded hover:bg-gray-700 transition cursor-pointer flex items-center gap-1.5"
      >
        {isSaved ? "🟢 AI Live Mode Active" : "🔴 AI Offline (Click to connect)"}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-80 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
          <h3 className="text-white font-semibold mb-2">Configure Live AI</h3>
          <p className="text-xs text-gray-400 mb-3">
            Paste a Gemini API key to override the local engine and enable dynamic responses. 
          </p>
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 mb-3 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-blue-600 text-white text-xs px-4 py-1 rounded hover:bg-blue-500 cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { ApiKeyManager };
