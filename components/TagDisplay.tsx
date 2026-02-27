import React from 'react';
import { getTagName, getTagColor } from '../constants';
import { Language } from '../types';

interface TagDisplayProps {
  tags: string[];
  lang: Language;
  onTagClick?: (tag: string) => void;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TagDisplay: React.FC<TagDisplayProps> = ({
  tags,
  lang,
  onTagClick,
  maxVisible = 3,
  size = 'md',
}) => {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tagId) => {
        const color = getTagColor(tagId);
        const tagName = getTagName(tagId, lang);
        return (
          <span
            key={tagId}
            onClick={() => onTagClick?.(tagId)}
            className={`${sizeClasses[size]} rounded-full font-medium text-white ${
              onTagClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
            }`}
            style={{ backgroundColor: color }}
          >
            {tagName}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span className={`${sizeClasses[size]} rounded-full font-medium bg-slate-200 text-slate-600`}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};
