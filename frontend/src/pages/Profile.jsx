import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useAuthStore } from '../context/store';
import { profileService, kundaliService } from '../services';
import api, { API_BASE_URL } from '../services/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Loading from '../components/Common/Loading';
import LocationPicker from '../components/Location/LocationPicker';
import KundaliPatraView from '../components/KundaliPatraView';

// --- Utilities ---
const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const getErrorMessage = (error, fallback) => {
  const details = error?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item) => item.message).join(', ');
  }
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const buildLocationState = (user) => {
  const city = user?.city || user?.profile?.city || '';
  const district = user?.profile?.district || '';
  const region = user?.profile?.region || '';
  const country = user?.profile?.country || '';

  return {
    city,
    latitude: user?.profile?.latitude ?? '',
    longitude: user?.profile?.longitude ?? '',
    district,
    region,
    country,
    formattedAddress: [city, district, region, country].filter(Boolean).join(', '),
  };
};

const buildKundaliState = (kundali, user) => ({
  dateOfBirth: formatDateForInput(kundali?.user?.dateOfBirth || user?.dateOfBirth),
  birthTime: kundali?.birthTime || '',
  birthPlace: kundali?.birthPlace || '',
  latitude: kundali?.latitude ?? '',
  longitude: kundali?.longitude ?? '',
  timezone: kundali?.timezone || '',
  zodiacSign: kundali?.zodiacSign || '',
  nakshatra: kundali?.nakshatra || '',
  moonSign: kundali?.moonSign || '',
  isVisible: kundali?.isVisible !== false,
  formattedAddress: kundali?.birthPlace || '',
});

