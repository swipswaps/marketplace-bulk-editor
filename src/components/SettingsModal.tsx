import React, { useState } from 'react';
import { Moon, Sun, Shield, Scale, FileWarning, ExternalLink, AlertTriangle, Settings, BookOpen, Info, Github, Database, Navigation, Terminal } from 'lucide-react';
import { Modal } from './Modal';
import { AuditLogsViewer } from './AuditLogsViewer';
import { useAuth } from '../contexts/AuthContext';
import { CollapsibleMarkdown } from './CollapsibleMarkdown';
import { KeyboardShortcutsReference } from './KeyboardShortcutsReference';
import { BackupManager } from './BackupManager';
import { DebugConsole } from './DebugConsole';
import backendDocsMarkdown from '../../docs/HOW_TO_USE_DOCKER_BACKEND.md?raw';
import userGuideMarkdown from '../../docs/USER_GUIDE.md?raw';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: unknown;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showNavControls: boolean;
  onNavControlsToggle: () => void;
  marketplace: 'facebook' | 'ebay' | 'amazon';
  onMarketplaceChange: (marketplace: 'facebook' | 'ebay' | 'amazon') => void;
  debugLogs: DebugLog[];
  onClearDebugLogs: () => void;
}

type TabType = 'settings' | 'help' | 'backend' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onDarkModeToggle,
  showNavControls,
  onNavControlsToggle,
  marketplace,
  onMarketplaceChange,
  debugLogs,
  onClearDebugLogs,
}) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });

  // Content is now loaded from local files at build time
  const userGuideContent = userGuideMarkdown;  // Practical "how to use" guide
  const backendDocsContent = backendDocsMarkdown;  // Docker backend setup

  const handleAcceptTerms = (accepted: boolean) => {
    setHasAcceptedTerms(accepted);
    localStorage.setItem('termsAccepted', String(accepted));
  };

  // Content is now loaded from local files at build time - no fetching needed

  // Mobile-friendly footer with larger touch target
  const footer = (
    <button
      onClick={onClose}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors min-h-[44px] sm:min-h-0 text-base sm:text-sm"
    >
      Close
    </button>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings & Information"
        size="xl"
        footer={footer}
      >
        {/* Tabs - Mobile responsive with horizontal scroll */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3 font-medium transition-colors whitespace-nowrap min-h-[44px] text-sm sm:text-base ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Settings & Legal</span>
            <span className="sm:hidden">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3 font-medium transition-colors whitespace-nowrap min-h-[44px] text-sm sm:text-base ${
              activeTab === 'help'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen size={18} />
            <span className="hidden sm:inline">How to Use</span>
            <span className="sm:hidden">Help</span>
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3 font-medium transition-colors whitespace-nowrap min-h-[44px] text-sm sm:text-base ${
              activeTab === 'backend'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Database size={18} />
            <span className="hidden sm:inline">Backend Guide</span>
            <span className="sm:hidden">Backend</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3 font-medium transition-colors whitespace-nowrap min-h-[44px] text-sm sm:text-base ${
              activeTab === 'about'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Info size={18} />
            About
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              {/* Settings Section */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={20} className="text-gray-700 dark:text-gray-300" /> : <Sun size={20} className="text-gray-700 dark:text-gray-300" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toggle dark/light theme</p>
                </div>
              </div>
              <button
                onClick={onDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Navigation Controls Toggle */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Navigation size={20} className="text-gray-700 dark:text-gray-300" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Navigation Controls</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Show floating navigation panel</p>
                </div>
              </div>
              <button
                onClick={onNavControlsToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showNavControls ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showNavControls ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Platform Selector */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label htmlFor="settings-marketplace-select" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Platform
              </label>
              <select
                id="settings-marketplace-select"
                value={marketplace}
                onChange={(e) => onMarketplaceChange(e.target.value as 'facebook' | 'ebay' | 'amazon')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Select marketplace platform - different platforms use different databases"
              >
                <option value="facebook">📘 Facebook Marketplace</option>
                <option value="ebay">🛒 eBay</option>
                <option value="amazon">📦 Amazon</option>
              </select>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Different platforms use different databases
              </p>
            </div>

            {/* Audit Logs Button (only when authenticated) */}
            {isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAuditLogs(true)}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">View Audit Logs</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">See all account activity and security events</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            )}
          </div>

          {/* Database Backup Section (only when authenticated) */}
          {isAuthenticated && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database size={20} />
                Database Backup & Restore
              </h3>
              <BackupManager />
            </div>
          )}

          {/* Keyboard Shortcuts Reference */}
          <KeyboardShortcutsReference />

          {/* Debug Logs Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Terminal size={20} />
              Debug Logs
            </h3>

            {/* Database Debug Logs */}
            {debugLogs.length > 0 ? (
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-4">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Database Operations</h4>
                  <button
                    onClick={onClearDebugLogs}
                    className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Clear
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs">
                  {debugLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 ${
                        log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                        log.level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                        log.level === 'success' ? 'text-green-600 dark:text-green-400' :
                        'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500 dark:text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {' '}
                      <span className="font-semibold">
                        {log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : log.level === 'success' ? '✅' : '🔵'}
                      </span>
                      {' '}
                      {log.message}
                      {log.data !== undefined && log.data !== null && (
                        <pre className="mt-1 ml-4 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">No database debug logs yet</p>
            )}

            {/* Global Console Output */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Console Output</h4>
              </div>
              <div className="p-4">
                <DebugConsole />
              </div>
            </div>
          </div>

          {/* Legal Notice Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Important Legal Notice
              </h3>
            </div>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              {/* Trademark Disclaimer */}
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Trademark Disclaimer</p>
                  <p>
                    This software is <strong>NOT affiliated with, maintained, authorized, endorsed, or sponsored by 
                    Meta Platforms, Inc.</strong> or Facebook, Inc. FACEBOOK® and the Facebook logo are registered 
                    trademarks of Meta Platforms, Inc.
                  </p>
                </div>
              </div>

              {/* Copyright & IP Compliance */}
              <div className="flex gap-3">
                <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Copyright & IP Compliance</p>
                  <p>
                    <strong>You are solely responsible</strong> for ensuring all listings comply with intellectual 
                    property laws. <strong className="text-red-600 dark:text-red-400">NO counterfeit, replica, or 
                    unauthorized items.</strong> Violations may result in legal action and account suspension.
                  </p>
                </div>
              </div>

              {/* Commerce Policies */}
              <div className="flex gap-3">
                <FileWarning className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Facebook Commerce Policies</p>
                  <p className="mb-2">
                    You must comply with Meta's Commerce Policies. <strong>Prohibited items include:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                    <li>Alcohol, tobacco, and drugs</li>
                    <li>Weapons, ammunition, and explosives</li>
                    <li>Adult products and services</li>
                    <li>Animals and endangered species</li>
                    <li>Healthcare items (prescription drugs, medical devices)</li>
                    <li>Recalled, illegal, or hazardous products</li>
                    <li>Counterfeit or replica items</li>
                    <li>Digital products and non-physical items</li>
                  </ul>
                  <a
                    href="https://www.facebook.com/policies/commerce"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
                  >
                    View Full Commerce Policies <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mt-4">
                <p className="text-xs text-red-800 dark:text-red-300 font-semibold">
                  ⚠️ USE AT YOUR OWN RISK
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  This software is provided "AS IS" without warranty. The developers assume NO LIABILITY for 
                  account suspensions, policy violations, legal consequences, or any damages arising from use 
                  of this software. You are responsible for compliance with all applicable laws and platform policies.
                </p>
              </div>
            </div>
          </div>

              {/* Terms Acceptance */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAcceptedTerms}
                    onChange={(e) => handleAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand and accept the terms and conditions. I am solely responsible for ensuring my listings
                    comply with all applicable laws, intellectual property rights, and Facebook's Commerce Policies.
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Help Tab - User Guide */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <CollapsibleMarkdown content={userGuideContent} showTableOfContents={true} />
            </div>
          )}

          {/* Backend Guide Tab - Docker Setup */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <CollapsibleMarkdown content={backendDocsContent} showTableOfContents={true} />
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Facebook Marketplace Bulk Editor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  A professional-grade web application for editing and combining Facebook Marketplace bulk upload spreadsheets
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                    React 19
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                    TypeScript
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                    Vite 7
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full">
                    Tailwind CSS
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Github size={20} />
                  Project Links
                </h3>
                <div className="space-y-3">
                  <a
                    href="https://github.com/swipswaps/marketplace-bulk-editor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        GitHub Repository
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        View source code, report issues, contribute
                      </p>
                    </div>
                    <ExternalLink className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" size={18} />
                  </a>

                  <a
                    href="https://swipswaps.github.io/marketplace-bulk-editor/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Live Demo
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Try the app online
                      </p>
                    </div>
                    <ExternalLink className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" size={18} />
                  </a>

                  <a
                    href="https://github.com/swipswaps?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        More Projects by swipswaps
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Explore other repositories
                      </p>
                    </div>
                    <ExternalLink className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" size={18} />
                  </a>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">License & Attribution</h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>License:</strong> MIT License
                  </p>
                  <p>
                    <strong>Author:</strong> swipswaps
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    This software is provided "AS IS" without warranty of any kind. See the LICENSE file for complete terms.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Disclaimer:</strong> This software is NOT affiliated with, maintained, authorized, endorsed,
                  or sponsored by Meta Platforms, Inc. or Facebook, Inc. FACEBOOK® and MARKETPLACE™ are trademarks
                  of Meta Platforms, Inc.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Audit Logs Modal - Nested modal with higher z-index */}
      {showAuditLogs && (
        <AuditLogsViewer onClose={() => setShowAuditLogs(false)} />
      )}
    </>
  );
};

