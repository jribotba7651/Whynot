// Authentication modal (Phase 4)
// Tabs: "Create account" / "Log in"
// Real-time validation for email, password, and confirmation
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const { register, login, error: authError } = useAuth();

  const [tab, setTab] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;

  const isFormValid = tab === 'login'
    ? isEmailValid && isPasswordValid
    : isEmailValid && isPasswordValid && doPasswordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      let result;
      if (tab === 'register') {
        result = await register(email.trim().toLowerCase(), password);
      } else {
        result = await login(email.trim().toLowerCase(), password);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Authentication error');
      }
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md bg-dark-300 rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up">
        {/* Tabs */}
        <div className="flex border-b border-dark-100">
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create account
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Log in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Benefits (register only) */}
          {tab === 'register' && (
            <div className="bg-dark-200 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p className="text-gray-300 font-medium text-sm mb-1">Why create an account?</p>
              <p>• Your conversations are saved permanently</p>
              <p>• Access from any device</p>
              <p>• Your profile stays forever</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                         focus:outline-none placeholder-gray-600 ${
                email && !isEmailValid ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
              }`}
              autoFocus
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-400 mt-1">Invalid email format</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                         focus:outline-none placeholder-gray-600 ${
                password && !isPasswordValid ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
              }`}
            />
            {password && !isPasswordValid && (
              <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm password (register only) */}
          {tab === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                           focus:outline-none placeholder-gray-600 ${
                  confirmPassword && !doPasswordsMatch ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
                }`}
              />
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>
          )}

          {/* Error */}
          {(error || authError) && (
            <p className="text-red-400 text-sm">{error || authError}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium
                       hover:bg-primary-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Processing...'
              : tab === 'register' ? 'Create account' : 'Log in'
            }
          </button>

          {/* Continue without account */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Continue without account
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
