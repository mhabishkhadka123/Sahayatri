import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { profileService, kundaliService } from '../services';
import Loading from '../components/Common/Loading';

const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `/api/profiles/photo/${url}`;
};

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
};

// Zodiac emoji map
const zodiacEmoji = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
  Mesh: '♈', Vrishabh: '♉', Mithun: '♊', Kark: '♋', Karka: '♋', Simha: '♌', Kanya: '♍',
  Tula: '♎', Vrishchik: '♏', Dhanu: '♐', Makar: '♑', Kumbh: '♒', Kumbha: '♒', Meen: '♓',
};
const getZodiacEmoji = (sign) => zodiacEmoji[sign] || '✦';

const scoreLabel = (s) => {
  if (!s && s !== 0) return { label: 'Unknown', color: '#94a3b8' };
  if (s >= 80) return { label: 'Exceptional Match', color: '#16a34a' };
  if (s >= 65) return { label: 'Very Good Match', color: '#2563eb' };
  if (s >= 50) return { label: 'Good Match', color: '#d97706' };
  return { label: 'Low Compatibility', color: '#dc2626' };
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setError('No user ID provided.'); setIsLoading(false); return; }
    (async () => {
      setIsLoading(true);
      try {
        const res = await profileService.getProfile(userId);
        setProfile(res.data);
        kundaliService.getCompatibility(userId)
          .then((r) => { if (r.data?.compatibility) setCompatibility(r.data.compatibility); })
          .catch(() => {});
      } catch (err) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Profile not found.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  const primaryPhoto = profile?.photos?.find((p) => p.isPrimary) || profile?.photos?.[0];
  const age = calcAge(profile?.dateOfBirth);
  const kundali = profile?.kundali;
  const sl = scoreLabel(compatibility?.score);

  const location = [profile?.profile?.district, profile?.profile?.region, profile?.city]
    .filter(Boolean).join(', ');

  const details = [
    { k: 'Religion', v: profile?.religion },
    { k: 'Occupation', v: profile?.occupation },
    { k: 'Education', v: profile?.education },
    { k: 'Height', v: profile?.height },
    { k: 'Gender', v: profile?.gender },
  ].filter((d) => d.v);

  return (
    <MainLayout>
      <div style={{ background: '#f9f6f1', minHeight: '100vh', paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

          {/* Back */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6b5b45', fontWeight: 600, fontSize: 14,
              marginBottom: 24, padding: '4px 0', letterSpacing: 0.2,
            }}
          >
            <span style={{ fontSize: 18 }}>←</span> Back to Matches
          </motion.button>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Loading /></div>
          ) : error ? (
            <div style={{
              background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              padding: 48, textAlign: 'center',
            }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>😕</p>
              <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#1e1e1e' }}>Profile Unavailable</h2>
              <p style={{ color: '#888', marginBottom: 20 }}>{error}</p>
              <button onClick={() => navigate(-1)} style={{
                background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 24px', cursor: 'pointer', fontWeight: 600,
              }}>Go Back</button>
            </div>
          ) : profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Main profile card ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
              >
                {/* Photo */}
                <div style={{ width: '100%', height: 340, background: '#e8e0d6', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {primaryPhoto?.url ? (
                    <img src={resolvePhotoUrl(primaryPhoto.url)} alt={profile.firstName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 80, opacity: 0.35 }}>👤</span>
                  )}
                  {profile.isVerified && (
                    <span style={{
                      position: 'absolute', top: 14, right: 14,
                      background: '#2563eb', color: '#fff', fontSize: 12,
                      fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                      letterSpacing: 0.5, boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    }}>
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '28px 28px 32px' }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.2 }}>
                    {profile.firstName} {profile.lastName}
                    {age ? <span style={{ fontWeight: 400, color: '#777', fontSize: 22 }}>, {age}</span> : ''}
                  </h1>

                  {location && (
                    <p style={{ color: '#9c7b5c', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
                      📍 {location}
                    </p>
                  )}

                  {profile.bio && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{
                        fontSize: 14, color: '#999', textTransform: 'uppercase',
                        letterSpacing: 1.2, fontWeight: 700, marginBottom: 8,
                      }}>About</p>
                      <p style={{ color: '#444', lineHeight: 1.7, fontSize: 15 }}>{profile.bio}</p>
                    </div>
                  )}

                  {/* Details */}
                  {details.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {details.map((d) => (
                        <div key={d.k} style={{
                          background: '#f9f6f1', borderRadius: 12, padding: '12px 16px',
                          borderLeft: '3px solid #e2d5c5',
                        }}>
                          <p style={{ fontSize: 11, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3, fontWeight: 700 }}>{d.k}</p>
                          <p style={{ color: '#2c2c2c', fontWeight: 600, fontSize: 15, textTransform: 'capitalize' }}>{d.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ── Kundali section ───────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}
              >
                {/* Section header */}
                <div style={{
                  background: 'linear-gradient(135deg, #2d1b69 0%, #4c2d8f 50%, #3730a3 100%)',
                  padding: '22px 28px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🔯</span>
                    <div>
                      <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Kundali Details</h2>
                      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0, marginTop: 2 }}>Vedic astrology chart</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px 28px' }}>
                  {kundali ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                      {[
                        { label: 'Rashi', value: kundali.zodiacSign, symbol: getZodiacEmoji(kundali.zodiacSign) },
                        { label: 'Nakshatra', value: kundali.nakshatra, symbol: '✦' },
                        { label: 'Moon Sign', value: kundali.moonSign, symbol: '☽' },
                      ].map((item) => (
                        <div key={item.label} style={{
                          textAlign: 'center', padding: '18px 12px',
                          background: '#f9f6f1', borderRadius: 14,
                          border: '1px solid #ede5d8',
                        }}>
                          <div style={{ fontSize: 22, marginBottom: 6, color: '#7c5cbf' }}>{item.symbol}</div>
                          <p style={{
                            fontSize: 10, color: '#bbb', textTransform: 'uppercase',
                            letterSpacing: 1.2, fontWeight: 700, marginBottom: 4,
                          }}>{item.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#2c2c2c', margin: 0 }}>
                            {item.value || <span style={{ color: '#ccc', fontWeight: 400 }}>—</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '20px 16px', marginBottom: 20,
                      background: '#f9f6f1', borderRadius: 12, border: '1px dashed #ddd',
                    }}>
                      <p style={{ fontSize: 13, color: '#aaa' }}>🔒 Kundali details are private</p>
                    </div>
                  )}

                  {/* Compatibility */}
                  <div style={{
                    borderTop: '1px solid #f0ebe3', paddingTop: 20,
                  }}>
                    <p style={{ fontSize: 12, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 14 }}>
                      Compatibility with you
                    </p>

                    {compatibility ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>{sl.label}</span>
                          <span style={{
                            fontSize: 20, fontWeight: 800, color: sl.color,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {compatibility.score}%
                          </span>
                        </div>
                        {/* Track */}
                        <div style={{ background: '#f0ebe3', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 10 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${compatibility.score}%` }}
                            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.25 }}
                            style={{ height: '100%', background: sl.color, borderRadius: 99 }}
                          />
                        </div>
                        {compatibility.description && (
                          <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{compatibility.description}</p>
                        )}
                      </div>
                    ) : (
                      <p style={{
                        fontSize: 13, color: '#bbb', background: '#f9f6f1',
                        padding: '14px 16px', borderRadius: 10, textAlign: 'center',
                        border: '1px dashed #e0d8cc',
                      }}>
                        Both users need Kundali set up to see compatibility
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Photo gallery ────────────────────────────────── */}
              {profile.photos && profile.photos.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px 28px' }}
                >
                  <p style={{
                    fontSize: 12, color: '#bbb', textTransform: 'uppercase',
                    letterSpacing: 1.2, fontWeight: 700, marginBottom: 14,
                  }}>Photos</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {profile.photos.map((photo) => (
                      <div key={photo.id} style={{
                        aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                        background: '#f0ebe3',
                      }}>
                        <img
                          src={resolvePhotoUrl(photo.url)}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
                          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
