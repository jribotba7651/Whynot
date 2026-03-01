// Edit own profile
// Includes: name, age, bio, lookingFor, interests, privacy, I am/Looking for, location radius
import { useState, useEffect } from 'react';
import { updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../UI/Avatar';
import LocationPrivacySelector from '../Privacy/LocationPrivacySelector';
import { USER_TYPE_LABELS } from '../../utils/pinColors';

const LOOKING_FOR_OPTIONS = [
  { value: 'friendship', label: 'Friendship' },
  { value: 'dating', label: 'Dating' },
  { value: 'networking', label: 'Networking' },
  { value: 'whatever', label: 'Whatever' }
];

const INTERESTS = [
  'music', 'sports', 'art', 'technology', 'food',
  'travel', 'gaming', 'reading', 'fitness', 'movies'
];

const USER_TYPE_OPTIONS = Object.entries(USER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const SEEKING_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'couples', label: 'Couples' },
  { value: 'anyone', label: 'Everyone' }
];

const ProfileEdit = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('whatever');
  const [interests, setInterests] = useState([]);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [userType, setUserType] = useState(null);
  const [seekingTypes, setSeekingTypes] = useState([]);
  const [privacyRadius, setPrivacyRadius] = useState(500);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.profile?.displayName || user.displayName || '');
      setAge(user.profile?.age?.toString() || '');
      setBio(user.profile?.bio || '');
      setLookingFor(user.profile?.lookingFor || 'whatever');
      setInterests(user.profile?.interests || []);
      setShowAge(user.profile?.showAge !== false);
      setShowDistance(user.profile?.showDistance !== false);
      setUserType(user.userType || null);
      setSeekingTypes(user.seekingTypes || []);
      setPrivacyRadius(user.privacyRadius || 500);
    }
  }, [isOpen, user]);

  const toggleInterest = (interest) => {
    setInterests(prev => {
      if (prev.includes(interest)) return prev.filter(i => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const toggleSeeking = (value) => {
    if (value === 'anyone') {
      if (seekingTypes.includes('anyone')) setSeekingTypes([]);
      else setSeekingTypes(['men', 'women', 'couples', 'anyone']);
    } else {
      setSeekingTypes(prev => {
        let next = prev.includes(value)
          ? prev.filter(s => s !== value && s !== 'anyone')
          : [...prev.filter(s => s !== 'anyone'), value];
        if (next.includes('men') && next.includes('women') && next.includes('couples')) next.push('anyone');
        return next;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const result = await updateProfile({
        displayName: displayName.trim(),
        age: age ? parseInt(age) : undefined,
        bio: bio.trim(),
        lookingFor, interests, showAge, showDistance,
        userType, seekingTypes, privacyRadius
      });
      updateUser({
        displayName: displayName.trim(),
        profile: result.profile,
        isProfileComplete: result.isProfileComplete,
        userType: result.userType,
        seekingTypes: result.seekingTypes,
        privacyRadius: result.privacyRadius
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-up">
      <div className="flex-shrink-0 h-8 md:h-16" onClick={onClose} />
      <div className="flex-1 bg-dark-300 rounded-t-2xl overflow-y-auto">
        <div className="sticky top-0 bg-dark-300 border-b border-dark-100 px-4 py-3 flex items-center justify-between z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Cancel</button>
          <h2 className="font-semibold">Edit profile</h2>
          <button onClick={handleSave} disabled={saving}
            className="text-primary-400 font-medium hover:text-primary-300 transition-colors disabled:opacity-40">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="px-4 py-5 space-y-5">
          <div className="flex justify-center">
            <Avatar name={displayName || user?.displayName} userId={user?.id} size="xl" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value.substring(0, 30))}
              placeholder="Your name"
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none" />
            <p className="text-xs text-gray-500 mt-1">{displayName.length}/30</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="18" max="99"
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.substring(0, 200))}
              placeholder="Tell us about yourself..." rows={3}
              className="w-full bg-dark-200 border border-dark-100 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 focus:outline-none resize-none" />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
          </div>

          {/* I am (Phase 5.1) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">I am...</label>
            <div className="flex flex-wrap gap-2">
              {USER_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setUserType(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    userType === opt.value ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-300 hover:bg-dark-100'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Looking for (Phase 5.1) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Looking for...</label>
            <div className="flex flex-wrap gap-2">
              {SEEKING_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => toggleSeeking(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    seekingTypes.includes(opt.value) ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-300 hover:bg-dark-100'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Connection type</label>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setLookingFor(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    lookingFor === opt.value ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-300 hover:bg-dark-100'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Interests ({interests.length}/5)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    interests.includes(interest) ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-300 hover:bg-dark-100'}`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-gray-400">Privacy</label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show my age</span>
              <div onClick={() => setShowAge(!showAge)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${showAge ? 'bg-primary-600' : 'bg-dark-100'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showAge ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show distance</span>
              <div onClick={() => setShowDistance(!showDistance)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${showDistance ? 'bg-primary-600' : 'bg-dark-100'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showDistance ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          <LocationPrivacySelector value={privacyRadius} onChange={setPrivacyRadius} />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">Profile updated</p>}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
