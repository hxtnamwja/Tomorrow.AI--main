
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderOpen, Plus, ShieldCheck, Search, X,
  Sparkles, FlaskConical, Atom, Hash, Dna, Monitor,
  ChevronRight, Globe, Users, Trash2, Folder,
  ChevronDown, Satellite, UserCircle, Briefcase, Palette, Image as ImageIcon,
  Target, Award, CheckCircle, Clock, Edit3, Save, Play, RefreshCw, Camera,
  LogOut, LayoutDashboard, Settings, User, KeyRound, Building2, Zap, Heart,
  HelpCircle, BookOpen, Menu, Send, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiChatWidget } from './components/AiChatWidget';
import { marked } from 'marked';

import { Demo, Language, UserRole, Subject, Category, Layer, Bounty, Community } from './types';
import { DICTIONARY, getTranslation } from './constants';
import { StorageService } from './services/storageService';
import { AiService } from './services/aiService';





// Imports
import { CategoryTreeNode } from './components/CategoryTreeNode';
import { DemoPlayer } from './components/DemoPlayer';
import { UploadWizard } from './components/UploadWizard';
import { StatsCard } from './components/StatsCard';
import { CreateBountyModal, CreateCategoryModal } from './components/Modals';
import { CommunityAdminPanel } from './components/CommunityAdminPanel';

import { AuthPage } from './components/AuthPage';

