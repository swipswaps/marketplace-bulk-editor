import { useState } from 'react';
import { Save, Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';
import type { MarketplaceListing } from '../types';

interface SaveTemplateModalProps {
  templateData: {
    sheetName?: string;
    headerRows?: string[][];
    columnHeaders?: string[];
    sampleData?: MarketplaceListing[];
  };
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveTemplateModal({ templateData, onClose, onSaved }: SaveTemplateModalProps) {
  const { accessToken } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!accessToken) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          template_data: templateData,
          is_public: isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Mobile-friendly footer with larger touch targets
  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
      <button
        onClick={onClose}
        className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] sm:min-h-0 order-2 sm:order-1"
        disabled={saving}
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 order-1 sm:order-2"
        disabled={saving || !name.trim()}
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Saving...
          </>
        ) : (
          <>
            <Save size={18} className="sm:w-4 sm:h-4" />
            Save Template
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Save Template"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm sm:text-base text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="template-name" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name *
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim() && !saving) {
                handleSave();
              }
            }}
            className="w-full px-3 py-3 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            placeholder="e.g., Solar Panel Template"
            disabled={saving}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="template-description" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            id="template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && name.trim() && !saving) {
                handleSave();
              }
            }}
            rows={3}
            className="w-full px-3 py-3 sm:py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe this template..."
            disabled={saving}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg border transition-colors min-h-[44px] sm:min-h-0 ${
              isPublic
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            disabled={saving}
          >
            {isPublic ? <Globe size={18} className="sm:w-4 sm:h-4" /> : <Lock size={18} className="sm:w-4 sm:h-4" />}
            <span className="text-base sm:text-sm font-medium">
              {isPublic ? 'Public' : 'Private'}
            </span>
          </button>
          <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            {isPublic ? 'Anyone can use this template' : 'Only you can use this template'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

