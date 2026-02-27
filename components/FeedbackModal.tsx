import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, Bug } from 'lucide-react';
import { FeedbackAPI } from '../services/apiService';
import { FeedbackType, Layer } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FeedbackType;
  layer: Layer;
  communityId?: string;
  demoId?: string;
  demoTitle?: string;
  communityName?: string;
  onSuccess?: () => void;
  t: (key: string) => string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  type,
  layer,
  communityId,
  demoId,
  demoTitle,
  communityName,
  onSuccess,
  t
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeLabel = () => {
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
        return t('feedback');
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'demo_complaint':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'community_feedback':
        return <MessageSquare className="w-6 h-6 text-indigo-500" />;
      case 'website_feedback':
        return <Bug className="w-6 h-6 text-amber-500" />;
      case 'ban_appeal':
        return <AlertTriangle className="w-6 h-6 text-indigo-600" />;
      default:
        return <MessageSquare className="w-6 h-6 text-indigo-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await FeedbackAPI.create({
        type,
        title,
        content,
        layer,
        communityId,
        demoId,
        demoTitle,
        communityName
      });
      
      alert(t('feedbackSubmittedSuccessfully'));
      setTitle('');
      setContent('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(t('submitFailedPleaseTryAgain'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <h2 className="text-xl font-bold text-slate-800">{getTypeLabel()}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === 'demo_complaint' && demoTitle && (
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">{t('demoBeingComplained')}</p>
              <p className="font-bold text-slate-800">{demoTitle}</p>
            </div>
          )}

          {type === 'community_feedback' && communityName && (
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">{t('communityBeingFeedbacked')}</p>
              <p className="font-bold text-slate-800">{communityName}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('pleaseEnterTitle')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('detailedDescription')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('pleaseDescribeYourProblemOrSuggestion')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[150px] resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('submitting') : (type === 'ban_appeal' ? t('submitAppeal') : t('submitFeedback'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
