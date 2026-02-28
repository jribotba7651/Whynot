// Edición de perfil propio
// Permite actualizar nombre, edad, bio, lookingFor, intereses y privacidad
import { useState, useEffect } from 'react';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../UI/Avatar';

const LOOKING_FOR_OPTIONS = [
  { value: 'amistad', label: 'Amistad' },
  { value: 'citas', label: 'Citas' },
  { value: 'networking', label: 'Networking' },
  { value: 'lo-que-sea', label: 'Lo que sea' }
];

const INTERESTS = [
  'música', 'deportes', 'arte', 'tecnología', 'gastronomía',
  'viajes', 'gaming', 'lectura', 'fitness', 'cine'
];

const ProfileEdit = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('lo-que-sea');
  const [interests, setInterests] = useState([]);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar datos existentes del perfil
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.profile?.displayName || user.displayName || '');
      setAge(user.profile?.age?.toString() || '');
      setBio(user.profile?.bio || '');
      setLookingFor(user.profile?.lookingFor || 'lo-que-sea');
      setInterests(user.profile?.interests || []);
      setShowAge(user.profile?.showAge !== false);
      setShowDistance(user.profile?.showDistance !== false);
    }
  }, [isOpen, user]);

  const toggleInterest = (interest) => {
    setInterests(prev => {
      if (prev.includes(interest)) return prev.filter(i => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const profileData = {
        displayName: displayName.trim(),
        age: age ? parseInt(age) : undefined,
        bio: bio.trim(),
        lookingFor,
        interests,
        showAge,
        showDistance
      };

      const result = await updateProfile(profileData);

      updateUser({
        displayName: displayName.trim(),
        profile: result.profile,
        isProfileComplete: result.isProfileComplete
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error guardando perfil');
    } finally {
      setSaving(false);
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
            Cancelar
          </button>
          <h2 className="font-semibold">Editar perfil</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-primary-400 font-medium hover:text-primary-300 transition-colors disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Preview del avatar */}
          <div className="flex justify-center">
            <Avatar
              name={displayName || user?.displayName}
              userId={user?.id}
              size="xl"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.substring(0, 30))}
              placeholder="Tu nombre"
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">{displayName.length}/30</p>
          </div>

          {/* Edad */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Edad</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="18"
              max="99"
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.substring(0, 200))}
              placeholder="Cuéntanos sobre ti..."
              rows={3}
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm
                         focus:border-primary-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
          </div>

          {/* Qué buscas */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">¿Qué buscas?</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLookingFor(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    lookingFor === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intereses */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Intereses ({interests.length}/5)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    interests.includes(interest)
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Privacidad */}
          <div className="space-y-3">
            <label className="block text-sm text-gray-400">Privacidad</label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Mostrar mi edad</span>
              <div
                onClick={() => setShowAge(!showAge)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
                  showAge ? 'bg-primary-600' : 'bg-dark-100'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    showAge ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Mostrar distancia</span>
              <div
                onClick={() => setShowDistance(!showDistance)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
                  showDistance ? 'bg-primary-600' : 'bg-dark-100'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    showDistance ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Mensajes de estado */}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">Perfil actualizado</p>}

          {/* Espacio extra para scroll en móvil */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
