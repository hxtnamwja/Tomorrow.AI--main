import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Globe, Users, FolderOpen, Award, Coins, FileCode, Eye, ThumbsUp, ThumbsDown, Trash2, UserCircle } from 'lucide-react';
import { Demo, Community, Category, Bounty, User, Language } from '../types';
import { BountiesAPI, DemosAPI } from '../services/apiService';
import { TagSelector } from './TagSelector';
import { getTagName, getTagColor } from '../constants';

export const CreateBountyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  t,
  user,
  categories,
  userCommunities,
  lang
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (data: any) => void,
  t: any,
  user: User | null,
  categories: Category[],
  userCommunities: Community[],
  lang: Language
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'general' | 'community'>('general');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [programTitle, setProgramTitle] = useState('');
  const [programDesc, setProgramDesc] = useState('');
  const [programTags, setProgramTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDesc('');
      setRewardPoints('');
      setSelectedLayer('general');
      setSelectedCommunityId(null);
      setSelectedCategoryId(null);
      setProgramTitle('');
      setProgramDesc('');
      setProgramTags([]);
    }
  }, [isOpen]);

  const filteredCategories = selectedLayer === 'community' && selectedCommunityId
    ? categories.filter(c => c.communityId === selectedCommunityId)
    : categories.filter(c => !c.communityId && !c.parentId);

  if (!isOpen || !user) return null;

  const points = parseInt(rewardPoints) || 0;
  const canCreate = title && desc && points > 0 && selectedCategoryId && user.points >= points && programTitle;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            发布悬赏任务
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800">
              <Coins className="w-4 h-4" />
              <span className="font-medium">您的积分：{user.points}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">悬赏标题</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="例如：优化物理引擎"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">悬赏描述</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              placeholder="详细描述任务要求..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">悬赏积分</label>
            <input 
              type="number"
              min="1"
              value={rewardPoints}
              onChange={e => setRewardPoints(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="输入积分数量"
            />
            {points > 0 && points > user.communityPoints && (
              <p className="text-xs text-red-500 mt-1">积分不足</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-slate-800 mb-4">程序信息</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">程序名称</label>
              <input 
                value={programTitle}
                onChange={e => setProgramTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="例如：高级物理引擎"
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">程序描述</label>
              <textarea 
                value={programDesc}
                onChange={e => setProgramDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder="描述程序功能..."
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">标签</label>
              <TagSelector 
                selectedTags={programTags}
                onChange={setProgramTags}
                lang={lang}
                maxTags={5}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">程序发布位置</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedLayer('general');
                  setSelectedCommunityId(null);
                  setSelectedCategoryId(null);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLayer === 'general' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Globe className={`w-5 h-5 mb-1 ${selectedLayer === 'general' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-sm font-medium text-slate-800">通用知识库</div>
                <div className="text-xs text-slate-500">需要总管理员审批</div>
              </button>
              <button
                onClick={() => {
                  setSelectedLayer('community');
                  setSelectedCategoryId(null);
                }}
                disabled={userCommunities.length === 0}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLayer === 'community' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300'
                } ${userCommunities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Users className={`w-5 h-5 mb-1 ${selectedLayer === 'community' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-sm font-medium text-slate-800">社区</div>
                <div className="text-xs text-slate-500">需要社区管理员审批</div>
              </button>
            </div>
          </div>

          {selectedLayer === 'community' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择社区</label>
              <select
                value={selectedCommunityId || ''}
                onChange={(e) => {
                  setSelectedCommunityId(e.target.value || null);
                  setSelectedCategoryId(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">请选择社区...</option>
                {userCommunities.map(comm => (
                  <option key={comm.id} value={comm.id}>{comm.name}</option>
                ))}
              </select>
            </div>
          )}

          {((selectedLayer === 'general') || (selectedLayer === 'community' && selectedCommunityId)) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择分类</label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">请选择分类...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
          <button 
            onClick={() => {
              if (canCreate) {
                onSubmit({
                  title,
                  description: desc,
                  reward: `${rewardPoints}积分`,
                  rewardPoints: parseInt(rewardPoints),
                  layer: selectedLayer,
                  communityId: selectedCommunityId || undefined,
                  publishLayer: selectedLayer,
                  publishCommunityId: selectedCommunityId || undefined,
                  publishCategoryId: selectedCategoryId || undefined,
                  programTitle,
                  programDescription: programDesc,
                  programTags
                });
                onClose();
              }
            }} 
            disabled={!canCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发布悬赏
          </button>
        </div>
      </div>
    </div>
  );
};

export const BountyDetailModal = ({ 
  isOpen, 
  onClose, 
  bounty, 
  currentUser,
  onOpenDemo,
  onRefresh,
  userDemos,
  onUploadForBounty,
  onDelete,
  lang
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  bounty: (Bounty & { solutions?: any[] }) | null,
  currentUser: User | null,
  onOpenDemo: (demoId: string) => void,
  onRefresh: () => void,
  userDemos?: Demo[],
  onUploadForBounty?: () => void,
  onDelete?: (id: string) => void,
  lang: Language
}) => {
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingSolutionId, setRejectingSolutionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDemoId(null);
      setRejectionReason('');
      setRejectingSolutionId(null);
    }
  }, [isOpen]);

  if (!isOpen || !bounty) return null;

  console.log('=== BountyDetailModal ===');
  console.log('Bounty:', bounty);
  console.log('Is creator:', currentUser && bounty.creatorId === currentUser.id);
  console.log('Current user:', currentUser);
  console.log('Solutions:', bounty.solutions);
  console.log('Solutions count:', bounty.solutions?.length);

  const isCreator = currentUser && bounty.creatorId === currentUser.id;
  const isClosed = bounty.status === 'closed';
  const canSubmit = !isClosed && !isCreator && currentUser && userDemos && userDemos.length > 0;
  const pendingSolutions = bounty.solutions?.filter(s => s.status === 'pending') || [];

  const handleSubmitSolution = async () => {
    if (!selectedDemoId) return;
    setIsSubmitting(true);
    try {
      await BountiesAPI.submitSolution(bounty.id, selectedDemoId);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Submit solution error:', error);
      alert('提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSolution = async (solutionId: string, action: 'accept' | 'reject', reason?: string) => {
    try {
      await BountiesAPI.reviewSolution(bounty.id, solutionId, action, reason);
      onRefresh();
      setRejectingSolutionId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Review solution error:', error);
      alert('审核失败');
    }
  };

  const handleOpenDemo = (demoId: string) => {
    onClose();
    onOpenDemo(demoId);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            {bounty.title}
          </h3>
          <div className="flex items-center gap-2">
            {((currentUser?.id === bounty.creatorId) || (currentUser?.role === 'general_admin')) && onDelete && (
              <button 
                onClick={() => {
                  onDelete(bounty.id);
                  onClose();
                }}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                bounty.status === 'open' ? 'bg-green-100 text-green-700' :
                bounty.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {bounty.status === 'open' ? '进行中' :
                 bounty.status === 'in_review' ? '审核中' : '已完成'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Coins className="w-4 h-4" />
              <span className="font-bold">{bounty.rewardPoints}积分</span>
            </div>
          </div>

          <div>
            <p className="text-slate-600">{bounty.description}</p>
          </div>

          <div className="text-sm text-slate-500">
            发布者：{bounty.creator}
          </div>

          {(bounty.programTitle || bounty.programDescription || bounty.programTags) && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-semibold text-slate-800 mb-3">程序信息</h4>
              
              {bounty.programTitle && (
                <div className="mb-2">
                  <span className="text-sm text-slate-500">程序名称：</span>
                  <span className="text-sm font-medium text-slate-800">{bounty.programTitle}</span>
                </div>
              )}
              
              {bounty.programDescription && (
                <div className="mb-2">
                  <span className="text-sm text-slate-500">程序描述：</span>
                  <p className="text-sm text-slate-700 mt-1">{bounty.programDescription}</p>
                </div>
              )}
              
              {bounty.programTags && bounty.programTags.length > 0 && (
                <div>
                  <span className="text-sm text-slate-500">标签：</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bounty.programTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {getTagName(tag, lang)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isCreator && pendingSolutions.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                待审核的解决方案 ({pendingSolutions.length})
              </h4>
              <div className="space-y-4">
                {pendingSolutions.map(solution => (
                  <div key={solution.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{solution.username}</span>
                          <span className="text-xs text-slate-500 block">
                            {new Date(solution.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <button
                        onClick={() => handleOpenDemo(solution.demoId)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        查看提交的程序
                      </button>
                    </div>
                    
                    {rejectingSolutionId === solution.id ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2 text-red-800 font-semibold">
                          <ThumbsDown className="w-5 h-5" />
                          拒绝该解决方案
                        </div>
                        <textarea
                          placeholder="请详细说明拒绝原因（必填）..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white resize-none"
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReviewSolution(solution.id, 'reject', rejectionReason)}
                            disabled={!rejectionReason.trim()}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            确认拒绝
                          </button>
                          <button
                            onClick={() => {
                              setRejectingSolutionId(null);
                              setRejectionReason('');
                            }}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReviewSolution(solution.id, 'accept')}
                          className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          接受并提交管理员审核
                        </button>
                        <button
                          onClick={() => setRejectingSolutionId(solution.id)}
                          className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const visibleSolutions = isCreator 
              ? bounty.solutions || [] 
              : (bounty.solutions || []).filter(s => s.userId === currentUser?.id);
            
            if (visibleSolutions.length === 0) return null;
            
            return (
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-800 mb-4">
                  {isCreator ? '所有解决方案' : '我的提交'}
                </h4>
                <div className="space-y-3">
                  {visibleSolutions.map(solution => (
                    <div key={solution.id} className={`p-4 rounded-lg border ${
                      solution.status === 'rejected' ? 'bg-red-50 border-red-200' :
                      solution.status === 'accepted' ? 'bg-green-50 border-green-200' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {!isCreator && (
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-indigo-600" />
                            </div>
                          )}
                          <div>
                            {isCreator && (
                              <span className="font-medium text-slate-800">{solution.username}</span>
                            )}
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              solution.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              solution.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {solution.status === 'accepted' ? '已接受' :
                               solution.status === 'rejected' ? '已拒绝' : '待审核'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(solution.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {solution.status === 'rejected' && solution.rejectionReason && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-1">
                            <XCircle className="w-4 h-4" />
                            拒绝原因
                          </div>
                          <p className="text-sm text-red-800">{solution.rejectionReason}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleOpenDemo(solution.demoId)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          <FileCode className="w-4 h-4" />
                          查看程序
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {!isClosed && !isCreator && currentUser && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-semibold text-slate-800 mb-4">提交解决方案</h4>
              <div className="space-y-4">
                {onUploadForBounty && (
                  <button
                    onClick={() => {
                      onClose();
                      onUploadForBounty();
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <FileCode className="w-4 h-4" />
                    上传新程序
                  </button>
                )}
                {userDemos && userDemos.length > 0 && (
                  <>
                    <div className="text-center text-sm text-slate-500 my-2">或</div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">选择已有程序</label>
                      <select
                        value={selectedDemoId || ''}
                        onChange={(e) => setSelectedDemoId(e.target.value || null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">请选择程序...</option>
                        {userDemos?.map(demo => (
                          <option key={demo.id} value={demo.id}>{demo.title}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleSubmitSolution}
                      disabled={!selectedDemoId || isSubmitting}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? '提交中...' : '提交解决方案'}
                    </button>
                  </>
                )}
                {(!userDemos || userDemos.length === 0) && !onUploadForBounty && (
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-slate-500 mb-2">您还没有创建任何程序</p>
                    <p className="text-sm text-slate-400">请先在探索页面上传您的程序</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
