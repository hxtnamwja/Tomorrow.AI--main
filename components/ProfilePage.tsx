import React, { useState, useEffect } from 'react';
import { User, UserRole, User as UserType, Community, Demo } from '../types';
import { UserCircle, ShieldCheck, Edit3, Save, X, Mail, QrCode, BookOpen, Building2, Heart, Image as ImageIcon } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  t: (key: string) => string;
  onBack: () => void;
  onOpenCommunity?: (communityId: string) => void;
  onOpenDemo?: (demo: Demo) => void;
  communities?: Community[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  currentUserId,
  currentUserRole,
  t,
  onBack,
  onOpenCommunity,
  onOpenDemo,
  communities = []
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userDemos, setUserDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    contactInfo: '',
    paymentQr: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [showPaymentQrUpload, setShowPaymentQrUpload] = useState(false);

  const isOwnProfile = userId === currentUserId;

  const canAccessDemo = (demo: Demo): boolean => {
    if (demo.layer !== 'community' || !demo.communityId) {
      return true;
    }
    const community = communities.find(c => c.id === demo.communityId);
    if (!community) {
      return false;
    }
    const isMember = community.members.includes(currentUserId);
    const isAdmin = currentUserRole === 'general_admin';
    return isMember || isAdmin;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, statsData, demosData] = await Promise.all([
        StorageService.getUserById(userId),
        StorageService.getUserStats(userId),
        StorageService.getUserDemos(userId)
      ]);
      setUser(userData);
      setStats(statsData);
      setUserDemos(demosData);
      if (userData && isOwnProfile) {
        setEditForm({
          username: userData.username,
          password: '',
          confirmPassword: '',
          contactInfo: userData.contactInfo || '',
          paymentQr: userData.paymentQr || '',
          bio: userData.bio || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSave = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        username: editForm.username,
        contactInfo: editForm.contactInfo || null,
        bio: editForm.bio || null
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      if (editForm.paymentQr) {
        updateData.paymentQr = editForm.paymentQr;
      }

      const updatedUser = await StorageService.updateUser(userId, updateData);
      setUser(updatedUser);
      setIsEditing(false);
      setEditForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, paymentQr: reader.result as string }));
        setShowPaymentQrUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32"></div>
        
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-12 mb-6">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white ${
              user?.role === 'general_admin' ? 'bg-purple-500' : 'bg-emerald-500'
            }`}>
              {user?.role === 'general_admin' ? (
                <ShieldCheck className="w-12 h-12 text-white" />
              ) : (
                <UserCircle className="w-12 h-12 text-white" />
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-14 flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>

          {isEditing && isOwnProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Contact Info (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.contactInfo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="Email, WeChat, etc."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Bio (Optional)
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5" />
                  Payment QR Code (Optional)
                </label>
                {editForm.paymentQr ? (
                  <div className="flex items-start gap-4">
                    <img src={editForm.paymentQr} alt="Payment QR" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
                    <button
                      onClick={() => setEditForm(prev => ({ ...prev, paymentQr: '' }))}
                      className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="payment-qr-upload"
                      accept="image/*"
                      onChange={handlePaymentQrUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="payment-qr-upload"
                      className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500">Click to upload payment QR code</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setEditForm({
                        username: user.username,
                        password: '',
                        confirmPassword: '',
                        contactInfo: user.contactInfo || '',
                        paymentQr: user.paymentQr || '',
                        bio: user.bio || ''
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-slate-800">{user?.username}</h1>
                  {user?.role === 'general_admin' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Bio
                    </h3>
                    <p className="text-slate-600">{user?.bio || <span className="text-slate-400 italic">Not provided</span>}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Info
                    </h3>
                    <p className="text-slate-600">{user?.contactInfo || <span className="text-slate-400 italic">Not provided</span>}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span>{stats?.communitiesCount || 0} Communities Managed</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats?.demosCount || 0} Works Published</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Support Me
                </h3>
                {user?.paymentQr ? (
                  <img src={user.paymentQr} alt="Payment QR" className="w-40 h-40 object-cover rounded-xl border border-slate-200" />
                ) : (
                  <p className="text-slate-400 italic">No payment QR code provided</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {stats?.communitiesManaged && stats.communitiesManaged.length > 0 && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Communities I Manage
          </h2>
          <div className="grid gap-3">
            {stats.communitiesManaged.map((community: Community) => (
              <div 
                key={community.id} 
                className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl ${onOpenCommunity ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                onClick={() => onOpenCommunity && onOpenCommunity(community.id)}
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{community.name}</h3>
                  <p className="text-sm text-slate-500">{community.description}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {community.members?.length || 0} members
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {userDemos.length > 0 && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Published Works
          </h2>
          <div className="grid gap-3">
            {userDemos.map((demo) => {
              const canAccess = canAccessDemo(demo);
              const communityName = demo.communityId 
                ? communities.find(c => c.id === demo.communityId)?.name 
                : null;
              
              return (
                <div 
                  key={demo.id} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    canAccess && onOpenDemo 
                      ? 'bg-slate-50 cursor-pointer hover:bg-slate-100' 
                      : 'bg-slate-100 opacity-75'
                  }`}
                  onClick={() => canAccess && onOpenDemo && onOpenDemo(demo)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{demo.title}</h3>
                      {!canAccess && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          {communityName ? `Need to join ${communityName}` : 'Restricted Access'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{demo.description}</p>
                  </div>
                  <div className="text-sm text-slate-400">
                    {new Date(demo.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
