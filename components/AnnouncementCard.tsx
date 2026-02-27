import React, { useState } from 'react';
import { X, Calendar, User, Megaphone, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Announcement, Language } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  lang: Language;
  onDismiss?: () => void;
  showFull?: boolean;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  lang,
  onDismiss,
  showFull = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(showFull);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed && !showFull) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.();
  };

  const isGeneral = announcement.type === 'general';
  const icon = isGeneral ? <Megaphone className="w-5 h-5" /> : <Users className="w-5 h-5" />;
  const gradient = isGeneral 
    ? 'from-rose-500 to-orange-500' 
    : 'from-indigo-500 to-purple-500';

  const contentPreview = announcement.content.length > 150 
    ? announcement.content.slice(0, 150) + '...' 
    : announcement.content;

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all duration-300 ${
      !showFull ? 'animate-in slide-in-from-top-4 fade-in' : ''
    }`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl text-white">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">
              {announcement.title}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <User className="w-3 h-3" />
              <span>{announcement.createdByUsername || (lang === 'cn' ? '管理员' : 'Admin')}</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <Calendar className="w-3 h-3" />
              <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {onDismiss && !showFull && (
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className={`text-slate-700 leading-relaxed ${
          !isExpanded && !showFull ? 'line-clamp-3' : ''
        }`}>
          {isExpanded || showFull ? announcement.content : contentPreview}
        </div>
        {!showFull && announcement.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            {isExpanded ? (
              <>
                {lang === 'cn' ? '收起' : 'Show less'}
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                {lang === 'cn' ? '展开' : 'Show more'}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
