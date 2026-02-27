import React, { useState, useMemo } from 'react';
import { Plus, X, Calendar, Trash2, Save, Edit2, Eye, EyeOff, Megaphone } from 'lucide-react';
import { Announcement, Language, Layer } from '../types';

interface AnnouncementManagerProps {
  announcements: Announcement[];
  lang: Language;
  currentUserId: string;
  isGeneralAdmin: boolean;
  userCommunities?: Array<{ id: string; name: string }>;
  onSave: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({
  announcements,
  lang,
  currentUserId,
  isGeneralAdmin,
  userCommunities = [],
  onSave,
  onDelete,
  onToggleActive,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as 'general' | 'community',
    layer: 'general' as Layer,
    communityId: '',
    isActive: true,
    expiresAt: null as number | null,
  });

  const filteredAnnouncements = useMemo(() => {
    if (isGeneralAdmin) {
      return announcements;
    }
    const userCommunityIds = new Set(userCommunities.map(c => c.id));
    return announcements.filter(a => {
      if (a.type === 'general') return false;
      return a.communityId && userCommunityIds.has(a.communityId);
    });
  }, [announcements, userCommunities, isGeneralAdmin]);

  const handleReset = () => {
    setFormData({
      title: '',
      content: '',
      type: isGeneralAdmin ? 'general' : 'community',
      layer: 'general',
      communityId: '',
      isActive: true,
      expiresAt: null,
    });
    setShowCreate(false);
    setEditingId(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      layer: announcement.layer,
      communityId: announcement.communityId || '',
      isActive: announcement.isActive,
      expiresAt: announcement.expiresAt || null,
    });
    setEditingId(announcement.id);
    setShowCreate(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const announcement = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      layer: formData.layer,
      communityId: formData.type === 'community' ? formData.communityId : undefined,
      isActive: formData.isActive,
      expiresAt: formData.expiresAt,
      createdBy: currentUserId,
    };

    onSave(announcement);
    handleReset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {lang === 'cn' ? '公告管理' : 'Announcement Management'}
          </h2>
          <p className="text-slate-500 mt-1">
            {lang === 'cn' ? '发布和管理平台公告' : 'Publish and manage platform announcements'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {lang === 'cn' ? '发布公告' : 'Create Announcement'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId 
                ? (lang === 'cn' ? '编辑公告' : 'Edit Announcement') 
                : (lang === 'cn' ? '发布新公告' : 'Create New Announcement')}
            </h3>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'cn' ? '标题' : 'Title'}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder={lang === 'cn' ? '输入公告标题...' : 'Enter announcement title...'}
              />
            </div>

            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'cn' ? '公告类型' : 'Announcement Type'}
              </label>
              <div className="flex gap-3">
                {isGeneralAdmin && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'general', communityId: '' })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border-2 font-medium transition-all ${
                      formData.type === 'general'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {lang === 'cn' ? '全站公告' : 'Platform-wide'}
                  </button>
                )}
                {userCommunities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'community' })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border-2 font-medium transition-all ${
                      formData.type === 'community'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {lang === 'cn' ? '社区公告' : 'Community'}
                  </button>
                )}
              </div>
            </div>

            {/* Community Selector (for community type) */}
            {formData.type === 'community' && userCommunities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'cn' ? '选择社区' : 'Select Community'}
                </label>
                <select
                  value={formData.communityId}
                  onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                  <option value="">{lang === 'cn' ? '请选择社区' : 'Select a community'}</option>
                  {userCommunities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'cn' ? '公告内容' : 'Content'}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                placeholder={lang === 'cn' ? '输入公告内容...' : 'Enter announcement content...'}
              />
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'cn' ? '过期时间（可选）' : 'Expiration (Optional)'}
              </label>
              <input
                type="datetime-local"
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, expiresAt: new Date(e.target.value).getTime() });
                  } else {
                    setFormData({ ...formData, expiresAt: null });
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                {lang === 'cn' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingId ? (lang === 'cn' ? '保存修改' : 'Save Changes') : (lang === 'cn' ? '发布' : 'Publish')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">{lang === 'cn' ? '暂无公告' : 'No announcements yet'}</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-2xl shadow border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      announcement.type === 'general'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {announcement.type === 'general' 
                        ? (lang === 'cn' ? '全站' : 'Platform') 
                        : (lang === 'cn' ? '社区' : 'Community')}
                    </span>
                    {!announcement.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        {lang === 'cn' ? '已停用' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">{announcement.title}</h4>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(announcement.createdAt).toLocaleString()}
                    </div>
                    {announcement.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {lang === 'cn' ? '过期：' : 'Expires:'} {new Date(announcement.expiresAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onToggleActive(announcement.id, !announcement.isActive)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    title={announcement.isActive ? (lang === 'cn' ? '停用' : 'Deactivate') : (lang === 'cn' ? '启用' : 'Activate')}
                  >
                    {announcement.isActive ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    title={lang === 'cn' ? '编辑' : 'Edit'}
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => onDelete(announcement.id)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    title={lang === 'cn' ? '删除' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
