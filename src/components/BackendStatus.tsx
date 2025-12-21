import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { API_BASE, isGitHubPages } from '../config';

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
  const [showNetworkHelp, setShowNetworkHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect network access (not localhost)
  const isNetworkAccess = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // Platform-specific firewall commands
  const isWindows = typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('win');
  const firewallCmd = isWindows
    ? "New-NetFirewallRule -DisplayName 'Marketplace-Bulk-Editor' -Direction Inbound -Protocol TCP -LocalPort 5173,5000 -Action Allow"
    : 'sudo firewall-cmd --add-port=5173/tcp --add-port=5000/tcp --permanent && sudo firewall-cmd --reload';

  const checkBackend = async () => {
    try {
      console.log(`🔍 Checking backend at ${API_BASE}/`);

      const response = await fetch(`${API_BASE}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connected:', data);
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
        console.error(`❌ Backend returned HTTP ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const newAttempts = health.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';

      console.error(`❌ Backend connection failed (attempt ${newAttempts}/3):`, errorMessage);
      console.error('🔍 Error details:', {
        url: `${API_BASE}/`,
        error: error,
        isGitHubPages: window.location.hostname.includes('github.io'),
        hostname: window.location.hostname,
      });

      setHealth({
        status: 'disconnected',
        message: errorMessage,
        attempts: newAttempts,
        maxAttempts: 3,
      });

      // Show setup guide after max attempts
      if (newAttempts >= 3) {
        console.warn('⚠️ Max connection attempts reached, showing setup guide');
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

                {/* Show network hostname badge if accessed from network */}
                {isNetworkAccess && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      🌐 {window.location.hostname}
                    </span>
                  </div>
                )}

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

                {/* Network Access Help (when accessed from network) */}
                {isNetworkAccess && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowNetworkHelp(!showNetworkHelp)}
                      className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:underline select-text"
                    >
                      🔧 Network access help
                    </button>
                    {showNetworkHelp && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Can't connect from other devices?
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Your firewall may be blocking connections. Run this command in {isWindows ? 'PowerShell (as Admin)' : 'terminal'} to allow access on ports 5173 (frontend) and 5000 (backend):
                        </p>
                        <div className="relative">
                          <code className="block p-2 bg-white dark:bg-gray-900 rounded text-xs font-mono pr-16 overflow-x-auto">
                            {firewallCmd}
                          </code>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(firewallCmd);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              } catch {
                                // Fallback for older browsers
                                const el = document.createElement('textarea');
                                el.value = firewallCmd;
                                document.body.appendChild(el);
                                el.select();
                                document.execCommand('copy');
                                document.body.removeChild(el);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }
                            }}
                            className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 select-text"
                            title="Copy to clipboard"
                          >
                            {copied ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                          After running, other devices on your network can access:<br />
                          <strong className="text-gray-900 dark:text-gray-100">
                            http://{window.location.hostname}:5173
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {health.status === 'disconnected' && showSetupGuide && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                {isGitHubPages ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      🔌 Backend Not Connected
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      GitHub Pages (HTTPS) is trying to connect to localhost:5000 (HTTP).
                    </p>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Troubleshooting steps:
                    </p>
                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-2 ml-4 list-decimal">
                      <li>
                        <strong>Start your local backend:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono">
                          ./docker-start.sh
                        </code>
                      </li>
                      <li>
                        <strong>Verify backend is running:</strong>
                        <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono">
                          curl http://localhost:5000/
                        </code>
                        Should return: <code>{`{"status":"ok"}`}</code>
                      </li>
                      <li>
                        <strong>Check browser console</strong> (F12) for specific error messages
                      </li>
                      <li>
                        <strong>If you see "Mixed Content" errors:</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Modern browsers should allow HTTPS → localhost HTTP automatically</li>
                          <li>• Try Firefox or Chrome (latest versions)</li>
                          <li>• Check browser settings for "Block insecure content" and disable for this site</li>
                        </ul>
                      </li>
                    </ol>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                      💡 Localhost connections are considered secure by modern browsers (MDN 2025)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      🚀 Start Docker Backend
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Run this command in your terminal:
                    </p>
                    <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono">
                      ./docker-start.sh
                    </code>
                  </>
                )}
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

