// Configuración de cuenta
// Si anónimo: muestra opción de crear cuenta con beneficios
// Si registrado: muestra email, cambiar contraseña, eliminar cuenta
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changePassword, deleteAccount } from '../../services/api';

const AccountSettings = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, isAnonymous, logout } = useAuth();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 8) return;

    setSaving(true);
    setError('');

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      await logout();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-up">
      <div className="flex-shrink-0 h-8 md:h-16" onClick={onClose} />

      <div className="flex-1 bg-dark-300 rounded-t-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-300 border-b border-dark-100 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            Cerrar
          </button>
          <h2 className="font-semibold">Cuenta</h2>
          <div className="w-12" />
        </div>

        <div className="px-4 py-5 space-y-5">
          {isAnonymous ? (
            // --- Vista para usuario anónimo ---
            <>
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
                <p className="text-yellow-200 font-medium text-sm">Estás usando una sesión temporal</p>
                <p className="text-yellow-300/80 text-xs mt-1">
                  Tus conversaciones y perfil se guardarán por 30 días. Crea una cuenta para mantenerlos permanentemente.
                </p>
              </div>

              <div className="bg-dark-200 rounded-xl p-4 space-y-3">
                <h3 className="font-medium">Crear una cuenta</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    Tus datos se guardan permanentemente
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    Accede desde cualquier dispositivo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    Tu perfil y conversaciones se mantienen
                  </li>
                </ul>

                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium
                             hover:bg-primary-700 transition-colors mt-3"
                >
                  Crear cuenta
                </button>
              </div>
            </>
          ) : (
            // --- Vista para usuario registrado ---
            <>
              <div className="bg-dark-200 rounded-xl p-4">
                <p className="text-gray-400 text-xs">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              {/* Cambiar contraseña */}
              <div className="bg-dark-200 rounded-xl p-4">
                {!showChangePassword ? (
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="text-primary-400 text-sm hover:text-primary-300 transition-colors"
                  >
                    Cambiar contraseña
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Contraseña actual"
                      className="w-full bg-dark-300 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm
                                 focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña (mín. 8 caracteres)"
                      className="w-full bg-dark-300 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm
                                 focus:border-primary-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowChangePassword(false)}
                        className="flex-1 py-2 rounded-xl bg-dark-100 text-gray-300 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || newPassword.length < 8}
                        className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm
                                   disabled:opacity-40"
                      >
                        {saving ? 'Guardando...' : 'Cambiar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={async () => { await logout(); onClose(); }}
                className="w-full py-3 rounded-xl bg-dark-200 text-gray-300 hover:bg-dark-100 transition-colors"
              >
                Cerrar sesión
              </button>

              {/* Eliminar cuenta */}
              <div className="pt-4 border-t border-dark-100">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    Eliminar cuenta
                  </button>
                ) : (
                  <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                    <p className="text-red-300 text-sm mb-3">
                      ¿Estás seguro? Tu cuenta se eliminará permanentemente en 7 días.
                      Todas tus conversaciones y datos se perderán.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-xl bg-dark-200 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm"
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mensajes */}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
