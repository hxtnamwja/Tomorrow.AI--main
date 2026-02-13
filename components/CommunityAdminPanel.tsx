import React, { useState, useMemo } from 'react';
import { X, Users, Settings, Trash2, UserCheck, UserX, LogOut, Building2 } from 'lucide-react';
import { Community } from '../types';

interface CommunityAdminPanelProps {
  community: Community;
  currentUserId: string;
  onClose: () => void;
  onUpdateCommunity: (community: Community) => void;
  onDeleteCommunity: (communityId: string) => void;
  onManageMember: (commId: string, memberId: string, action: 'accept' | 'kick' | 'reject_request') => void;
  t: (key: string) => string;
}

export const CommunityAdminPanel: React.FC<CommunityAdminPanelProps> = ({
  community,
  currentUserId,
  onClose,
  onUpdateCommunity,
  onDeleteCommunity,
  onManageMember,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Check if current user is the community creator (admin)
  const isAdmin = community.creatorId === currentUserId;

  // Get all members info (in real app, you'd fetch user details)
  const memberCount = community.members.length;
  const pendingCount = community.pendingMembers.length;

  // Handle approve/reject join requests
  const handleApproveRequest = async (userId: string) => {
    try {
      await onManageMember(community.id, userId, 'accept');
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      await onManageMember(community.id, userId, 'reject_request');
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (userId: string) => {
    if (userId === community.creatorId) {
      alert('不能移除社区创建者');
      return;
    }
    if (!window.confirm('确定要移除该成员吗？')) {
      return;
    }
    try {
      await onManageMember(community.id, userId, 'kick');
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  // Handle delete community
  const handleDeleteCommunity = () => {
    if (deleteConfirmText !== community.name) {
      alert('请输入正确的社区名称以确认删除');
      return;
    }
    onDeleteCommunity(community.id);
    onClose();
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">访问受限</h3>
            <p className="text-slate-500 mb-6">只有社区管理员才能访问此面板</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">社区管理</h2>
              <p className="text-sm text-slate-500">{community.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            成员管理 ({memberCount})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            加入申请 {pendingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Community Info Card */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  社区基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">社区名称</p>
                    <p className="font-medium text-slate-800">{community.name}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">邀请码</p>
                    <p className="font-medium text-slate-800 font-mono">{community.code}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">成员数量</p>
                    <p className="font-medium text-slate-800">{memberCount} 人</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">待审核申请</p>
                    <p className="font-medium text-slate-800">{pendingCount} 人</p>
                  </div>
                </div>
                <div className="mt-4 bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">社区描述</p>
                  <p className="text-slate-800">{community.description}</p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  危险区域
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  解散社区将删除所有相关数据，此操作不可撤销。
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    解散社区
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      请输入社区名称 "{community.name}" 以确认删除：
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="输入社区名称"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteCommunity}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        确认删除
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4">社区成员</h3>
              {community.members.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无成员</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {community.members.map((memberId) => (
                    <div
                      key={memberId}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            用户 {memberId.slice(0, 8)}...
                            {memberId === community.creatorId && (
                              <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                创建者
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500">ID: {memberId}</p>
                        </div>
                      </div>
                      {memberId !== community.creatorId && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="移除成员"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4">加入申请</h3>
              {community.pendingMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无待审核申请</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {community.pendingMembers.map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            用户 {userId.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-slate-500">ID: {userId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(userId)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="同意加入"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(userId)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="拒绝加入"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
