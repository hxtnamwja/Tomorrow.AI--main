import React, { useState } from 'react';
import { Feedback, UserRole } from '../types';
import { AlertTriangle, MessageSquare, Bug, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FeedbackAPI } from '../services/apiService';

interface FeedbackListProps {
  feedback: Feedback[];
  isAdmin?: boolean;
  currentUserRole?: UserRole;
  onUpdate?: () => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({ 
  feedback, 
  isAdmin = false, 
  currentUserRole,
  onUpdate 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'demo_complaint':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'community_feedback':
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'website_feedback':
        return <Bug className="w-5 h-5 text-amber-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demo_complaint':
        return '演示投诉';
      case 'community_feedback':
        return '社区反馈';
      case 'website_feedback':
        return '网页建议';
      default:
        return '反馈';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'dismissed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'in_progress':
        return '处理中';
      case 'resolved':
        return '已解决';
      case 'dismissed':
        return '已驳回';
      default:
        return status;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await FeedbackAPI.updateStatus(id, status, status === 'resolved' || status === 'dismissed' ? resolution : undefined);
      alert('状态更新成功！');
      setResolution('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新失败，请重试');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-600">暂无反馈记录</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-3">
              {getTypeIcon(item.type)}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{item.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {getTypeLabel(item.type)} · {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            {expandedId === item.id ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
          
          {expandedId === item.id && (
            <div className="p-4 border-t border-slate-200 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">详细内容</h4>
                <p className="text-slate-600 whitespace-pre-wrap">{item.content}</p>
              </div>
              
              {item.demoTitle && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">相关演示程序</p>
                  <p className="font-medium text-slate-800">{item.demoTitle}</p>
                </div>
              )}
              
              {item.communityName && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">相关社区</p>
                  <p className="font-medium text-slate-800">{item.communityName}</p>
                </div>
              )}
              
              {item.resolution && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">处理结果</h4>
                  <p className="text-green-700">{item.resolution}</p>
                  {item.reviewedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      处理时间：{formatDate(item.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
              
              {isAdmin && (item.status === 'pending' || item.status === 'in_progress') && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">更新状态</h4>
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                        disabled={updatingId === item.id}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        开始处理
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <textarea
                      placeholder="输入处理结果（可选）..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'resolved')}
                        disabled={updatingId === item.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        标记已解决
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'dismissed')}
                        disabled={updatingId === item.id}
                        className="px-4 py-2 bg-slate-600 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedbackList;
