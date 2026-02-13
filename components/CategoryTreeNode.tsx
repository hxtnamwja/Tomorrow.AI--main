
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, Trash2 } from 'lucide-react';
import { Category, UserRole } from '../types';

type CategoryTreeNodeProps = {
  category: Category;
  allCategories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddSub: (parentId: string) => void;
  onDelete: (id: string) => void;
  role: UserRole | 'community_admin';
  t: any;
  key?: string | number;
};

export const CategoryTreeNode = ({ 
  category, 
  allCategories, 
  activeId, 
  onSelect, 
  onAddSub, 
  onDelete,
  role,
  t
}: CategoryTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = allCategories.filter(c => c.parentId === category.id);
  const isActive = activeId === category.id;
  const hasChildren = children.length > 0;
  
  // PERMISSIONS: General Admin and Community Admin can edit the Category Tree
  const canEdit = role === 'general_admin' || role === 'community_admin';

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div className="pl-3 select-none">
      <div 
        className={`flex items-center justify-between py-1.5 pr-2 rounded-lg transition-colors group relative ${isActive ? 'bg-indigo-50' : 'hover:bg-slate-100'}`}
      >
        {/* Navigation Area - Left Side */}
        <div 
          className="flex-1 flex items-center cursor-pointer overflow-hidden min-w-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(category.id);
            if (hasChildren) setIsExpanded(true);
          }}
        >
          {/* Expander Arrow */}
          <div 
            className={`p-1 mr-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
          
          <Folder className={`w-4 h-4 mr-2 shrink-0 ${isActive ? 'text-indigo-600 fill-indigo-200' : 'text-slate-500'}`} />
          <span className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>{category.name}</span>
        </div>

        {/* Admin Actions Area - High z-index to ensure clicks aren't swallowed, added relative positioning */}
        {canEdit && (
          <div 
            className="flex items-center gap-1 pl-2 shrink-0 z-50 relative" 
            onMouseDown={handleStopPropagation}
            onClick={handleStopPropagation}
          >
            <button 
              type="button"
              onClick={(e) => { 
                handleStopPropagation(e);
                onAddSub(category.id); 
                setIsExpanded(true); 
              }}
              title={t('addSubCategory')}
              className="p-1.5 hover:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={(e) => { 
                handleStopPropagation(e);
                onDelete(category.id); 
              }}
              title={t('deleteCategory')}
              className="p-1.5 hover:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-200 rounded transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Recursive Children */}
      {isExpanded && children.length > 0 && (
        <div className="border-l border-slate-200 ml-2.5 my-1">
          {children.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              activeId={activeId}
              onSelect={onSelect}
              onAddSub={onAddSub}
              onDelete={onDelete}
              role={role}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};