// --- Helpers ---
const SubjectIcon = ({ subject }: { subject: string }) => {
  switch (subject) {
    case Subject.Physics: return <Atom className="w-4 h-4" />;
    case Subject.Chemistry: return <FlaskConical className="w-4 h-4" />;
    case Subject.Mathematics: return <Hash className="w-4 h-4" />;
    case Subject.Biology: return <Dna className="w-4 h-4" />;
    case Subject.ComputerScience: return <Monitor className="w-4 h-4" />;
    case Subject.Astronomy: return <Satellite className="w-4 h-4" />;
    case Subject.EarthScience: return <Globe className="w-4 h-4" />;
    case Subject.CreativeTools: return <Palette className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<Language>('cn');
  const [role, setRole] = useState<UserRole>('user');
  const [currentUserId, setCurrentUserId] = useState<string>(''); // Simulated Session ID

  // Views
  const [view, setView] = useState<'explore' | 'upload' | 'admin' | 'bounties' | 'profile' | 'community_hall'>('explore');
  const [layer, setLayer] = useState<Layer>('general');
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  
  // Data
  const [demos, setDemos] = useState<Demo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedDemo, setSelectedDemo] = useState<Demo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'likes'>('date');
  
  // Modal States
  const [isBountyModalOpen, setIsBountyModalOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{isOpen: boolean, parentId: string | null}>({ isOpen: false, parentId: null });
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreateCommModalOpen, setIsCreateCommModalOpen] = useState(false);
  const [createCommData, setCreateCommData] = useState({ name: '', desc: '' });

  // Community Admin Panel State
  const [activeCommunityAdminPanel, setActiveCommunityAdminPanel] = useState<string | null>(null);

  // Context for uploading to a bounty
  const [bountyContext, setBountyContext] = useState<Bounty | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Close chat when view changes
  useEffect(() => {
    setIsChatOpen(false);
  }, [view, layer, activeCommunityId]);

  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Hidden File Input for cover update
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [demoIdToUpdateCover, setDemoIdToUpdateCover] = useState<string | null>(null);

  // First login detection for help guide
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Mobile sidebar toggle state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const t = (key: keyof typeof DICTIONARY['en']) => getTranslation(language, key);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = StorageService.getCurrentUser();
      if (storedUser) {
        setIsLoggedIn(true);
        setRole(storedUser.role as UserRole);
        setCurrentUserId(storedUser.id);
        if (storedUser.role === 'general_admin') {
           setView('admin');
        }
        // Check if this is the first login
        const hasVisitedBefore = localStorage.getItem('sci_demo_visited');
        if (!hasVisitedBefore) {
          setIsFirstLogin(true);
          setShowHelpTooltip(true);
          localStorage.setItem('sci_demo_visited', 'true');
        }
      }
      await refreshAllData();
    };
    initAuth();
  }, []);

  const refreshAllData = async () => {
    await StorageService.initialize();

    // Load demos based on sort preference
    let demosData: Demo[];
    if (sortBy === 'likes') {
      demosData = await StorageService.getDemosSortedByLikes({});
    } else {
      demosData = await StorageService.getAllDemos();
    }

    const [categoriesData, bountiesData, communitiesData] = await Promise.all([
      StorageService.getCategories(),
      StorageService.getBounties(),
      StorageService.getCommunities()
    ]);
    setDemos(demosData);
    setCategories(categoriesData);
    setBounties(bountiesData);
    setCommunities(communitiesData);
  };



  useEffect(() => {
    setActiveCategory('All');
  }, [layer, activeCommunityId]);

  // Reload demos when sort preference changes
  useEffect(() => {
    if (isLoggedIn) {
      refreshAllData();
    }
  }, [sortBy]);

  const handleLogin = async (username: string, role: UserRole, isRegister?: boolean, password?: string) => {
    try {
      if (!password) throw new Error("Password is required");

      let result;
      if (isRegister) {
        result = await StorageService.register(username, password);
      } else {
        result = await StorageService.login(username, password);
      }
      
      setRole(result.user.role as UserRole);
      setIsLoggedIn(true);
      
      // Redirect based on role
      if (result.user.role === 'general_admin') {
        setView('admin');
        setLayer('general');
      } else {
        setView('explore');
        setLayer('general');
      }
      
      setCurrentUserId(result.user.id);
      await refreshAllData();
    } catch (error: any) {
      console.error('Auth failed:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  };


  const handleLogout = () => {
    StorageService.logout();
    setIsLoggedIn(false);
    setRole('user');
    setActiveCommunityId(null);
    setCurrentUserId('');
  };

  // --- Derived State for Communities ---
  
  const myCommunities = useMemo(() => {
      return communities.filter(c => c.members.includes(currentUserId) && c.status === 'approved');
  }, [communities, currentUserId]);

  const activeCommunity = useMemo(() => {
      return communities.find(c => c.id === activeCommunityId);
  }, [communities, activeCommunityId]);

  const isCurrentCommunityAdmin = useMemo(() => {
      if(role === 'general_admin') return true; // Super Admin Access
      if(!activeCommunity) return false;
      return activeCommunity.creatorId === currentUserId;
  }, [role, activeCommunity, currentUserId]);

  // --- Filtering Logic ---

  const rootCategories = useMemo(() => {
      return categories.filter(c => {
          // If in Community Layer, only show categories for this community
          if(layer === 'community') {
              return c.parentId === null && c.communityId === activeCommunityId;
          }
          return c.parentId === null;
      });
  }, [categories, layer, activeCommunityId]);

  const getCategoryAndChildrenIds = (rootId: string): string[] => {
    const ids = [rootId];
    const children = categories.filter(c => c.parentId === rootId);
    children.forEach(child => {
      ids.push(...getCategoryAndChildrenIds(child.id));
    });
    return ids;
  };

  const filteredDemos = useMemo(() => {
    return demos.filter(d => {
      // Layer Check
      if (d.layer !== layer) return false;
      
      // Community Isolation
      if (layer === 'community') {
          if (d.communityId !== activeCommunityId) return false;
      }

      let matchCategory = false;
      if (activeCategory === 'All') {
        matchCategory = true;
      } else {
        if (layer === 'general') {
          matchCategory = d.categoryId === activeCategory;
        } else {
          const validIds = getCategoryAndChildrenIds(activeCategory);
          matchCategory = validIds.includes(d.categoryId);
        }
      }
      const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Admin sees pending, users see published + their own pending demos
      if (view === 'explore') {
          const isVisible = d.status === 'published' || (d.author === currentUserId && d.status === 'pending');
          return matchCategory && matchSearch && isVisible;
      }
      return matchCategory && matchSearch;
    });
  }, [demos, activeCategory, searchQuery, role, view, layer, activeCommunityId, categories]);

  const pendingDemos = useMemo(() => {
    return demos.filter(d => {
      if (d.status !== 'pending') return false;
      if (role === 'general_admin') return true; // General Admin sees ALL pending
      
      // Community Admin Review
      if (d.layer === 'community' && d.communityId === activeCommunityId && isCurrentCommunityAdmin) return true;

      return false;
    });
  }, [demos, role, activeCommunityId, isCurrentCommunityAdmin]);

  // Actions
  const handleUpload = async (newDemo: Demo) => {
    await StorageService.saveDemo(newDemo);
    await refreshAllData();
    setView('explore');
    setBountyContext(null);
    alert(t('uploadSuccessMsg'));
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (view !== 'explore') {
      setView('explore');
    }
  };

  const openCategoryModal = (parentId: string | null) => {
    setCategoryModal({ isOpen: true, parentId });
  };

  const handleAddCategory = async (name: string, parentId: string | null) => {
    // Attach community ID if in community layer
    const commId = layer === 'community' ? activeCommunityId : undefined;
    await StorageService.addCategory(name, parentId, commId || undefined);
    await refreshAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm(t('confirmDeleteCat'))) {
      await StorageService.deleteCategory(id);
      await refreshAllData();
      setActiveCategory('All');
    }
  };

  const handleApprove = async (id: string) => {
    await StorageService.updateDemoStatus(id, 'published');
    await refreshAllData();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt(t('enterRejectionReason'), t('defaultRejectionReason'));
    if (reason === null) return; // User cancelled
    await StorageService.updateDemoStatus(id, 'rejected', reason);
    await refreshAllData();
  };
  
  const handleCreateBounty = async (data: {title: string, desc: string, reward: string}) => {
    await StorageService.addBounty({
      id: `b-${Date.now()}`,
      title: data.title, 
      description: data.desc, 
      reward: data.reward, 
      layer,
      communityId: layer === 'community' ? activeCommunityId || undefined : undefined,
      status: 'open', 
      creator: currentUserId, 
      createdAt: Date.now()
    });
    await refreshAllData();
  };

  const handleDeleteBounty = async (id: string) => {
    if(window.confirm(t('confirmDeleteBounty'))) {
      await StorageService.deleteBounty(id);
      await refreshAllData();
    }
  }

  const handleDeleteDemo = async (id: string) => {
    if(window.confirm(t('confirmDeleteDemo'))) {
      await StorageService.deleteDemo(id);
      await refreshAllData();
      setSelectedDemo(null);
    }
  }

  // --- Community Actions ---

  const handleCreateCommunity = async () => {
      await StorageService.createCommunity(createCommData.name, createCommData.desc, currentUserId);
      setCreateCommData({name: '', desc: ''});
      setIsCreateCommModalOpen(false);
      await refreshAllData();
      alert("Community request sent for approval.");
  };

  const handleJoinByCode = async () => {
      const success = await StorageService.joinCommunityByCode(joinCode, currentUserId);
      if(success) {
          alert(t('successMsg'));
          await refreshAllData();
          setIsJoinCodeModalOpen(false);
          setJoinCode('');
      } else {
          alert("Invalid code or already a member.");
      }
  };

  const handleRequestJoin = async (commId: string) => {
      await StorageService.joinCommunityRequest(commId, currentUserId);
      await refreshAllData();
      alert("Request sent.");
  };

  const handleApproveCommunity = async (id: string) => {
      await StorageService.approveCommunity(id);
      await refreshAllData();
  };

  const handleRejectCommunity = async (id: string) => {
      await StorageService.rejectCommunity(id);
      await refreshAllData();
  };

  const handleManageMember = async (commId: string, memberId: string, action: 'accept' | 'kick' | 'reject_request') => {
      try {
        await StorageService.manageMember(commId, memberId, action);
        await refreshAllData();
        if (action === 'accept') {
          alert(t('successMsg'));
        }
      } catch (error: any) {
        console.error('Manage member error:', error);
        alert(`${t('aiError')} (${error.message})`);
      }
  };

  const handleUpdateCommCode = async (commId: string) => {
      const newCode = prompt("Enter new 12-digit code:");
      if(newCode && newCode.length === 12) {
          await StorageService.updateCommunityCode(commId, newCode);
          await refreshAllData();
      } else if (newCode) {
          alert("Code must be 12 digits.");
      }
  };

  // Handle community update from admin panel
  const handleUpdateCommunity = async (updatedCommunity: Community) => {
      try {
          // Update the community in storage
          const communityIndex = communities.findIndex(c => c.id === updatedCommunity.id);
          if (communityIndex !== -1) {
              const newCommunities = [...communities];
              newCommunities[communityIndex] = updatedCommunity;
              setCommunities(newCommunities);
              
              // Persist to storage
              await StorageService.saveCommunity(updatedCommunity);
              await refreshAllData();
          }
      } catch (error: any) {
          console.error('Update community error:', error);
          alert(`更新失败: ${error.message}`);
      }
  };

  // Handle community deletion from admin panel
  const handleDeleteCommunity = async (communityId: string) => {
      try {
          if (window.confirm('确定要解散这个社区吗？此操作不可撤销。')) {
              await StorageService.deleteCommunity(communityId);
              await refreshAllData();
              setActiveCommunityAdminPanel(null);
              alert('社区已解散');
          }
      } catch (error: any) {
          console.error('Delete community error:', error);
          alert(`解散社区失败: ${error.message}`);
      }
  };




  const handleEditCoverClick = (demoId: string) => {
    setDemoIdToUpdateCover(demoId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && demoIdToUpdateCover) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        StorageService.updateDemoCover(demoIdToUpdateCover, base64).then(() => {
          refreshAllData().then(() => {
            alert(t('coverUpdated'));
            setDemoIdToUpdateCover(null);
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Views ---

  const renderSidebarContent = () => (
    <>
      <div className="px-4 mb-6 shrink-0">
        <div className="bg-slate-100/80 p-1 rounded-xl flex mb-4 border border-slate-200">
           <button
             onClick={() => { setLayer('general'); setActiveCommunityId(null); setView('explore'); setIsMobileSidebarOpen(false); }}
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${layer === 'general' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Globe className="w-3.5 h-3.5" />
             {t('layerGeneral')}
           </button>
           <button
             onClick={() => {
                 setLayer('community');
                 if(activeCommunityId) setView('explore');
                 else setView('community_hall');
                 setIsMobileSidebarOpen(false);
             }}
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${layer === 'community' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Users className="w-3.5 h-3.5" />
             {t('layerCommunity')}
           </button>
        </div>

        {layer === 'community' && (
            <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
                <div className="relative">
                    <button
                        onClick={() => setIsCreateCommModalOpen(true)}
                        className="w-full mb-2 border border-dashed border-indigo-300 text-indigo-600 rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-50/50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> {t('createCommunity')}
                    </button>
                </div>

                <div className="px-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('myCommunities')}</label>
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    <button 
                        onClick={() => { setActiveCommunityId(null); setView('community_hall'); }}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-xl flex items-center gap-3 transition-all ${!activeCommunityId && view === 'community_hall' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Building2 className={`w-4 h-4 ${!activeCommunityId && view === 'community_hall' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {t('communityHall')}
                    </button>
                    
                    {myCommunities.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => { setActiveCommunityId(c.id); setView('explore'); }}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-xl truncate transition-all flex items-center gap-2 ${activeCommunityId === c.id ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${activeCommunityId === c.id ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                            {c.name}
                        </button>
                    ))}
                    {myCommunities.length === 0 && (
                        <div className="text-xs text-slate-400 italic px-3 py-2">{t('noCommunities')}</div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Hide category filter in admin view */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar border-t border-slate-100/80 pt-6">
        <div className="flex items-center justify-between mb-4 px-2 sticky top-0 z-20 pb-2">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('subjects')}</h3>
           {/* Only show Add Category if General Layer (hidden for now) or Community Layer + Is Admin of that Community */}
           {layer === 'community' && activeCommunityId && isCurrentCommunityAdmin && (
             <button 
               onClick={() => openCategoryModal(null)} 
               className="text-xs bg-white text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all shadow-sm"
               title={t('addCategory')}
             >
               <Plus className="w-3.5 h-3.5" />
             </button>
           )}
        </div>
        
        <nav className="space-y-1 pb-10">
          <button 
            onClick={() => handleCategorySelect('All')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${activeCategory === 'All' ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FolderOpen className={`w-4 h-4 ${activeCategory === 'All' ? 'text-indigo-600' : 'text-slate-400'}`} />
            {t('all')}
          </button>

          {layer === 'general' ? (
            Object.values(Subject).map(sub => {
              // Map Subject enum values to translation keys
              const translationKey: any = {
                'Physics': 'physics',
                'Chemistry': 'chemistry',
                'Mathematics': 'mathematics',
                'Biology': 'biology',
                'Computer Science': 'computerScience',
                'Astronomy': 'astronomy',
                'Earth Science': 'earthScience',
                'Creative Tools': 'creativeTools'
              }[sub] || sub.toLowerCase();
              
              return (
                <button 
                  key={sub}
                  onClick={() => handleCategorySelect(sub)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${activeCategory === sub ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <SubjectIcon subject={sub} />
                  {t(translationKey)}
                </button>
              );
            })
          ) : (
            <div className="mt-2 space-y-1">
               {rootCategories.length === 0 && (
                 <div className="text-xs text-slate-400 px-4 py-2 italic">{t('noCategoriesYet')}</div>
               )}
              {rootCategories.map(cat => (
                <CategoryTreeNode 
                  key={cat.id}
                  category={cat}
                  allCategories={categories}
                  activeId={activeCategory}
                  onSelect={handleCategorySelect}
                  onAddSub={openCategoryModal}
                  onDelete={handleDeleteCategory}
                  role={isCurrentCommunityAdmin ? 'community_admin' : 'user'}
                  t={t}
                />
              ))}
            </div>
          )}
        </nav>
      </div>
    </>
  );

  const renderSidebar = () => (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 h-screen fixed left-0 top-0 pt-24 pb-6 border-r border-slate-200/60 glass-panel z-20 hidden md:flex flex-col overflow-hidden">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-white/95 backdrop-blur-xl border-r border-slate-200/60 z-50 md:hidden flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${layer === 'general' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-slate-800">{t('appTitle')}</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {/* Mobile Sidebar Content */}
              <div className="flex-1 overflow-y-auto pt-4 pb-6">
                {renderSidebarContent()}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );

  const renderTopbar = () => (
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-white/50 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3 md:gap-12">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-md overflow-hidden ${layer === 'general' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
             <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
           </div>
           <div className="hidden sm:block">
             <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">{t('appTitle')}</h1>
             <span className="text-[10px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-slate-400">
               {layer === 'general' ? t('layerGeneral') : activeCommunity ? activeCommunity.name : t('layerCommunity')}
             </span>
           </div>
        </div>

        {/* Desktop search */}
        <div className="relative hidden lg:block w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
        {/* Mobile search button */}
        <button
          onClick={() => {
            const query = prompt(t('searchPlaceholder') || 'Search demos...', searchQuery);
            if (query !== null) setSearchQuery(query);
          }}
          className="lg:hidden p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => setLanguage(l => l === 'en' ? 'cn' : 'en')}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0 transition-colors"
        >
          {language === 'en' ? 'CN' : 'EN'}
        </button>

        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200 shrink-0">
          <button
             onClick={() => setView(layer === 'community' && !activeCommunityId ? 'community_hall' : 'explore')}
             className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'explore' || view === 'community_hall' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {layer === 'community' && !activeCommunityId ? t('communityHall') : t('explore')}
          </button>

          <button
             onClick={() => setView('bounties')}
             className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'bounties' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('bounties')}
          </button>

          <button
             onClick={() => { setBountyContext(null); setView('upload'); }}
             className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('upload')}
          </button>

          {(role === 'general_admin' || (layer === 'community' && isCurrentCommunityAdmin)) && (
            <button
              onClick={() => setView('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all relative ${view === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('admin')}
              {pendingDemos.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingDemos.length > 9 ? '9+' : pendingDemos.length}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Sort Selector - Only show in explore view */}
        {(view === 'explore' || view === 'community_hall') && (
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200 shrink-0">
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy === 'date' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title={t('sortByDate') || '按时间排序'}
            >
              {t('sortDate') || '最新'}
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy === 'likes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title={t('sortByLikes') || '按点赞排序'}
            >
              {t('sortLikes') || '热门'}
            </button>
          </div>
        )}

        <div className="h-8 w-px bg-slate-200 mx-1 shrink-0"></div>

        {/* Help Guide Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              window.open('https://wcnwkefpufkl.feishu.cn/wiki/ZsPaw4F0aiEDSskK4uvcn2aDnGc?from=from_copylink', '_blank');
              setShowHelpTooltip(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 hover:shadow-md transition-all"
            title="查看使用指南"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">指南</span>
          </button>

          {/* First Login Tooltip */}
          {showHelpTooltip && isFirstLogin && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-amber-200 py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">欢迎使用！</p>
                  <p className="text-xs text-slate-600 mt-1">点击查看新手指南，快速了解如何使用本平台 🎉</p>
                </div>
              </div>
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-amber-200 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      <div className="relative ml-2 shrink-0">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center gap-2 px-1.5 py-1.5 md:px-3 md:py-1.5 rounded-full text-xs font-bold transition-all border select-none shrink-0 cursor-pointer shadow-sm
              ${role === 'user' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100 hover:shadow-md' : ''}
              ${role === 'general_admin' ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-100 hover:shadow-md' : ''}
            `}
          >
            {role === 'user' && <UserCircle className="w-5 h-5 md:w-4 md:h-4" />}
            {role === 'general_admin' && <ShieldCheck className="w-5 h-5 md:w-4 md:h-4" />}
            <span className="hidden md:inline">
              {role === 'user' ? t('roleUser') : t('roleGeneralAdmin')}
            </span>
            <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
               <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t('accessLevel')}</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{role === 'user' ? t('roleUser') : t('roleGeneralAdmin')}</p>
               </div>
               
               <button 
                  onClick={() => {
                    if (role === 'general_admin') setView('admin');
                    else setView('profile');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
               >
                  {role === 'general_admin' ? <LayoutDashboard className="w-4 h-4 text-purple-500" /> : <UserCircle className="w-4 h-4 text-emerald-500" />}
                  {role === 'general_admin' ? t('adminDashboard') : t('profileTitle')}
               </button>

               <div className="h-px bg-slate-100 my-1"></div>
               
               <button 
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 transition-colors"
               >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
               </button>
            </div>
          )}
        </div>
    </header>
  );

  const renderGallery = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-20">
      {filteredDemos.map(demo => {
        const isGeneralAdmin = role === 'general_admin';
        const isDemoCommAdmin = demo.layer === 'community' && communities.find(c => c.id === demo.communityId)?.creatorId === currentUserId;
        const canDelete = isGeneralAdmin || isDemoCommAdmin;

        return (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          key={demo.id}
          className="group glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col relative isolation-isolate hover:-translate-y-1"
        >
          <div 
             className="absolute inset-0 z-0 cursor-pointer" 
             onClick={() => setSelectedDemo(demo)}
          />

          <div className="h-44 bg-slate-50 relative overflow-hidden pointer-events-none">
            {demo.thumbnailUrl ? (
              <img src={demo.thumbnailUrl} alt={demo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 relative">
                <div className="absolute inset-0 bg-grid-slate opacity-[0.4]"></div>
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10">
                   <SubjectIcon subject={demo.categoryId} />
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-lg flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${demo.layer === 'general' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
              {demo.layer === 'general' ? demo.categoryId : communities.find(c => c.id === demo.communityId)?.name || t('layerCommunity')}
            </div>
            {demo.status === 'pending' && (
               <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {t('pending')}
               </div>
            )}
            {demo.bountyId && demo.status !== 'pending' && (
               <div className="absolute top-4 right-4 bg-amber-400 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                 <Award className="w-3 h-3" /> {t('bountySolution')}
               </div>
            )}
          </div>
          
          <div className="p-5 flex-1 flex flex-col pointer-events-none bg-white">
            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{demo.title}</h3>
            <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1 leading-relaxed">{demo.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <div className="flex items-center gap-2.5">
                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-white">
                   {demo.author[0]?.toUpperCase()}
                 </div>
                 <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">{demo.author}</span>
               </div>
               <div className="flex items-center gap-3">
                 {/* Like count */}
                 <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">
                   <Heart className="w-3 h-3" />
                   {demo.likeCount || 0}
                 </span>
                 <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">
                   {new Date(demo.createdAt).toLocaleDateString()}
                 </span>
               </div>
            </div>
          </div>

          {canDelete && (
            <div className="absolute top-14 right-4 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-4 group-hover:translate-x-0">
               <button 
                 type="button"
                 onClick={(e) => { 
                    e.stopPropagation();
                    handleEditCoverClick(demo.id); 
                 }}
                 className="p-2 bg-white text-slate-600 rounded-full hover:text-indigo-600 hover:shadow-lg transition-all cursor-pointer shadow-md pointer-events-auto border border-slate-100"
                 title={t('editCover')}
               >
                 <Camera className="w-4 h-4" />
               </button>
               <button 
                 type="button"
                 onClick={(e) => { 
                    e.stopPropagation();
                    handleDeleteDemo(demo.id); 
                 }}
                 className="p-2 bg-white text-slate-600 rounded-full hover:text-red-500 hover:shadow-lg transition-all cursor-pointer shadow-md pointer-events-auto border border-slate-100"
                 title={t('delete')}
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          )}
        </motion.div>
      );})}
      
      {filteredDemos.length === 0 && (
        <div className="col-span-full py-32 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{t('noDemosFound')}</h3>
          <p className="text-slate-500">{t('tryAdjusting')}</p>
        </div>
      )}
    </div>
  );

  const renderCommunityHall = () => {
      const approvedCommunities = communities.filter(c => c.status === 'approved');
      
      return (
          <div className="space-y-8 pb-20">
              <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Building2 className="w-8 h-8" /></div>
                        {t('communityHall')}
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">Join specialized research groups or create your own.</p>
                </div>
                <button 
                    onClick={() => setIsJoinCodeModalOpen(true)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg transition-all flex items-center gap-2 shadow-sm"
                >
                    <KeyRound className="w-4 h-4" /> {t('joinByCode')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {approvedCommunities.map(c => {
                      const isMember = c.members.includes(currentUserId);
                      const isPending = c.pendingMembers.includes(currentUserId);
                      const isCommunityAdmin = c.creatorId === currentUserId;
                      const hasPendingRequests = c.pendingMembers.length > 0;

                      return (
                          <div key={c.id} className="glass-card rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300">
                              <div className="flex justify-between items-start mb-6">
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 border border-white shadow-sm">
                                      <Users className="w-7 h-7" />
                                  </div>
                                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
                                      {c.members.length} {t('member')}
                                  </span>
                              </div>
                              <h3 className="text-xl font-bold text-slate-800 mb-3">{c.name}</h3>
                              <p className="text-sm text-slate-500 mb-8 line-clamp-2 h-10 leading-relaxed">{c.description}</p>
                              
                              <div className="flex gap-3">
                                  {/* Admin Panel Button - Only visible to community admin (regardless of membership) */}
                                  {isCommunityAdmin ? (
                                      <>
                                          <button 
                                              onClick={() => { setActiveCommunityId(c.id); setView('explore'); }}
                                              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                          >
                                              {t('open')}
                                          </button>
                                          <button
                                              onClick={() => setActiveCommunityAdminPanel(c.id)}
                                              className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 relative"
                                          >
                                              <Settings className="w-4 h-4" />
                                              管理
                                              {hasPendingRequests && (
                                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                      {c.pendingMembers.length > 9 ? '9+' : c.pendingMembers.length}
                                                  </span>
                                              )}
                                          </button>
                                      </>
                                  ) : isMember ? (
                                      <button 
                                          onClick={() => { setActiveCommunityId(c.id); setView('explore'); }}
                                          className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                      >
                                          {t('open')}
                                      </button>
                                  ) : isPending ? (
                                      <button disabled className="flex-1 px-4 py-3 bg-yellow-50 text-yellow-600 font-bold rounded-xl cursor-not-allowed border border-yellow-100">
                                          Requested
                                      </button>
                                  ) : (
                                      <button 
                                          onClick={() => handleRequestJoin(c.id)}
                                          className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                                      >
                                          {t('join')}
                                      </button>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )
  }

  const renderBounties = () => {
    // Filter bounties based on layer/community
    const visibleBounties = bounties.filter(b => {
        if(b.layer !== layer) return false;
        if(layer === 'community' && b.communityId !== activeCommunityId) return false;
        return true;
    });

    return (
      <div className="space-y-6 pb-20">
         <div className="flex justify-between items-end border-b border-slate-200 pb-6">
            <div>
               <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                 <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Target className="w-8 h-8" /></div>
                 {t('bountyHall')}
               </h2>
               <p className="text-slate-500 mt-2 text-lg">{t('bountyDesc')}</p>
            </div>
            <button 
               onClick={() => setIsBountyModalOpen(true)}
               className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
               <Plus className="w-5 h-5" /> {t('createBounty')}
            </button>
         </div>

         {visibleBounties.length === 0 && (
             <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                     <Target className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-600">{t('noActiveBounties')}</h3>
             </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {visibleBounties.map(b => (
                 <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all relative group">
                     <div className="flex justify-between items-start mb-4">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${b.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                             {b.status}
                         </span>
                         <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                             <Award className="w-4 h-4" />
                             {b.reward}
                         </span>
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">{b.title}</h3>
                     <p className="text-slate-500 text-sm mb-6 leading-relaxed">{b.description}</p>
                     
                     <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                         {b.status === 'open' && (
                             <button 
                                onClick={() => {
                                    setBountyContext(b);
                                    setView('upload');
                                }}
                                className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                             >
                                 {t('submitSolution')}
                             </button>
                         )}
                         {(role === 'general_admin' || b.creator === currentUserId) && (
                             <button 
                                onClick={() => handleDeleteBounty(b.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                             >
                                 <Trash2 className="w-5 h-5" />
                             </button>
                         )}
                     </div>
                 </div>
             ))}
         </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    // Only General Admin or Community Admin can see this
    if (role !== 'general_admin' && !isCurrentCommunityAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-bold">Access Restricted</h2>
            </div>
        );
    }

    const pendingComms = role === 'general_admin' ? communities.filter(c => c.status === 'pending') : [];

    return (
      <div className="space-y-8 pb-20">
         <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
             <div className="p-2 bg-purple-100 rounded-xl text-purple-600"><LayoutDashboard className="w-8 h-8" /></div>
             <div>
                 <h2 className="text-3xl font-bold text-slate-800">{t('adminDashboard')}</h2>
                 <p className="text-slate-500 mt-1">{role === 'general_admin' ? t('generalAdminView') : activeCommunity?.name}</p>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatsCard label={t('statsPending')} value={pendingDemos.length} color="bg-orange-500 text-orange-500" />
             {role === 'general_admin' && (
                 <StatsCard label="Pending Communities" value={pendingComms.length} color="bg-blue-500 text-blue-500" />
             )}
             <StatsCard label={t('statsUsers')} value={role === 'general_admin' ? "1,240" : (activeCommunity?.members.length || 0)} color="bg-emerald-500 text-emerald-500" />
         </div>

         {/* Pending Communities (General Admin Only) */}
         {role === 'general_admin' && pendingComms.length > 0 && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 flex items-center gap-2">
                         <Building2 className="w-5 h-5 text-indigo-500" /> Pending Communities
                     </h3>
                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{pendingComms.length}</span>
                 </div>
                 <div className="divide-y divide-slate-100">
                     {pendingComms.map(c => (
                         <div key={c.id} className="p-6 flex items-center justify-between">
                             <div>
                                 <h4 className="font-bold text-slate-800">{c.name}</h4>
                                 <p className="text-sm text-slate-500">{c.description}</p>
                                 <p className="text-xs text-slate-400 mt-1">Creator ID: {c.creatorId}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleRejectCommunity(c.id)} className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 text-xs">{t('reject')}</button>
                                 <button onClick={() => handleApproveCommunity(c.id)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-xs">{t('approve')}</button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {/* Community Member Requests (Community Admin Only) */}
         {isCurrentCommunityAdmin && activeCommunity && activeCommunity.pendingMembers.length > 0 && (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 flex items-center gap-2">
                         <Users className="w-5 h-5 text-emerald-500" /> {t('pendingRequests')}
                     </h3>
                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">{activeCommunity.pendingMembers.length}</span>
                 </div>
                 <div className="divide-y divide-slate-100">
                     {activeCommunity.pendingMembers.map(uid => (
                         <div key={uid} className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                     {uid.substring(0,2)}
                                 </div>
                                 <span className="font-medium text-slate-700">User: {uid}</span>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleManageMember(activeCommunity.id, uid, 'kick')} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-bold">{t('reject')}</button>
                                 <button onClick={() => handleManageMember(activeCommunity.id, uid, 'accept')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-xs font-bold">{t('accept')}</button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
         
         {/* Pending Demos */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-orange-500" /> {t('pending')}
                </h3>
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">{pendingDemos.length}</span>
            </div>
            
            {pendingDemos.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                    {t('emptyPending')}
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {pendingDemos.map(d => (
                        <div key={d.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.layer === 'general' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {d.layer}
                                    </span>
                                    {d.layer === 'community' && d.communityId && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                            {communities.find(c => c.id === d.communityId)?.name || 'Unknown Community'}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg">{d.title}</h4>
                                <p className="text-sm text-slate-500 mb-2">{d.description}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <UserCircle className="w-3 h-3" /> {d.author}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                                <button 
                                    onClick={() => setSelectedDemo(d)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Preview Code"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-px bg-slate-200"></div>
                                <button 
                                    onClick={() => handleReject(d.id)}
                                    className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 text-sm transition-colors"
                                >
                                    {t('reject')}
                                </button>
                                <button 
                                    onClick={() => handleApprove(d.id)}
                                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-200 text-sm transition-colors"
                                >
                                    {t('approve')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

         {/* Members List (Community Only) */}
         {isCurrentCommunityAdmin && activeCommunity && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-500" /> {t('members')}
                    </h3>
                    <button 
                        onClick={() => handleUpdateCommCode(activeCommunity.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Reset Code ({activeCommunity.code})
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {activeCommunity.members.map(uid => (
                        <div key={uid} className="px-6 py-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">{uid} {uid === currentUserId ? '(You)' : ''}</span>
                            {/* Only creator can kick members */}
                            {uid !== currentUserId && activeCommunity.creatorId === currentUserId && (
                                <button 
                                    onClick={() => handleManageMember(activeCommunity.id, uid, 'kick')}
                                    className="text-xs text-red-400 hover:text-red-600 font-bold"
                                >
                                    Kick
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
         )}
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
             <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><UserCircle className="w-8 h-8" /></div>
             <div>
                 <h2 className="text-3xl font-bold text-slate-800">{t('profileTitle')}</h2>
                 <p className="text-slate-500 mt-1">{t('roleUser')}: {currentUserId}</p>
             </div>
             <button onClick={handleLogout} className="ml-auto flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-sm">
                 <LogOut className="w-4 h-4" /> {t('logout')}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('accountType')}</h4>
                  <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${role === 'general_admin' ? 'text-purple-500' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-700 capitalize">{role.replace('_', ' ')}</span>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('memberSince')}</h4>
                  <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="font-bold text-slate-700">Dec 2023</span>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('contributions')}</h4>
                  <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-indigo-500" />
                      <span className="font-bold text-slate-700">
                        {demos.filter(d => d.author === currentUserId).length} Demos
                        {demos.filter(d => d.author === currentUserId && d.status === 'pending').length > 0 && (
                          <span className="ml-2 text-xs text-amber-600">
                            ({demos.filter(d => d.author === currentUserId && d.status === 'pending').length} {t('pending')})
                          </span>
                        )}
                      </span>
                  </div>
              </div>
          </div>

          {/* My Uploads Section */}
          <div>
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">My Uploads</h3>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {demos.filter(d => d.author === currentUserId).length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                          No uploads yet. Start sharing your work!
                      </div>
                  ) : (
                      <div className="divide-y divide-slate-100">
                          {demos.filter(d => d.author === currentUserId).map(demo => (
                              <div key={demo.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                          <SubjectIcon subject={demo.categoryId} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800">{demo.title}</h4>
                                          <p className="text-xs text-slate-500">{new Date(demo.createdAt).toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      {demo.status === 'pending' && (
                                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                              {t('pending')}
                                          </span>
                                      )}
                                      {demo.status === 'published' && (
                                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                              {t('approved')}
                                          </span>
                                      )}
                                      {demo.status === 'rejected' && (
                                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold" title={demo.rejectionReason}>
                                              {t('rejected')}
                                          </span>
                                      )}
                                      <button 
                                          onClick={() => setSelectedDemo(demo)}
                                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      >
                                          <Search className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          <div>
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{t('myCommunities')}</h3>
                  <button 
                      onClick={() => setIsCreateCommModalOpen(true)}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-sm flex items-center gap-2 transition-all"
                  >
                      <Plus className="w-4 h-4" /> {t('createCommunity')}
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {communities.filter(c => c.members.includes(currentUserId) || c.creatorId === currentUserId).map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                 <Building2 className="w-6 h-6" />
                             </div>
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                 {c.status}
                             </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{c.name}</h4>
                          <p className="text-sm text-slate-500 mb-6 flex-1">{c.description}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <span className="text-xs text-slate-400 font-medium">Code: <span className="font-mono bg-slate-100 px-1 rounded">{c.code}</span></span>
                              <div className="flex -space-x-2">
                                  {c.members.slice(0, 3).map((m, i) => (
                                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                                          {m[0]}
                                      </div>
                                  ))}
                                  {c.members.length > 3 && (
                                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                                          +{c.members.length - 3}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
                  {communities.filter(c => c.members.includes(currentUserId) || c.creatorId === currentUserId).length === 0 && (
                      <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                          No communities found. Create one or join via code!
                      </div>
                  )}
              </div>
          </div>
      </div>
    );
  };

  // --- Auth Gate ---
  if (!isLoggedIn) {
    return <AuthPage onLogin={handleLogin} t={t} />;
  }

  return (
    <div className="min-h-screen text-slate-600 font-sans bg-slate-50/50 relative">
      <div className="fixed inset-0 bg-grid-slate opacity-[0.4] pointer-events-none z-0"></div>
      
      {renderTopbar()}
      {renderSidebar()}

      <main className="pt-20 md:pt-24 pb-24 md:pb-20 px-3 sm:px-4 md:px-10 md:pl-80 w-full transition-all duration-300 relative z-10">
        <div className="w-full max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {view === 'explore' && renderGallery()}
              {view === 'community_hall' && renderCommunityHall()}
              {view === 'bounties' && renderBounties()}
              {view === 'upload' && (
                <UploadWizard 
                  t={t} 
                  categories={categories}
                  communities={communities}
                  currentUserId={currentUserId}
                  onSubmit={handleUpload} 
                  onCancel={() => setView('explore')}
                  bountyContext={bountyContext}
                />
              )}
              {view === 'admin' && renderAdminDashboard()}
              {view === 'profile' && renderProfile()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Community Admin Panel Modal */}
      {activeCommunityAdminPanel && (
        <CommunityAdminPanel
          community={communities.find(c => c.id === activeCommunityAdminPanel)!}
          currentUserId={currentUserId}
          onClose={() => setActiveCommunityAdminPanel(null)}
          onUpdateCommunity={handleUpdateCommunity}
          onDeleteCommunity={handleDeleteCommunity}
          onManageMember={handleManageMember}
          t={t}
        />
      )}

      {/* Modals and AI Widget remain the same in logic, UI inherits global styles */}
      <CreateBountyModal 
        isOpen={isBountyModalOpen}
        onClose={() => setIsBountyModalOpen(false)}
        onSubmit={handleCreateBounty}
        t={t}
      />

      <CreateCategoryModal 
        isOpen={categoryModal.isOpen}
        parentId={categoryModal.parentId}
        onClose={() => setCategoryModal({ ...categoryModal, isOpen: false })}
        onSubmit={handleAddCategory}
        t={t}
      />
      
      {/* Join By Code Modal */}
      {isJoinCodeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
             <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-200 border border-white">
                 <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 mx-auto text-indigo-600">
                    <KeyRound className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-slate-800 mb-2 text-center text-lg">{t('joinByCode')}</h3>
                 <p className="text-slate-500 text-center text-sm mb-6">Enter the exclusive access code provided by the community admin.</p>
                 
                 <input 
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 font-mono text-center tracking-[0.2em] text-lg uppercase focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                    placeholder="XXXXXXXXXXXX"
                    maxLength={12}
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                 />
                 <div className="flex gap-3">
                     <button onClick={() => setIsJoinCodeModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">{t('cancel')}</button>
                     <button onClick={handleJoinByCode} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all">{t('join')}</button>
                 </div>
             </div>
          </div>
      )}

      {/* Create Community Modal */}
      {isCreateCommModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200 border border-white">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Building2 className="w-6 h-6"/></div>
                    <h3 className="font-bold text-slate-800 text-xl">{t('createCommunityTitle')}</h3>
                 </div>
                 
                 <div className="space-y-5 mb-8">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('communityName')}</label>
                         <input 
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                            value={createCommData.name} 
                            onChange={e => setCreateCommData({...createCommData, name: e.target.value})}
                            placeholder="e.g. Quantum Research Group"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('communityDesc')}</label>
                         <textarea 
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                            rows={3}
                            value={createCommData.desc} 
                            onChange={e => setCreateCommData({...createCommData, desc: e.target.value})}
                            placeholder="Briefly describe your research goals..."
                         />
                     </div>
                 </div>
                 <div className="flex gap-3">
                     <button onClick={() => setIsCreateCommModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">{t('cancel')}</button>
                     <button onClick={handleCreateCommunity} disabled={!createCommData.name} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all">{t('create')}</button>
                 </div>
             </div>
          </div>
      )}

      {/* ... Floating AI Widget ... */}
      <AiChatWidget 
        t={t} 
        language={language}
        onOpenDemo={(demoId) => {
          console.log('App: Looking for demo:', demoId);
          const demo = demos.find(d => d.id === demoId);
          if (demo) {
            setSelectedDemo(demo);
          } else {
            console.error('App: Demo not found:', demoId);
            alert(`演示程序 "${demoId}" 不存在。这可能是AI产生了幻觉。请尝试其他关键词或浏览探索页面。`);
          }
        }}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
      />
      
      {/* Hidden File Input for Cover Update */}
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleFileChange} 
         className="hidden" 
         accept="image/*"
      />

      <AnimatePresence>
        {selectedDemo && (
          <DemoPlayer
            demo={selectedDemo}
            onClose={() => setSelectedDemo(null)}
            t={t}
            onOpenDemo={(demoId) => {
              console.log('DemoPlayer onOpenDemo:', demoId);
              console.log('Available demos:', demos.length);
              const demo = demos.find(d => d.id === demoId);
              console.log('Found demo:', demo);
              if (demo) {
                setSelectedDemo(demo);
              } else {
                console.error('Demo not found:', demoId);
              }
            }}
            onLikeChange={(demoId, newLikeCount, newUserLiked) => {
              // Update the demos array with new like count
              setDemos(prevDemos =>
                prevDemos.map(d =>
                  d.id === demoId
                    ? { ...d, likeCount: newLikeCount, userLiked: newUserLiked }
                    : d
                )
              );
              // Also update selectedDemo if it's the same demo
              setSelectedDemo(prev =>
                prev && prev.id === demoId
                  ? { ...prev, likeCount: newLikeCount, userLiked: newUserLiked }
                  : prev
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer - appears when scrolled to bottom */}
      <footer className="py-6 px-4 md:pl-80 w-full">
        <div className="max-w-[1400px] mx-auto flex justify-center items-center">
          <div className="group relative cursor-pointer">
            <p className="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">@构建团队</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Built by Kyra,兰海粟,Vincent,Lloyd
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
