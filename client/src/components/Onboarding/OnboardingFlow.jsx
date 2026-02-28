// Flujo de onboarding de 2 pantallas (Fase 5.1)
// Soy/Busco — se muestra antes del mapa para usuarios nuevos
import { useState } from 'react';
import { saveOnboarding } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UserTypeSelector from './UserTypeSelector';
import SeekingSelector from './SeekingSelector';

const OnboardingFlow = ({ onComplete }) => {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [seekingTypes, setSeekingTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 1 && userType) {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    if (seekingTypes.length === 0) return;

    setSaving(true);
    setError('');

    try {
      const result = await saveOnboarding(userType, seekingTypes);

      // Guardar en localStorage como respaldo
      localStorage.setItem('whynot_userType', userType);
      localStorage.setItem('whynot_seekingTypes', JSON.stringify(seekingTypes));

      // Actualizar contexto
      updateUser({
        userType: result.userType,
        seekingTypes: result.seekingTypes,
        onboardingComplete: true
      });

      onComplete();
    } catch (err) {
      setError(err.message || 'Error guardando preferencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-dark-400 flex flex-col">
      {/* Barra de progreso */}
      <div className="flex gap-2 px-6 pt-6">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-dark-100'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-dark-100'}`} />
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto">
        {step === 1 ? (
          <UserTypeSelector selected={userType} onSelect={setUserType} />
        ) : (
          <SeekingSelector selected={seekingTypes} onToggle={setSeekingTypes} />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm text-center px-6">{error}</p>
      )}

      {/* Botón de acción */}
      <div className="px-6 pb-8 pt-4">
        {step === 1 ? (
          <button
            onClick={handleNext}
            disabled={!userType}
            className="w-full py-4 rounded-2xl bg-primary-600 text-white font-semibold text-lg
                       hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleComplete}
              disabled={seekingTypes.length === 0 || saving}
              className="w-full py-4 rounded-2xl bg-primary-600 text-white font-semibold text-lg
                         hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Continuar al mapa'}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 text-gray-400 text-sm hover:text-white transition-colors"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
