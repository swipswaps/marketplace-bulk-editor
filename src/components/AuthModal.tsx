/**
 * Authentication Modal (Login/Register)
 * Based on React form best practices and UX patterns
 * UX improvements: password visibility toggle, real-time validation, better error messages
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

// Password strength validation
interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

function validatePasswordStrength(password: string): PasswordStrength {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isValid: password.length >= 8 &&
             /[A-Z]/.test(password) &&
             /[a-z]/.test(password) &&
             /[0-9]/.test(password) &&
             /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordStrength = validatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    // Validation
    if (!email || !password) {
      setFormError('Email and password are required');
      return;
    }

    if (mode === 'register') {
      // Check name fields
      if (!firstName?.trim() || !lastName?.trim()) {
        setFormError('First name and last name are required');
        return;
      }

      // Check password strength
      if (!passwordStrength.isValid) {
        setFormError('Password does not meet strength requirements');
        return;
      }

      // Check password match
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, firstName.trim(), lastName.trim());
      }
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordTouched(false);
    } catch {
      // Error is handled by AuthContext
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormError('');
    clearError();
    setPasswordTouched(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const displayError = formError || error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Login to Your Account' : 'Create an Account'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {displayError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Name fields (register only) */}
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="John"
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Doe"
                required
                autoComplete="family-name"
              />
            </div>
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength indicator (register mode only) */}
          {mode === 'register' && passwordTouched && password && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-1">
                {passwordStrength.hasMinLength ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-gray-400" />
                )}
                <span className={passwordStrength.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordStrength.hasUppercase ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-gray-400" />
                )}
                <span className={passwordStrength.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordStrength.hasLowercase ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-gray-400" />
                )}
                <span className={passwordStrength.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordStrength.hasDigit ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-gray-400" />
                )}
                <span className={passwordStrength.hasDigit ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                  One number
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordStrength.hasSpecialChar ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-gray-400" />
                )}
                <span className={passwordStrength.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                  One special character (!@#$%^&*...)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm password field (register only) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Password match indicator */}
            {confirmPassword && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {password === confirmPassword ? (
                  <>
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || (mode === 'register' && !passwordStrength.isValid)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? (
            <span>Loading...</span>
          ) : mode === 'login' ? (
            <>
              <LogIn size={18} />
              <span>Login</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Helper text for login mode */}
        {mode === 'login' && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Your data is stored locally and optionally synced to the database when logged in.
          </p>
        )}

        {/* Switch mode */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Login
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}

