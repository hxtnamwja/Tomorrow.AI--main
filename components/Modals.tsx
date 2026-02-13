import React, { useState } from 'react';
import { X } from 'lucide-react';

export const CreateBountyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (data: {title: string, desc: string, reward: string}) => void,
  t: any 
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{t('createBounty')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('bountyTitle')}</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Optimize Physics Engine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('bountyDesc')}</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              placeholder="Describe the task requirements..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('reward')}</label>
            <input 
              value={reward}
              onChange={e => setReward(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={t('bountyRewardPlaceholder')}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={() => {
              if (title && desc && reward) {
                onSubmit({ title, desc, reward });
                setTitle(''); setDesc(''); setReward('');
                onClose();
              }
            }} 
            disabled={!title || !desc || !reward}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CreateCategoryModal = ({ 
  isOpen, 
  parentId,
  onClose, 
  onSubmit, 
  t 
}: { 
  isOpen: boolean, 
  parentId: string | null,
  onClose: () => void, 
  onSubmit: (name: string, parentId: string | null) => void,
  t: any 
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{parentId ? t('addSubCategory') : t('addCategory')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('enterCategoryName')}</label>
          <input 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onSubmit(name.trim(), parentId);
                setName('');
                onClose();
              }
            }}
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={() => {
              if (name.trim()) {
                onSubmit(name.trim(), parentId);
                setName('');
                onClose();
              }
            }} 
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};
