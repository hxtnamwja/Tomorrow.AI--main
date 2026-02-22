import React, { useState, useEffect } from 'react';
import { User, UserRole, User as UserType, Community } from '../types';
import { UserCircle, ShieldCheck, Ban, CheckCircle, Edit3, X, Search } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface UserManagementPanelProps {
  currentUserRole: UserRole;
  activeCommunity?: Community;
  onClose: () => void;
  onViewUserProfile?: (userId: string) => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  currentUserRole,
  activeCommunity,
  onClose,
  onViewUserProfile
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let userList: UserType[];
      if (activeCommunity) {
        userList = await StorageService.getUsersByCommunity(activeCommunity.id);
      } else {
        userList = await StorageService.getAllUsers();
      }
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeCommunity]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBan = async (user: UserType) => {
    setSelectedUser(user);
    setBanReason('');
    setIsBanModalOpen(true);
  };

  const confirmBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await StorageService.banUser(selectedUser.id, banReason || undefined);
      await loadUsers();
      setIsBanModalOpen(false);
    } catch (error: any) {
      alert(`Failed to ban user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (user: UserType) => {
    if (!confirm(`确定要解封 ${user.username} 吗？`)) return;
    setActionLoading(true);
    try {
      await StorageService.unbanUser(user.id);
      await loadUsers();
    } catch (error: any) {
      alert(`解封失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeCommunity ? `${activeCommunity.name} - ` : ''}用户管理
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeCommunity ? '管理本社区的用户' : '管理平台所有用户'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  未找到用户
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onViewUserProfile && onViewUserProfile(user.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          user.role === 'general_admin' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {user.role === 'general_admin' ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <UserCircle className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{user.username}</span>
                          {user.isBanned && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                              已封禁
                            </span>
                          )}
                          {user.role === 'general_admin' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">
                              管理员
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {user.bio || '暂无简介'}
                          {user.banReason && <span className="text-red-500 ml-2">• 原因: {user.banReason}</span>}
                        </p>
                      </div>
                    </div>

                    {user.role !== 'general_admin' && (
                      <div className="flex items-center gap-2">
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnban(user)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            解封
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(user)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Ban className="w-4 h-4" />
                            封禁
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isBanModalOpen && selectedUser && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-2">封禁用户</h3>
              <p className="text-sm text-slate-500 mb-4">
                您正在封禁 <span className="font-semibold">{selectedUser.username}</span>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">封禁原因（可选）</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="请输入封禁原因..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsBanModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmBan}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '封禁中...' : '确认封禁'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
