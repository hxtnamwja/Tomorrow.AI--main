import React, { useState, useEffect } from 'react';
import { UserRole, User as UserType, Community, Demo, Feedback, Language } from '../types';
import { UserCircle, ShieldCheck, Edit3, Save, X, Mail, QrCode, BookOpen, Building2, Heart, Image as ImageIcon, MessageSquare, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { FeedbackAPI, DemosAPI } from '../services/apiService';
import FeedbackList from './FeedbackList';

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  t: (key: string) => string;
  lang: Language;
  onBack: () => void;
  onOpenCommunity?: (communityId: string) => void;
  onOpenDemo?: (demo: Demo) => void;
  communities?: Community[];
  isBanned?: number;
  banReason?: string;
  onOpenBanAppeal?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  currentUserId,
  currentUserRole,
  t,
  lang,
  onBack,
  onOpenCommunity,
  onOpenDemo,
  communities = [],
  isBanned,
  banReason,
  onOpenBanAppeal
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userDemos, setUserDemos] = useState<Demo[]>([]);
  const [archivedDemos, setArchivedDemos] = useState<Demo[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<Feedback[]>([]);
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
      const userData = await StorageService.getUserById(userId);
      const statsData = await StorageService.getUserStats(userId);
      const demosData = await StorageService.getUserDemos(userId);
      
      setUser(userData);
      setStats(statsData);
      setUserDemos(demosData);
      
      if (isOwnProfile) {
        try {
          const feedbacksData = await FeedbackAPI.getMy();
          setUserFeedbacks(feedbacksData);
          
          // Load archived demos only for own profile
          const archivedDemosData = await DemosAPI.getArchivedByUser(userId);
          setArchivedDemos(archivedDemosData);
        } catch (error) {
          console.error('Failed to load feedback or archived demos:', error);
        }
      }
      
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

  const handleRefreshData = () => {
    loadData();
  };

  const handleRestoreDemo = async (demoId: string) => {
    if (!confirm('确定要恢复这个程序吗？')) {
      return;
    }
    try {
      await DemosAPI.restore(demoId);
      setArchivedDemos(prev => prev.filter(d => d.id !== demoId));
      loadData();
    } catch (error) {
      console.error('Failed to restore demo:', error);
      alert('恢复失败');
    }
  };

  const handleDeletePermanently = async (demoId: string) => {
    if (!confirm('确定要永久删除这个程序吗？此操作不可撤销！')) {
      return;
    }
    try {
      await DemosAPI.deletePermanently(demoId);
      setArchivedDemos(prev => prev.filter(d => d.id !== demoId));
    } catch (error) {
      console.error('Failed to delete demo permanently:', error);
      alert('永久删除失败');
    }
  };

  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm('确定要删除这个程序吗？它将被移到留档区。')) {
      return;
    }
    try {
      await DemosAPI.delete(demoId);
      loadData();
    } catch (error) {
      console.error('Failed to delete demo:', error);
      alert('删除失败');
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

              {isOwnProfile && isBanned && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-red-800 flex items-center gap-2 mb-1">
                        <MessageSquare className="w-5 h-5" />
                        账号已封禁
                      </h3>
                      {banReason && (
                        <p className="text-red-700 text-sm">封禁原因：{banReason}</p>
                      )}
                    </div>
                    {onOpenBanAppeal && (
                      <button
                        onClick={onOpenBanAppeal}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        提交申诉
                      </button>
                    )}
                  </div>
                </div>
              )}
              
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
            {t('myPublishedWorks')}
          </h2>
          <div className="grid gap-3">
            {userDemos.map((demo) => {
              const canAccess = true;
              
              const getLocationDisplay = (loc: any) => {
                if (loc.layer === 'general') {
                  return t('generalLibrary');
                } else if (loc.layer === 'community' && loc.communityId) {
                  const community = communities.find(c => c.id === loc.communityId);
                  if (community) {
                    return community.name;
                  }
                  return t('noCommunity');
                }
                return t('generalLibrary');
              };
              
              const locations = demo.locations || [];
              const locationDisplay = locations.length > 0 
                ? locations.map(getLocationDisplay).join(lang === 'en' ? ', ' : '、') 
                : (demo.communityId 
                    ? (communities.find(c => c.id === demo.communityId)?.name || t('noCommunity'))
                    : t('generalLibrary'));
              
              const canDelete = isOwnProfile || currentUserRole === 'general_admin';
              
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
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-1">{demo.description}</p>
                    <p className="text-xs text-indigo-600 font-medium">
                      {t('publishedIn')}{locationDisplay}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {new Date(demo.createdAt).toLocaleDateString()}
                    </div>
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDemo(demo.id); }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOwnProfile && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('myFeedbacks')}
          </h2>
          <FeedbackList
            feedback={userFeedbacks}
            isAdmin={false}
            currentUserRole={currentUserRole}
            onUpdate={handleRefreshData}
            lang={lang}
          />
        </div>
      )}

      {isOwnProfile && archivedDemos.length > 0 && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {t('archiveArea')}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {t('archivedDemosDesc')}
          </p>
          <div className="grid gap-3">
            {archivedDemos.map((demo) => {
              const canAccess = canAccessDemo(demo);
              const communityName = demo.communityId 
                ? communities.find(c => c.id === demo.communityId)?.name 
                : null;
              
              return (
                <div key={demo.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{demo.title}</h3>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          {t('archived')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1 mb-2">{demo.description}</p>
                      <p className="text-xs text-slate-400">
                        {t('archivedAt')} {demo.archivedAt ? new Date(demo.archivedAt).toLocaleString() : t('unknownTime')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {canAccess && onOpenDemo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenDemo(demo); }}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          {t('view')}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePermanently(demo.id); }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('permanentDelete')}
                      </button>
                    </div>
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
