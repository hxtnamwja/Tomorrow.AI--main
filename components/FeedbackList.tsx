import React, { useState } from 'react';
import { Feedback, UserRole, Language } from '../types';
import { AlertTriangle, MessageSquare, Bug, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { FeedbackAPI } from '../services/apiService';
import { DICTIONARY } from '../constants';

interface FeedbackListProps {
  feedback: Feedback[];
  isAdmin?: boolean;
  currentUserRole?: UserRole;
  onUpdate?: () => void;
  lang?: Language;
}

const FeedbackList: React.FC<FeedbackListProps> = ({ 
  feedback, 
  isAdmin = false, 
  currentUserRole,
  onUpdate,
  lang = 'en'
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const t = (key: string) => DICTIONARY[lang][key as keyof typeof DICTIONARY['en']] || key;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'demo_complaint':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'community_feedback':
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'website_feedback':
        return <Bug className="w-5 h-5 text-amber-500" />;
      case 'ban_appeal':
        return <AlertTriangle className="w-5 h-5 text-purple-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demo_complaint':
        return t('demoComplaint');
      case 'community_feedback':
        return t('communityFeedback');
      case 'website_feedback':
        return t('websiteFeedback');
      case 'ban_appeal':
        return t('banAppeal');
      default:
        return t('feedbackType');
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
        return t('statusPending');
      case 'in_progress':
        return t('statusInProgress');
      case 'resolved':
        return t('statusResolved');
      case 'dismissed':
        return t('statusDismissed');
      default:
        return status;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await FeedbackAPI.updateStatus(id, status, status === 'resolved' || status === 'dismissed' ? resolution : undefined);
      alert(t('statusUpdated'));
      setResolution('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('updateFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm(t('confirmDeleteFeedback'))) {
      return;
    }
    setDeletingId(id);
    try {
      await FeedbackAPI.delete(id);
      alert(t('deleteSuccess'));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert(t('deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN');
  };

  if (feedback.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-600">{t('noFeedbackRecords')}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => {
        const isBanAppeal = item.type === 'ban_appeal';
        return (
        <div 
          key={item.id} 
          className={`bg-white rounded-xl border overflow-hidden ${isBanAppeal ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'}`}
        >
          <div 
            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isBanAppeal ? 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100' : 'hover:bg-slate-50'}`}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-3">
              {getTypeIcon(item.type)}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800">{item.title}</h3>
                  {isBanAppeal && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold flex items-center gap-1">
                      🔓 {t('banAppeal')}
                    </span>
                  )}
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
                <h4 className="text-sm font-medium text-slate-700 mb-2">{t('feedbackDetails')}</h4>
                <p className="text-slate-600 whitespace-pre-wrap">{item.content}</p>
              </div>
              
              {item.demoTitle && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">{t('relatedDemo')}</p>
                  <p className="font-medium text-slate-800">{item.demoTitle}</p>
                </div>
              )}
              
              {item.communityName && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">{t('relatedCommunity')}</p>
                  <p className="font-medium text-slate-800">{item.communityName}</p>
                </div>
              )}
              
              {item.resolution && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">{t('resolution')}</h4>
                  <p className="text-green-700">{item.resolution}</p>
                  {item.reviewedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      {t('reviewedAt')}{formatDate(item.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
              
              {!isAdmin && (
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    disabled={deletingId === item.id}
                    className="px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('deleteRecord')}
                  </button>
                </div>
              )}
              
              {isAdmin && (item.status === 'pending' || item.status === 'in_progress') && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">{t('updateStatus')}</h4>
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                        disabled={updatingId === item.id}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {t('startProcessing')}
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <textarea
                      placeholder={t('enterResolution')}
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
                        {t('markResolved')}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'dismissed')}
                        disabled={updatingId === item.id}
                        className="px-4 py-2 bg-slate-600 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        {t('dismiss')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default FeedbackList;
