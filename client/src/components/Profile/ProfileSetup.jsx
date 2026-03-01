// Profile setup wizard (3 steps)
// Step 1: Name and age
// Step 2: What are you looking for? (lookingFor)
// Step 3: Interests (max 5)
import { useState } from 'react';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// "Looking for" options with icons
const LOOKING_FOR_OPTIONS = [
  { value: 'friendship', label: 'Friendship', icon: '👥', color: 'border-blue-500 bg-blue-500/10' },
  { value: 'dating', label: 'Dating', icon: '💝', color: 'border-pink-500 bg-pink-500/10' },
  { value: 'networking', label: 'Networking', icon: '💼', color: 'border-green-500 bg-green-500/10' },
  { value: 'whatever', label: 'Whatever', icon: '✨', color: 'border-gray-500 bg-gray-500/10' }
];

// Interest options
const INTERESTS = [
  'music', 'sports', 'art', 'technology', 'food',
  'travel', 'gaming', 'reading', 'fitness', 'movies'
];

const ProfileSetup = ({ isOpen, onClose, onComplete }) => {
  const { updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [lookingFor, setLookingFor] = useState('whatever');
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');

  const isStepValid = () => {
    switch (step) {
      case 1: return displayName.trim().length >= 2 && age >= 18 && age <= 99;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

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

      updateUser({
        displayName: displayName.trim(),
        profile: result.profile,
        isProfileComplete: result.isProfileComplete
      });

      onComplete?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

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
        {/* Progress bar */}
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

        {/* Step 1: Name and age */}
        {step === 1 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">What's your name?</h2>
            <p className="text-gray-400 text-sm mb-6">
              This is how nearby users will see you
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.substring(0, 30))}
                  placeholder="Your name or nickname"
                  className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white
                             focus:border-primary-500 focus:outline-none placeholder-gray-600"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">{displayName.length}/30</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Age</label>
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
                  <p className="text-xs text-red-400 mt-1">Age must be between 18 and 99</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: What are you looking for? */}
        {step === 2 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">What are you looking for?</h2>
            <p className="text-gray-400 text-sm mb-6">
              This helps others know what to expect
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

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="animate-slide-right">
            <h2 className="text-xl font-bold mb-2">Your interests</h2>
            <p className="text-gray-400 text-sm mb-4">
              Select up to 5 interests ({interests.length}/5)
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

            {/* Optional bio */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.substring(0, 200))}
                placeholder="Tell us something about yourself..."
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

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl bg-dark-200 text-gray-300 hover:bg-dark-100 transition-colors"
            >
              Back
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip
          </button>

          <button
            onClick={nextStep}
            disabled={!isStepValid() || saving}
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium
                       hover:bg-primary-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : step === 3 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
