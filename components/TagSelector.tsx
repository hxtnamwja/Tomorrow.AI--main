import React from 'react';
import { COMMON_TAGS, getTagName, getTagColor } from '../constants';
import { Language } from '../types';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  lang: Language;
  maxTags?: number;
  disabled?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onChange,
  lang,
  maxTags = 5,
  disabled = false,
}) => {
  const toggleTag = (tagId: string) => {
    if (disabled) return;
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(t => t !== tagId));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const color = getTagColor(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: isSelected ? color : undefined,
              }}
            >
              {getTagName(tag.id, lang)}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        {lang === 'cn' 
          ? `已选择 ${selectedTags.length}/${maxTags} 个标签`
          : `${selectedTags.length}/${maxTags} tags selected`}
      </p>
    </div>
  );
};
