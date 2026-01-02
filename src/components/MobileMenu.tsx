import { Disclosure } from '@headlessui/react';
import { Menu as MenuIcon, X, Upload, Settings, LogIn, LogOut, User } from 'lucide-react';

interface MobileMenuProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSettingsClick: () => void;
  onImportClick: () => void;
  onOCRClick?: () => void;
  showOCR?: boolean;
}

export function MobileMenu({
  isAuthenticated,
  userEmail,
  onLoginClick,
  onLogoutClick,
  onSettingsClick,
  onImportClick,
  onOCRClick,
  showOCR = false,
}: MobileMenuProps) {
  return (
    <Disclosure as="div" className="md:hidden">
      {({ open }) => (
        <>
          {/* Hamburger Button */}
          <Disclosure.Button className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span className="sr-only">Open menu</span>
            {open ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <MenuIcon className="block h-6 w-6" aria-hidden="true" />
            )}
          </Disclosure.Button>

          {/* Mobile Menu Panel */}
          <Disclosure.Panel className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <div className="px-4 py-3 space-y-2">
              {/* User Section */}
              {isAuthenticated ? (
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <User size={16} />
                    <span className="font-medium">{userEmail}</span>
                  </div>
                  <button
                    onClick={onLogoutClick}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  Login
                </button>
              )}

              {/* Actions */}
              <button
                onClick={onImportClick}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Upload size={18} />
                Import More
              </button>

              {showOCR && onOCRClick && (
                <button
                  onClick={onOCRClick}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Upload size={18} />
                  OCR Upload
                </button>
              )}

              <button
                onClick={onSettingsClick}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings size={18} />
                Settings
              </button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

