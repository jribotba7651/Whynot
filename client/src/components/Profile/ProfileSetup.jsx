// Wizard de configuración de perfil (3 pasos)
// Paso 1: Nombre y edad
// Paso 2: ¿Qué buscas? (lookingFor)
// Paso 3: Intereses (máximo 5)
import { useState } from 'react';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Opciones de "qué buscas" con iconos
const LOOKING_FOR_OPTIONS = [
  { value: 'amistad', label: 'Amistad', icon: '👥', color: 'border-blue-500 bg-blue-500/10' },
  { value: 'citas', label: 'Citas', icon: '💝', color: 'border-pink-500 bg-pink-500/10' },
  { value: 'networking', label: 'Networking', icon: '💼', color: 'border-green-500 bg-green-500/10' },
  { value: 'lo-que-sea', label: 'Lo que sea', icon: '✨', color: 'border-gray-500 bg-gray-500/10' }
];

// Opciones de intereses
const INTERESTS = [
  'música', 'deportes', 'arte', 'tecnología', 'gastronomía',
  'viajes', 'gaming', 'lectura', 'fitness', 'cine'
];

const ProfileSetup = ({ isOpen, onClose, onComplete }) => {
  const { updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Datos del formulario
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [lookingFor, setLookingFor] = useState('lo-que-sea');
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');

  // Validar paso actual
  const isStepValid = () => {
    switch (step) {
      case 1: return displayName.trim().length >= 2 && age >= 18 && age <= 99;
      case 2: return true; // lookingFor siempre tiene valor por defecto
      case 3: return true; // Intereses son opcionales
      default: return false;
    }
  };

  // Guardar perfil en el servidor
  const saveProfile = async () => {
    setSaving(true);
    setError('');

    try {
      const profileData = {
        displayName: displayName.trim(),
        age: parseInt(age),
        lookingFor,
        interests,
        bio: bio.trim()
      };

      const result = await updateProfile(profileData);

      // Actualizar contexto de auth
      updateUser({
        displayName: displayName.trim(),
        profile: result.profile,
        isProfileComplete: result.isProfileComplete
      });

      onComplete?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error guardando perfil');
    } finally {
      setSaving(false);
    }
  };

  // Toggle un interés
  const toggleInterest = (interest) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= 5) return prev; // Máximo 5
      return [...prev, interest];
    });
  };

  // Siguiente paso
  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveProfile();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md bg-dark-300 rounded-t-2xl md:rounded-2xl p-6 animate-slide-up">
        {/* Barra de progreso */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-dark-100'
              }`}
            />
          ))}
        </div>

        {/* Paso 1: Nombre y edad */}
        {step === 1 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">¿Cómo te llamas?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Así te verán otros usuarios cercanos
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.substring(0, 30))}
                  placeholder="Tu nombre o apodo"
                  className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white
                             focus:border-primary-500 focus:outline-none placeholder-gray-600"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">{displayName.length}/30</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18"
                  min="18"
                  max="99"
                  className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white
                             focus:border-primary-500 focus:outline-none placeholder-gray-600"
                />
                {age && (age < 18 || age > 99) && (
                  <p className="text-xs text-red-400 mt-1">La edad debe estar entre 18 y 99</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: ¿Qué buscas? */}
        {step === 2 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">¿Qué buscas?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Esto ayuda a otros a saber qué esperar
            </p>

            <div className="grid grid-cols-2 gap-3">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLookingFor(opt.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    lookingFor === opt.value
                      ? opt.color + ' border-opacity-100'
                      : 'border-dark-100 bg-dark-200 hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl block mb-1">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 3: Intereses */}
        {step === 3 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">Tus intereses</h2>
            <p className="text-gray-400 text-sm mb-4">
              Selecciona hasta 5 intereses ({interests.length}/5)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    interests.includes(interest)
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                  } ${interests.length >= 5 && !interests.includes(interest) ? 'opacity-40' : ''}`}
                >
                  {interest}
                </button>
              ))}
            </div>

            {/* Bio opcional */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio (opcional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.substring(0, 200))}
                placeholder="Cuéntanos algo sobre ti..."
                rows={3}
                className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm
                           focus:border-primary-500 focus:outline-none placeholder-gray-600 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl bg-dark-200 text-gray-300 hover:bg-dark-100 transition-colors"
            >
              Atrás
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
          >
            Omitir
          </button>

          <button
            onClick={nextStep}
            disabled={!isStepValid() || saving}
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium
                       hover:bg-primary-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : step === 3 ? 'Completar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
