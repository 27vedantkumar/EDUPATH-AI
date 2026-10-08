import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const IngestionModal = ({ isOpen, onClose, onUploadComplete }) => {
  const { currentCourse } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentCourse) return;

    try {
      setUploading(true);
      setError(null);
      setStatusMessage('Uploading and extracting multimodal assets...');
      setProgress(25);

      // Simulated progressive updates for UX while backend processes
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 400);

      const res = await api.uploadMaterial(currentCourse.id, file);
      clearInterval(interval);
      setProgress(100);
      setStatusMessage('Knowledge units parsed, embedded, and taxonomy updated!');
      setSuccess(true);
      if (onUploadComplete) onUploadComplete(res);
      setTimeout(() => {
        onClose();
        setUploading(false);
        setFile(null);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to ingest document. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-400" />
          Ingest Course Learning Material
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload textbooks (PDF), slide decks (PPTX), lecture recordings (MP4), or documents (DOCX). Content is automatically chunked, mapped to topics, and source-grounded.
        </p>

        <div className="mt-4 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/40 text-center transition-colors">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.pptx,.ppt,.docx,.txt,.mp4"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Choose a file or drag here'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports PDF, PPTX, DOCX, and MP4 (transcripts)
            </span>
          </label>
        </div>

        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{statusMessage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Document successfully ingested and indexed into course knowledge base!</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Start Ingestion</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
