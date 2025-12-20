import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { API_BASE } from '../config';

interface BackendStatusProps {
  className?: string;
}

interface BackendHealth {
  status: 'connected' | 'disconnected' | 'checking';
  message: string;
  endpoints?: {
    auth: string;
    export: string;
    health: string;
    listings: string;
    ocr: string;
    templates: string;
  };
  version?: string;
  attempts: number;
  maxAttempts: number;
}

export function BackendStatus({ className = '' }: BackendStatusProps) {
  const [health, setHealth] = useState<BackendHealth>({
    status: 'checking',
    message: 'Checking Docker connection...',
    attempts: 0,
    maxAttempts: 3,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_BASE}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setHealth({
          status: 'connected',
          message: 'Docker Backend Connected',
          endpoints: data.endpoints,
          version: data.version,
          attempts: health.attempts + 1,
          maxAttempts: 3,
        });
        setShowSetupGuide(false);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const newAttempts = health.attempts + 1;
      setHealth({
        status: 'disconnected',
        message: error instanceof Error ? error.message : 'Connection failed',
        attempts: newAttempts,
        maxAttempts: 3,
      });
      
      // Show setup guide after max attempts
      if (newAttempts >= 3) {
        setShowSetupGuide(true);
      }
    }
  };

  useEffect(() => {
    // Initial check
    checkBackend();

    // Poll every 10 seconds
    const interval = setInterval(checkBackend, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (health.status) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'disconnected':
        return <XCircle className="text-red-500" size={20} />;
      case 'checking':
        return <AlertCircle className="text-yellow-500 animate-pulse" size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'connected':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'disconnected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'checking':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Status Indicator */}
      <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 select-text"
        >
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {health.status === 'checking' && '🔄 '}
              {health.message}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Connection attempts:</span>
              <span className="font-mono">{health.attempts} / {health.maxAttempts}</span>
            </div>

            {health.status === 'connected' && health.endpoints && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version:</span>
                  <span className="font-mono">{health.version}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Available endpoints:</span>
                  <ul className="text-xs space-y-1 ml-4">
                    {Object.entries(health.endpoints).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-500" />
                        <code className="text-gray-700 dark:text-gray-300">{value}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {health.status === 'disconnected' && showSetupGuide && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  🚀 Start Docker Backend
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Run this command in your terminal:
                </p>
                <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                  ./docker-start.sh
                </code>
                <a
                  href="https://github.com/swipswaps/marketplace-bulk-editor#docker-deployment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink size={12} />
                  Setup Guide
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

