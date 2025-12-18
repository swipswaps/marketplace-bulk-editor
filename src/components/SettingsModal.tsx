import React, { useState } from 'react';
import { X, Moon, Sun, Shield, Scale, FileWarning, ExternalLink, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onDarkModeToggle,
}) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });

  const handleAcceptTerms = (accepted: boolean) => {
    setHasAcceptedTerms(accepted);
    localStorage.setItem('termsAccepted', String(accepted));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings & Legal Notice</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