// --- Main Component ---
const Profile = () => {
  const { user, setUser } = useAuthStore();

  // 1. Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', bio: '', city: '', height: '', religion: '', occupation: '',
  });

  // 2. Kundali State
  const [kundaliData, setKundaliData] = useState(buildKundaliState(null, null));
  const [savedKundaliData, setSavedKundaliData] = useState(buildKundaliState(null, null));
  const [kundaliPreview, setKundaliPreview] = useState(null);
  const [isKundaliEditing, setIsKundaliEditing] = useState(false);
  const [isKundaliLoading, setIsKundaliLoading] = useState(false);
  const [kundaliAction, setKundaliAction] = useState('');
  const [kundaliMessage, setKundaliMessage] = useState({ text: '', type: '' });

  // 3. Location State
  const [locationData, setLocationData] = useState(buildLocationState(null));
  const [savedLocationData, setSavedLocationData] = useState(buildLocationState(null));
  const [isLocationEditing, setIsLocationEditing] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState({ text: '', type: '' });

  // --- Effects ---
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        city: user.city || '',
        height: user.height || '',
        religion: user.religion || '',
        occupation: user.occupation || '',
      });
      
      const nextLocationState = buildLocationState(user);
      setLocationData(nextLocationState);
      setSavedLocationData(nextLocationState);

      if (user.dateOfBirth) {
        const dob = formatDateForInput(user.dateOfBirth);
        setKundaliData((prev) => ({ ...prev, dateOfBirth: dob }));
        setSavedKundaliData((prev) => ({ ...prev, dateOfBirth: dob }));
      }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadKundali = async () => {
      try {
        const response = await kundaliService.getKundali();
        if (isMounted) {
          const nextKundaliState = buildKundaliState(response.data.kundali, user);
          setKundaliData(nextKundaliState);
          setSavedKundaliData(nextKundaliState);
          setKundaliPreview(null);
        }
      } catch (error) {
        console.error('Error loading kundali:', error);
      }
    };

    if (user?.id) {
      loadKundali();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // --- Profile Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const response = await profileService.updateProfile(formData);
      setUser(response.data.user || response.data);
      setIsEditing(false);
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setProfileMessage({
        text: getErrorMessage(error, 'Failed to update profile.'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '', lastName: user.lastName || '', bio: user.bio || '',
        city: user.city || '', height: user.height || '', religion: user.religion || '',
        occupation: user.occupation || '',
      });
    }
    setIsEditing(false);
    setProfileMessage({ text: '', type: '' });
  };

  const handlePhotoUpload = async (e) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('photo', file);
      
      await profileService.uploadPhoto(formDataObj);
      const response = await profileService.getMyProfile();
      
      const updatedUser = response.data.user || response.data.data || response.data;
      setUser(updatedUser);
      setProfileMessage({ text: 'Photo uploaded successfully!', type: 'success' });
    } catch (error) {
      setProfileMessage({
        text: getErrorMessage(error, 'Failed to upload photo.'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      fileInput.value = '';
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (!photoId) return;
    setIsLoading(true);
    setProfileMessage({ text: '', type: '' });

    try {
      if (profileService.deletePhoto) {
        await profileService.deletePhoto(photoId);
      } else {
        await profileService.updateProfile({ photoIdToRemove: photoId });
      }

      const response = await profileService.getMyProfile();
      const updatedUser = response.data.user || response.data.data || response.data;
      setUser(updatedUser);
      setProfileMessage({ text: 'Photo deleted successfully!', type: 'success' });
    } catch (error) {
      setProfileMessage({
        text: getErrorMessage(error, 'Failed to delete photo.'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Kundali Handlers ---
  const handleKundaliChange = (e) => {
    const { name, value, type, checked } = e.target;
    setKundaliData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name !== 'isVisible') setKundaliPreview(null);
  };

  const handleGenerateKundali = async () => {
    setIsKundaliLoading(true);
    setKundaliAction('generate');
    setKundaliMessage({ text: '', type: '' });

    try {
      const response = await kundaliService.generateKundali({
        dateOfBirth: kundaliData.dateOfBirth, birthTime: kundaliData.birthTime,
        birthPlace: kundaliData.birthPlace, latitude: kundaliData.latitude,
        longitude: kundaliData.longitude, timezone: kundaliData.timezone,
        isVisible: kundaliData.isVisible, save: false,
      });

      const calculatedData = 
        response.data.calculated || 
        response.data.kundali || 
        response.data.data || 
        response.data;

      setKundaliPreview(calculatedData);
      setKundaliMessage({ text: 'Kundali generated successfully.', type: 'success' });
    } catch (error) {
      setKundaliPreview(null);
      setKundaliMessage({
        text: getErrorMessage(error, 'Failed to generate kundali.'),
        type: 'error',
      });
    } finally {
      setIsKundaliLoading(false);
      setKundaliAction('');
    }
  };

  const handleKundaliSave = async () => {
    setIsKundaliLoading(true);
    setKundaliAction('save');
    setKundaliMessage({ text: '', type: '' });
    
    try {
      if (kundaliPreview) {
        const response = await kundaliService.generateKundali({
          dateOfBirth: kundaliData.dateOfBirth, birthTime: kundaliData.birthTime,
          birthPlace: kundaliData.birthPlace, latitude: kundaliData.latitude,
          longitude: kundaliData.longitude, timezone: kundaliData.timezone,
          isVisible: kundaliData.isVisible, save: true,
        });

        const nextKundaliState = buildKundaliState(
          { ...response.data.kundali, user: { dateOfBirth: kundaliData.dateOfBirth } },
          user
        );

        setKundaliData(nextKundaliState);
        setSavedKundaliData(nextKundaliState);
        setKundaliPreview(null);
      } else {
        await kundaliService.updateKundali({ isVisible: kundaliData.isVisible });
        setSavedKundaliData((prev) => ({ ...prev, isVisible: kundaliData.isVisible }));
      }

      const refreshedProfile = await profileService.getMyProfile();
      setUser(refreshedProfile.data.user || refreshedProfile.data.data || refreshedProfile.data);
      setKundaliMessage({ text: 'Kundali updated successfully!', type: 'success' });
      setIsKundaliEditing(false);
    } catch (error) {
      setKundaliMessage({
        text: getErrorMessage(error, 'Failed to update kundali.'),
        type: 'error',
      });
    } finally {
      setIsKundaliLoading(false);
      setKundaliAction('');
    }
  };

  const handleCancelKundaliEdit = () => {
    setKundaliData(savedKundaliData);
    setKundaliPreview(null);
    setIsKundaliEditing(false);
    setKundaliMessage({ text: '', type: '' });
  };

  // --- Location Handlers ---
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationPickerChange = (nextValue) => {
    setLocationData((prev) => ({
      ...prev,
      city: nextValue.city || prev.city,
      latitude: nextValue.latitude ?? prev.latitude,
      longitude: nextValue.longitude ?? prev.longitude,
      district: nextValue.district || prev.district,
      region: nextValue.region || prev.region,
      country: nextValue.country || prev.country,
      formattedAddress: nextValue.formattedAddress || prev.formattedAddress,
    }));
  };

  const handleLocationSave = async () => {
    setIsLocationLoading(true);
    setLocationMessage({ text: '', type: '' });
    
    try {
      await profileService.updateProfile(locationData);
      const response = await profileService.getMyProfile();
      setUser(response.data.user || response.data.data || response.data);
      setLocationMessage({ text: 'Location updated successfully!', type: 'success' });
      setIsLocationEditing(false);
    } catch (error) {
      setLocationMessage({
        text: getErrorMessage(error, 'Failed to update location.'),
        type: 'error',
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleCancelLocationEdit = () => {
    setLocationData(savedLocationData);
    setIsLocationEditing(false);
    setLocationMessage({ text: '', type: '' });
  };

  // --- View Variables ---
  const displayedKundali = kundaliPreview || kundaliData;
  const canSaveKundali = Boolean(kundaliPreview) || kundaliData.isVisible !== savedKundaliData.isVisible;
  const currentPhoto = user?.photos?.[0];

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    let base = API_BASE_URL;
    if (base.endsWith('/api')) base = base.slice(0, -4);
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!url.startsWith('/')) url = `/${url}`;
    return `${base}${url}`;
  };

  const [photoSrc, setPhotoSrc] = useState('');
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (currentPhoto?.url) {
      const resolved = resolvePhotoUrl(currentPhoto.url);
      setPhotoSrc(resolved);
    } else {
      setPhotoSrc('');
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
    };
  }, [currentPhoto?.url]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Photo Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="mb-6">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-5xl overflow-hidden relative group">
                  {currentPhoto?.url ? (
                    <img src={resolvePhotoUrl(currentPhoto.url)} alt={user.firstName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isLoading} />
                    <span className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                      {isLoading ? 'Uploading...' : 'Change Photo'}
                    </span>
                  </label>
                  {currentPhoto && (
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(currentPhoto.id || currentPhoto._id)}
                      disabled={isLoading}
                      className="block w-full text-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition text-sm font-medium"
                    >
                      Delete Current Photo
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profile Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verification</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Verified</span>
                </div>
              </div>
            </motion.div>

            {/* Profile Information Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 bg-white rounded-lg shadow p-6"
            >
              {profileMessage.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${profileMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Information</h2>
                <Button variant={isEditing ? 'secondary' : 'primary'} onClick={isEditing ? handleProfileCancel : () => setIsEditing(true)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleProfileChange} disabled={!isEditing} />
                  <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleProfileChange} disabled={!isEditing} />
                </div>
                <Input label="Bio" name="bio" value={formData.bio} onChange={handleProfileChange} disabled={!isEditing} placeholder="Tell us about yourself" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" name="city" value={formData.city} onChange={handleProfileChange} disabled={!isEditing} />
                  <Input label="Height" name="height" value={formData.height} onChange={handleProfileChange} disabled={!isEditing} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Religion" name="religion" value={formData.religion} onChange={handleProfileChange} disabled={!isEditing} />
                  <Input label="Occupation" name="occupation" value={formData.occupation} onChange={handleProfileChange} disabled={!isEditing} />
                </div>
                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>

          {/* Kundali & Birth Details Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">✨ Kundali & Birth Details</h2>
              <Button variant={isKundaliEditing ? 'secondary' : 'primary'} onClick={() => (isKundaliEditing ? handleCancelKundaliEdit() : setIsKundaliEditing(true))}>
                {isKundaliEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {kundaliMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${kundaliMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {kundaliMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Date of Birth" name="dateOfBirth" type="date" value={kundaliData.dateOfBirth} onChange={handleKundaliChange} disabled={!isKundaliEditing} />
              <Input label="Birth Time (HH:MM)" name="birthTime" value={kundaliData.birthTime} onChange={handleKundaliChange} disabled={!isKundaliEditing} placeholder="06:30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input label="Birth Place" name="birthPlace" value={kundaliData.birthPlace} onChange={handleKundaliChange} disabled={!isKundaliEditing} placeholder="Kathmandu" />
              <Input label="Timezone" name="timezone" value={kundaliData.timezone} onChange={handleKundaliChange} disabled={!isKundaliEditing} placeholder="Asia/Kathmandu" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input label="Birth Latitude" name="latitude" type="number" step="any" value={kundaliData.latitude} onChange={handleKundaliChange} disabled={!isKundaliEditing} placeholder="27.7172" />
              <Input label="Birth Longitude" name="longitude" type="number" step="any" value={kundaliData.longitude} onChange={handleKundaliChange} disabled={!isKundaliEditing} placeholder="85.3240" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500 mb-1">Rashi</p>
                <p className="text-lg font-semibold text-gray-900">{displayedKundali.zodiacSign || 'Not generated yet'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500 mb-1">Nakshatra</p>
                <p className="text-lg font-semibold text-gray-900">{displayedKundali.nakshatra || 'Not generated yet'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500 mb-1">Moon Sign</p>
                <p className="text-lg font-semibold text-gray-900">{displayedKundali.moonSign || 'Not generated yet'}</p>
              </div>
            </div>

            {/* Visual Kundali Patra Component Integration */}
            <KundaliPatraView kundaliData={displayedKundali} />

            <div className="mt-4 flex items-center gap-2">
              <input type="checkbox" name="isVisible" checked={kundaliData.isVisible} onChange={handleKundaliChange} disabled={!isKundaliEditing} className="w-4 h-4 text-blue-600 rounded" />
              <label className="text-sm text-gray-700">Show Kundali information to other users</label>
            </div>

            {isKundaliEditing && (
              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <Button variant="secondary" fullWidth onClick={handleGenerateKundali} disabled={isKundaliLoading}>
                  {isKundaliLoading && kundaliAction === 'generate' ? 'Calculating Kundali...' : 'Generate Kundali'}
                </Button>
                <Button variant="primary" fullWidth onClick={handleKundaliSave} disabled={isKundaliLoading || !canSaveKundali}>
                  {isKundaliLoading && kundaliAction === 'save' ? 'Saving...' : 'Save Kundali'}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Location Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📍 Location</h2>
              <Button variant={isLocationEditing ? 'secondary' : 'primary'} onClick={() => (isLocationEditing ? handleCancelLocationEdit() : setIsLocationEditing(true))}>
                {isLocationEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {locationMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${locationMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {locationMessage.text}
              </div>
            )}

            <div className="mb-6">
              <LocationPicker value={locationData} onChange={handleLocationPickerChange} disabled={!isLocationEditing} placeholder="Search your location" mapHeight="320px" allowCurrentLocation={isLocationEditing} />
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Location</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="City" name="city" value={locationData.city} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="Kathmandu" />
              <Input label="District" name="district" value={locationData.district} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="Sunsari" />
              <Input label="Region" name="region" value={locationData.region} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="Province 1" />
              <Input label="Country" name="country" value={locationData.country} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="Nepal" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input label="Latitude" name="latitude" type="number" step="any" value={locationData.latitude} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="26.8065" />
              <Input label="Longitude" name="longitude" type="number" step="any" value={locationData.longitude} onChange={handleLocationChange} disabled={!isLocationEditing} placeholder="87.2846" />
            </div>

            {isLocationEditing && (
              <div className="mt-6">
                <Button variant="primary" fullWidth onClick={handleLocationSave} disabled={isLocationLoading}>
                  {isLocationLoading ? 'Saving...' : 'Save Location'}
                </Button>
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {isLoading && <Loading fullScreen />}
    </MainLayout>
  );
};

export default Profile;