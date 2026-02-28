// Modal de autenticación (Fase 4)
// Tabs: "Crear cuenta" / "Iniciar sesión"
// Validación en tiempo real de email, contraseña y confirmación
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
  const { register, login, error: authError } = useAuth();

  const [tab, setTab] = useState('register'); // register | login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validaciones en tiempo real
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword;

  const isFormValid = tab === 'login'
    ? isEmailValid && isPasswordValid
    : isEmailValid && isPasswordValid && doPasswordsMatch;

  // Enviar formulario
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
        setError(result.error || 'Error de autenticación');
      }
    } catch (err) {
      setError(err.message || 'Error inesperado');
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
            Crear cuenta
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Iniciar sesión
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Beneficios (solo en registro) */}
          {tab === 'register' && (
            <div className="bg-dark-200 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p className="text-gray-300 font-medium text-sm mb-1">¿Por qué crear cuenta?</p>
              <p>• Tus conversaciones se guardan permanentemente</p>
              <p>• Accede desde cualquier dispositivo</p>
              <p>• Tu perfil se mantiene siempre</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                         focus:outline-none placeholder-gray-600 ${
                email && !isEmailValid ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
              }`}
              autoFocus
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-400 mt-1">Formato de email inválido</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                         focus:outline-none placeholder-gray-600 ${
                password && !isPasswordValid ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
              }`}
            />
            {password && !isPasswordValid && (
              <p className="text-xs text-red-400 mt-1">La contraseña debe tener mínimo 8 caracteres</p>
            )}
          </div>

          {/* Confirmar contraseña (solo registro) */}
          {tab === 'register' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className={`w-full bg-dark-200 border rounded-xl px-4 py-3 text-white
                           focus:outline-none placeholder-gray-600 ${
                  confirmPassword && !doPasswordsMatch ? 'border-red-500' : 'border-dark-100 focus:border-primary-500'
                }`}
              />
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
          )}

          {/* Error */}
          {(error || authError) && (
            <p className="text-red-400 text-sm">{error || authError}</p>
          )}

          {/* Botón de enviar */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium
                       hover:bg-primary-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Procesando...'
              : tab === 'register' ? 'Crear cuenta' : 'Iniciar sesión'
            }
          </button>

          {/* Continuar sin cuenta */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Continuar sin cuenta
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
