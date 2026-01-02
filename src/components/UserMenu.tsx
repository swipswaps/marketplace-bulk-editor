/**
 * User Menu Component
 * Shows login status and provides logout option
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, LogIn, Settings, Shield } from 'lucide-react';

interface UserMenuProps {
  onLoginClick: () => void;
  onSettingsClick: () => void;
  onAdminClick: () => void;
}

export function UserMenu({ onLoginClick, onSettingsClick, onAdminClick }: UserMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="btn-mobile flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors select-text"
        aria-label="Login to your account"
      >
        <LogIn size={18} aria-hidden="true" />
        <span>Login</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors select-text"
        aria-label={`User menu for ${user?.email}`}
        aria-expanded={isOpen}
      >
        <User size={18} aria-hidden="true" />
        <span className="max-w-[150px] truncate">{user?.email}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu content */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate select-text">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 select-text">
                {user?.is_admin ? 'Admin' : 'User'}
              </p>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onSettingsClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-text"
                aria-label="User settings"
              >
                <Settings size={16} aria-hidden="true" />
                <span>Settings</span>
              </button>

              {user?.is_admin && (
                <button
                  type="button"
                  onClick={() => {
                    onAdminClick();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors select-text"
                  aria-label="Admin panel"
                >
                  <Shield size={16} aria-hidden="true" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors select-text"
                aria-label="Logout from your account"
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

