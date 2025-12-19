import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Shield, Scale, FileWarning, ExternalLink, AlertTriangle, Settings, BookOpen, Info, Github, Loader2, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

type TabType = 'settings' | 'help' | 'backend' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onDarkModeToggle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState<string | null>(null);
  const [backendDocsContent, setBackendDocsContent] = useState<string>('');
  const [backendDocsLoading, setBackendDocsLoading] = useState(false);
  const [backendDocsError, setBackendDocsError] = useState<string | null>(null);

  const handleAcceptTerms = (accepted: boolean) => {
    setHasAcceptedTerms(accepted);
    localStorage.setItem('termsAccepted', String(accepted));
  };

  // Fetch README from GitHub when Help tab is opened
  useEffect(() => {
    if (activeTab === 'help' && !readmeContent && !readmeLoading) {
      setReadmeLoading(true);
      setReadmeError(null);

      fetch('https://raw.githubusercontent.com/swipswaps/marketplace-bulk-editor/main/README.md')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch README');
          }
          return response.text();
        })
        .then(text => {
          setReadmeContent(text);
          setReadmeLoading(false);
        })
        .catch(error => {
          console.error('Error fetching README:', error);
          setReadmeError('Failed to load documentation. Please visit the GitHub repository.');
          setReadmeLoading(false);
        });
    }
  }, [activeTab, readmeContent, readmeLoading]);

  // Fetch Backend Documentation when Backend tab is opened
  useEffect(() => {
    if (activeTab === 'backend' && !backendDocsContent && !backendDocsLoading) {
      setBackendDocsLoading(true);
      setBackendDocsError(null);

      fetch('https://raw.githubusercontent.com/swipswaps/marketplace-bulk-editor/main/HOW_TO_USE_DOCKER_BACKEND.md')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch backend documentation');
          }
          return response.text();
        })
        .then(text => {
          setBackendDocsContent(text);
          setBackendDocsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching backend docs:', error);
          setBackendDocsError('Failed to load backend documentation. Please visit the GitHub repository.');
          setBackendDocsLoading(false);
        });
    }
  }, [activeTab, backendDocsContent, backendDocsLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings & Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Settings size={18} />
            Settings & Legal
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'help'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen size={18} />
            Help & Docs
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'backend'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Database size={18} />
            Backend Guide
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              {readmeLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading documentation...</span>
                </div>
              )}

              {readmeError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-300 mb-2">{readmeError}</p>
                  <a
                    href="https://github.com/swipswaps/marketplace-bulk-editor#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on GitHub <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {readmeContent && !readmeLoading && (
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                  prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-2
                  prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                  prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-3
                  prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:font-semibold
                  prose-code:text-sm prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:p-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-8
                  prose-table:border-collapse prose-table:w-full
                  prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left
                  prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-2
                  prose-img:rounded-lg prose-img:shadow-md
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {readmeContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Backend Guide Tab */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              {backendDocsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading backend documentation...</span>
                </div>
              )}

              {backendDocsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm text-red-800 dark:text-red-200 mb-2">{backendDocsError}</p>
                      <a
                        href="https://github.com/swipswaps/marketplace-bulk-editor/blob/main/HOW_TO_USE_DOCKER_BACKEND.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-red-700 dark:text-red-300 hover:underline"
                      >
                        View on GitHub <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {backendDocsContent && !backendDocsLoading && (
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                  prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-2
                  prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                  prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-3
                  prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:font-semibold
                  prose-code:text-sm prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:p-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-8
                  prose-table:border-collapse prose-table:w-full
                  prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left
                  prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-2
                  prose-img:rounded-lg prose-img:shadow-md
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {backendDocsContent}
                  </ReactMarkdown>
                </div>
              )}
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

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

