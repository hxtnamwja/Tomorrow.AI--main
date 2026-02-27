import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingCart, CheckCircle, Palette, Image as ImageIcon, Type, Trophy, Frame, Sparkles, Layers, Crown, Gift, Zap, Gem, Check, Wand2, UserCircle, Cpu, Gamepad2, Atom, FlaskConical, Compass, Cat, Rabbit, Lightbulb, Droplets, Flame, Ghost, HelpCircle, Award } from 'lucide-react';
import { User as UserType, Language } from '../types';
import { StorageService } from '../services/storageService';
import {
  AVATAR_BORDERS,
  AVATAR_ACCESSORIES,
  AVATAR_EFFECTS,
  PROFILE_THEMES,
  PROFILE_BACKGROUNDS,
  USERNAME_COLORS,
  USERNAME_EFFECTS,
  CUSTOM_TITLES,
  PROFILE_EFFECTS
} from '../constants';

interface PointsShopProps {
  currentUserId: string;
  lang: Language;
  t: (key: string) => string;
  onBack: () => void;
}

type ShopCategory = 'avatar' | 'profile' | 'username';

export const PointsShop: React.FC<PointsShopProps> = ({ currentUserId, lang, t, onBack }) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('avatar');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentlyPurchased, setRecentlyPurchased] = useState<string[]>([]);
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [currentUserId]);

  const loadUserData = async () => {
    try {
      const userData = await StorageService.getUserById(currentUserId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <p>Failed to load user data</p>
      </div>
    );
  }

  const userPoints = user.role === 'general_admin' ? 5000 : (user.points || 0);
  const isOwned = (itemId: string) => {
    return (user.ownedItems || []).some(item => item.id === itemId);
  };

  const isActive = (itemType: string, itemId: string) => {
    switch (itemType) {
      case 'avatarBorder':
        return user.avatarBorder === itemId;
      case 'avatarAccessory':
        return user.avatarAccessory === itemId;
      case 'avatarEffect':
        return user.avatarEffect === itemId;
      case 'profileTheme':
        return user.profileTheme === itemId;
      case 'profileBackground':
        return user.profileBackground === itemId;
      case 'profileEffect':
        return user.profileEffect === itemId;
      case 'usernameColor':
        return user.usernameColor === itemId;
      case 'usernameEffect':
        return user.usernameEffect === itemId;
      case 'customTitle':
        return user.customTitle === itemId;
      default:
        return false;
    }
  };

  const handleApply = async (itemType: string, itemId: string) => {
    setApplying(itemId);
    try {
      const updateData: any = {};
      const isCurrentlyActive = isActive(itemType, itemId);
      
      switch (itemType) {
        case 'avatarBorder':
          updateData.avatarBorder = isCurrentlyActive ? null : itemId;
          break;
        case 'avatarAccessory':
          updateData.avatarAccessory = isCurrentlyActive ? null : itemId;
          break;
        case 'avatarEffect':
          updateData.avatarEffect = isCurrentlyActive ? null : itemId;
          break;
        case 'profileTheme':
          updateData.profileTheme = isCurrentlyActive ? null : itemId;
          break;
        case 'profileBackground':
          updateData.profileBackground = isCurrentlyActive ? null : itemId;
          break;
        case 'profileEffect':
          updateData.profileEffect = isCurrentlyActive ? null : itemId;
          break;
        case 'usernameColor':
          updateData.usernameColor = isCurrentlyActive ? null : itemId;
          break;
        case 'usernameEffect':
          updateData.usernameEffect = isCurrentlyActive ? null : itemId;
          break;
        case 'customTitle':
          updateData.customTitle = isCurrentlyActive ? null : itemId;
          break;
      }
      
      const updatedUser = await StorageService.updateUser(currentUserId, updateData);
      setUser(updatedUser);
      setMessage({ 
        text: isCurrentlyActive 
          ? (lang === 'cn' ? '✨ 已取消使用！' : '✨ Unused!') 
          : (lang === 'cn' ? '✨ 已应用！' : '✨ Applied!'), 
        type: 'success' 
      });
    } catch (error) {
      console.error('Apply failed:', error);
      setMessage({ text: lang === 'cn' ? '应用失败，请重试' : 'Apply failed, please try again', type: 'error' });
    } finally {
      setApplying(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePurchase = async (itemType: string, itemId: string, price: number) => {
    if (isOwned(itemId)) {
      setMessage({ text: lang === 'cn' ? '你已经拥有这个商品了！' : 'You already own this item!', type: 'error' });
      return;
    }

    if (userPoints < price) {
      setMessage({ text: lang === 'cn' ? '积分不足！' : 'Not enough points!', type: 'error' });
      return;
    }

    setPurchasing(itemId);
    try {
      const newPoints = (user.points || 0) - price;
      const updateData: any = {
        points: newPoints,
        ownedItems: [
          ...(user.ownedItems || []),
          { type: itemType, id: itemId, purchasedAt: Date.now() }
        ]
      };
      
      const updatedUser = await StorageService.updateUser(currentUserId, updateData);
      setUser(updatedUser);
      setRecentlyPurchased(prev => [...prev, itemId]);
      setMessage({ text: lang === 'cn' ? '🎉 购买成功！立即使用吧！' : '🎉 Purchase successful! Use it now!', type: 'success' });
      
      setTimeout(() => {
        setRecentlyPurchased(prev => prev.filter(id => id !== itemId));
      }, 3000);
    } catch (error) {
      console.error('Purchase failed:', error);
      setMessage({ text: lang === 'cn' ? '购买失败，请重试' : 'Purchase failed, please try again', type: 'error' });
    } finally {
      setPurchasing(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const categories: { id: ShopCategory; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'avatar', 
      label: lang === 'cn' ? '头像定制' : 'Avatar', 
      icon: <Frame className="w-5 h-5" />,
      description: lang === 'cn' ? '让你的头像更有个性' : 'Make your avatar unique'
    },
    { 
      id: 'profile', 
      label: lang === 'cn' ? '个人主页' : 'Profile', 
      icon: <Layers className="w-5 h-5" />,
      description: lang === 'cn' ? '打造专属个人空间' : 'Build your personal space'
    },
    { 
      id: 'username', 
      label: lang === 'cn' ? '名字特效' : 'Username', 
      icon: <Type className="w-5 h-5" />,
      description: lang === 'cn' ? '让你的名字闪耀' : 'Make your name shine'
    },
  ];

  const renderProductCard = (item: any, type: string) => {
    const owned = isOwned(item.id);
    const recentlyBought = recentlyPurchased.includes(item.id);
    const itemType = type === 'border' ? 'avatarBorder' : 
                     type === 'accessory' ? 'avatarAccessory' :
                     type === 'effect' && PROFILE_EFFECTS.some(e => e.id === item.id) ? 'profileEffect' :
                     type === 'effect' && AVATAR_EFFECTS.some(e => e.id === item.id) ? 'avatarEffect' :
                     type === 'theme' ? 'profileTheme' :
                     type === 'background' ? 'profileBackground' :
                     type === 'color' ? 'usernameColor' :
                     type === 'effect' && USERNAME_EFFECTS.some(e => e.id === item.id) ? 'usernameEffect' :
                     type === 'title' ? 'customTitle' :
                     '';
    const active = isActive(itemType, item.id);
    
    return (
      <div 
        key={item.id} 
        className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-500 ${
          active 
            ? 'border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-400/50' 
            : owned 
              ? 'border-slate-200 bg-slate-50/50' 
              : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1'
        }`}
      >
        {active && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full shadow-lg">
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{lang === 'cn' ? '使用中' : 'Active'}</span>
            </div>
          </div>
        )}
        
        {owned && !active && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-500 text-white rounded-full shadow-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{lang === 'cn' ? '已拥有' : 'Owned'}</span>
            </div>
          </div>
        )}
        
        {recentlyBought && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-400/30 to-transparent animate-pulse" />
          </div>
        )}
        
        <div className="p-5">
          <div className={`mb-4 flex items-center justify-center ${!owned && !active ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}>
            {type === 'border' && (
              <div className="relative">
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center shadow-xl"
                  style={{ 
                    background: typeof item.color === 'string' && item.color.includes('gradient') 
                      ? item.color 
                      : 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)',
                    boxShadow: active 
                      ? `0 0 40px ${typeof item.color === 'string' && !item.color.includes('gradient') ? item.color + '80' : 'rgba(59, 130, 246, 0.5)'}`
                      : '0 0 20px rgba(148, 163, 184, 0.3)'
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-inner">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle, #cbd5e1 0%, #94a3b8 100%)'
                      }}
                    >
                      <UserCircle className="w-10 h-10 text-slate-600" />
                    </div>
                  </div>
                </div>
                {typeof item.color === 'string' && (
                  <div 
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      border: `6px solid transparent`,
                      background: item.color,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      padding: '6px'
                    }}
                  />
                )}
              </div>
            )}
            
            {type === 'accessory' && (
              <div 
                className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                style={{ background: item.bg || 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
                {(() => {
                  switch(item.icon) {
                    case 'crown':
                    case 'emperor':
                      return <Crown className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#fbbf24' }} />;
                    case 'atom':
                      return <Atom className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#3b82f6' }} />;
                    case 'flask':
                      return <FlaskConical className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#10b981' }} />;
                    case 'compass':
                      return <Compass className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#8b5cf6' }} />;
                    case 'cat':
                      return <Cat className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#f97316' }} />;
                    case 'bunny':
                    case 'rabbit':
                      return <Rabbit className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#ec4899' }} />;
                    case 'star':
                      return <Star className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#fbbf24' }} />;
                    case 'trophy':
                      return <Trophy className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#eab308' }} />;
                    case 'diamond':
                    case 'gem':
                      return <Gem className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#06b6d4' }} />;
                    case 'santa':
                    case 'gift':
                      return <Gift className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#ef4444' }} />;
                    case 'pumpkin':
                      return <Ghost className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#f97316' }} />;
                    case 'lantern':
                    case 'lightbulb':
                      return <Lightbulb className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#dc2626' }} />;
                    case 'sparkles':
                      return <Sparkles className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#f0abfc' }} />;
                    case 'flame':
                      return <Flame className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#ef4444' }} />;
                    case 'wand2':
                      return <Wand2 className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#f472b6' }} />;
                    default:
                      return <Sparkles className="w-14 h-14 relative z-10 drop-shadow-lg" style={{ color: item.color || '#ffffff' }} />;
                  }
                })()}
              </div>
            )}
            
            {type === 'effect' && (
              <div 
                className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                style={{ background: item.bg || 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }}
              >
                {(() => {
                  switch(item.animation) {
                    case 'glow':
                      return (
                        <>
                          <div 
                            className="absolute inset-0 animate-pulse"
                            style={{ 
                              background: `radial-gradient(circle, ${item.color}40 0%, transparent 70%)`,
                              boxShadow: `0 0 40px ${item.color}60`
                            }} 
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles 
                              className="w-14 h-14 relative z-10 drop-shadow-xl animate-bounce" 
                              style={{ color: item.color }} 
                            />
                          </div>
                        </>
                      );
                    case 'pulse':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="absolute w-20 h-20 rounded-full animate-ping"
                              style={{ background: `${item.color}30` }}
                            />
                            <div 
                              className="absolute w-16 h-16 rounded-full animate-pulse"
                              style={{ background: `${item.color}50` }}
                            />
                            <Zap className="w-12 h-12 relative z-10 drop-shadow-xl" style={{ color: item.color }} />
                          </div>
                        </>
                      );
                    case 'aura':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="absolute w-24 h-24 rounded-full animate-spin"
                              style={{ 
                                background: `conic-gradient(from 0deg, transparent, ${item.color}, transparent)`,
                                filter: 'blur(4px)'
                              }}
                            />
                            <div 
                              className="absolute w-18 h-18 rounded-full animate-spin"
                              style={{ 
                                background: `conic-gradient(from 180deg, transparent, ${item.color}, transparent)`,
                                animationDuration: '3s',
                                filter: 'blur(2px)'
                              }}
                            />
                            <Wand2 className="w-12 h-12 relative z-10 drop-shadow-xl" style={{ color: item.color }} />
                          </div>
                        </>
                      );
                    case 'fire':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Flame className="w-16 h-16 relative z-10 drop-shadow-xl animate-bounce" style={{ color: item.color }} />
                            <div 
                              className="absolute w-10 h-10 rounded-full animate-ping"
                              style={{ 
                                background: `${item.color}40`,
                                animationDelay: '0.5s'
                              }}
                            />
                          </div>
                        </>
                      );
                    case 'water':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Droplets className="w-16 h-16 relative z-10 drop-shadow-xl animate-pulse" style={{ color: item.color }} />
                            <div 
                              className="absolute w-14 h-14 rounded-full animate-pulse"
                              style={{ 
                                background: `radial-gradient(circle, ${item.color}40 0%, transparent 70%)`,
                                animationDuration: '2s'
                              }}
                            />
                          </div>
                        </>
                      );
                    case 'wind':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ background: `${item.color}60`, top: '30%', left: '20%' }} />
                              <div className="absolute w-3 h-3 rounded-full animate-pulse" style={{ background: `${item.color}40`, top: '60%', left: '70%', animationDelay: '0.5s' }} />
                              <div className="absolute w-2 h-2 rounded-full animate-bounce" style={{ background: `${item.color}50`, top: '20%', left: '80%', animationDelay: '1s' }} />
                            </div>
                            <Atom className="w-12 h-12 relative z-10 drop-shadow-xl" style={{ color: item.color }} />
                          </div>
                        </>
                      );
                    case 'aurora':
                      return (
                        <>
                          <div 
                            className="absolute inset-0 animate-pulse"
                            style={{ 
                              background: 'linear-gradient(45deg, #10b98140, #06b6d440, #8b5cf640)',
                              backgroundSize: '400% 400%',
                              animation: 'gradient 3s ease infinite'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Gem className="w-14 h-14 relative z-10 drop-shadow-xl" style={{ color: '#10b981' }} />
                          </div>
                        </>
                      );
                    case 'supernova':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="absolute w-24 h-24 rounded-full animate-ping"
                              style={{ background: 'radial-gradient(circle, #fbbf2460, transparent)' }}
                            />
                            <div 
                              className="absolute w-18 h-18 rounded-full animate-pulse"
                              style={{ background: 'radial-gradient(circle, #f9731650, transparent)', animationDelay: '0.3s' }}
                            />
                            <Zap className="w-12 h-12 relative z-10 drop-shadow-xl" style={{ color: '#fbbf24' }} />
                          </div>
                        </>
                      );
                    case 'quantum':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute w-16 h-16 rounded-full animate-spin" style={{ 
                              border: '2px dashed #22d3ee60',
                              animationDuration: '2s'
                            }} />
                            <div className="absolute w-20 h-20 rounded-full animate-spin" style={{ 
                              border: '2px solid #22d3ee40',
                              animationDuration: '3s',
                              animationDirection: 'reverse'
                            }} />
                            <Atom className="w-12 h-12 relative z-10 drop-shadow-xl" style={{ color: item.color }} />
                          </div>
                        </>
                      );
                    case 'flash':
                      return (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 animate-pulse" style={{ 
                              background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`
                            }} />
                            <Sparkles className="w-14 h-14 relative z-10 drop-shadow-xl animate-bounce" style={{ color: item.color }} />
                          </div>
                        </>
                      );
                    default:
                      return (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                          <Zap className="w-14 h-14 text-white relative z-10 drop-shadow-xl animate-pulse" />
                        </>
                      );
                  }
                })()}
              </div>
            )}
            
            {type === 'theme' && (
              <div 
                className="w-full h-32 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden relative"
                style={{ background: item.colors.background }}
              >
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-2 left-2 w-16 h-16 border-2 border-white/30 rounded-full" />
                  <div className="absolute bottom-2 right-2 w-12 h-12 border-2 border-white/20 rounded-xl" />
                </div>
                <Palette className="w-10 h-10 relative z-10 drop-shadow-lg" 
                  style={{ 
                    color: (item.colors.background === '#f8fafc' || item.colors.background === '#fefce8') 
                      ? '#1e293b' 
                      : '#f8fafc' 
                  }} 
                />
              </div>
            )}
            
            {type === 'background' && (
              <div 
                className="w-full h-32 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
              >
                {(() => {
                  const pattern = item.pattern;
                  const color = item.colors?.accent1 || '#8b5cf6';
                  const color2 = item.colors?.accent2 || '#6d28d9';
                  const color3 = item.colors?.accent3 || '#5b21b6';
                  
                  switch(pattern) {
                    case 'mosaic-diamond':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/4 left-1/4 w-12 h-12 rotate-45" style={{ backgroundColor: `${color}20`, animation: 'mosaicPulse 3s ease-in-out infinite' }} />
                          <div className="absolute top-1/4 right-1/4 w-10 h-10 rotate-12" style={{ backgroundColor: `${color2}15`, animation: 'mosaicPulse 3s ease-in-out infinite 0.5s' }} />
                          <div className="absolute bottom-1/4 left-1/3 w-14 h-14 -rotate-12" style={{ backgroundColor: `${color}25`, animation: 'mosaicPulse 3s ease-in-out infinite 1s' }} />
                          <div className="absolute bottom-1/4 right-1/5 w-10 h-10 rotate-45" style={{ backgroundColor: `${color2}18`, animation: 'mosaicPulse 3s ease-in-out infinite 1.5s' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rotate-0" style={{ backgroundColor: `${color}15`, animation: 'mosaicPulse 3s ease-in-out infinite 0.25s' }} />
                        </div>
                      );
                    case 'herringbone':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(6)].map((_, i) => (
                            <div 
                              key={i}
                              className="absolute"
                              style={{
                                left: `${10 + i * 15}%`,
                                top: '10%',
                                width: '30px',
                                height: '80%',
                                background: `repeating-linear-gradient(
                                  45deg,
                                  ${color}25 0px,
                                  ${color}25 12px,
                                  transparent 12px,
                                  transparent 24px
                                )`,
                                transform: `translateY(${i % 2 === 0 ? '0' : '12'}px)`,
                                opacity: 0.7,
                                animation: 'herringboneSlide 4s ease-in-out infinite'
                              }}
                            />
                          ))}
                        </div>
                      );
                    case 'greek':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/4 left-1/4 right-1/4" style={{ borderTop: `3px solid ${color}35`, borderBottom: `3px solid ${color}35`, height: '45px', animation: 'greekPulse 3s ease-in-out infinite' }} />
                          <div className="absolute top-1/2 left-1/4 right-1/4" style={{ borderTop: `2px solid ${color2}30`, borderBottom: `2px solid ${color2}30`, height: '30px', transform: 'translateY(30px)', animation: 'greekPulse 3s ease-in-out infinite 0.5s' }} />
                          <div className="absolute top-1/4 left-1/4 w-3 h-full" style={{ borderLeft: `2px solid ${color}30`, borderRight: `2px solid ${color}30`, animation: 'greekPulse 3s ease-in-out infinite 0.25s' }} />
                          <div className="absolute top-1/4 right-1/4 w-3 h-full" style={{ borderLeft: `2px solid ${color2}25`, borderRight: `2px solid ${color2}25`, animation: 'greekPulse 3s ease-in-out infinite 0.75s' }} />
                          <div className="absolute top-6 left-6 w-16 h-16" style={{ border: `2px solid ${color}20`, animation: 'greekRotate 10s linear infinite' }} />
                          <div className="absolute bottom-6 right-6 w-14 h-14" style={{ border: `2px solid ${color2}18`, animation: 'greekRotate 10s linear infinite reverse' }} />
                        </div>
                      );
                    case 'modern-grid':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute left-1/4 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color}30`, animation: 'gridPulse 2s ease-in-out infinite' }} />
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color2}25`, animation: 'gridPulse 2s ease-in-out infinite 0.3s' }} />
                          <div className="absolute left-3/4 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color}30`, animation: 'gridPulse 2s ease-in-out infinite 0.6s' }} />
                          <div className="absolute top-1/4 left-0 right-0 h-0.5" style={{ backgroundColor: `${color2}25`, animation: 'gridPulse 2s ease-in-out infinite 0.15s' }} />
                          <div className="absolute top-1/2 left-0 right-0 h-0.5" style={{ backgroundColor: `${color}30`, animation: 'gridPulse 2s ease-in-out infinite 0.45s' }} />
                          <div className="absolute top-3/4 left-0 right-0 h-0.5" style={{ backgroundColor: `${color2}25`, animation: 'gridPulse 2s ease-in-out infinite 0.75s' }} />
                          <div className="absolute top-1/8 left-1/8 w-14 h-14" style={{ border: `1.5px solid ${color}20`, animation: 'gridRotate 8s linear infinite' }} />
                          <div className="absolute top-5/8 left-5/8 w-12 h-12" style={{ border: `1.5px solid ${color2}18`, animation: 'gridRotate 8s linear infinite reverse' }} />
                        </div>
                      );
                    case 'sacred':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-20 rounded-full" style={{ border: `3px solid ${color}`, animation: 'sacredPulse 4s ease-in-out infinite' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-22 h-22 opacity-25 rounded-full" style={{ border: `3px solid ${color2}`, transform: 'translate(-50%, -50%) rotate(45deg)', animation: 'sacredPulse 4s ease-in-out infinite 0.5s' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 opacity-30" style={{ backgroundColor: color, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', animation: 'sacredRotate 15s linear infinite' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-15" style={{ border: `2px dashed ${color}`, borderRadius: '50%', animation: 'sacredRotate 20s linear infinite reverse' }} />
                        </div>
                      );
                    case 'art-deco-fan':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(12)].map((_, i) => (
                            <div 
                              key={i} 
                              className="absolute top-1/2 left-1/2 w-1.5 origin-top"
                              style={{ 
                                background: i % 3 === 0 ? `${color}35` : i % 3 === 1 ? `${color2}25` : `${color}20`,
                                height: '50%',
                                transform: `translate(-50%, -100%) rotate(${(i * 15) - 90}deg)`,
                                transformOrigin: 'bottom center',
                                animation: 'artDecoWave 3s ease-in-out infinite'
                              }} 
                            />
                          ))}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18" style={{ border: `2px solid ${color}30`, borderRadius: '50%', animation: 'artDecoPulse 2s ease-in-out infinite' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12" style={{ backgroundColor: `${color2}20`, borderRadius: '50%', animation: 'artDecoPulse 2s ease-in-out infinite 0.3s' }} />
                        </div>
                      );
                    case 'hexagonal':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          {[
                            { x: 20, y: 25, size: 45 },
                            { x: 60, y: 35, size: 38 },
                            { x: 40, y: 55, size: 52 },
                            { x: 75, y: 65, size: 42 },
                            { x: 25, y: 70, size: 35 }
                          ].map((hex, i) => (
                            <div
                              key={i}
                              className="absolute"
                              style={{
                                left: `${hex.x}%`,
                                top: `${hex.y}%`,
                                width: `${hex.size}px`,
                                height: `${hex.size}px`,
                                backgroundColor: i % 2 === 0 ? `${color}20` : `${color2}15`,
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                transform: 'translate(-50%, -50%)',
                                animation: `hexagonPulse ${2.5 + i * 0.3}s ease-in-out infinite`
                              }}
                            />
                          ))}
                        </div>
                      );
                    case 'moroccan':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute"
                              style={{
                                left: `${15 + i * 22}%`,
                                top: '20%',
                                width: '45px',
                                height: '60%',
                                background: `repeating-linear-gradient(
                                  90deg,
                                  ${color}25 0px,
                                  ${color}25 6px,
                                  transparent 6px,
                                  transparent 15px
                                )`,
                                opacity: 0.6,
                                animation: 'moroccanSlide 3s ease-in-out infinite'
                              }}
                            />
                          ))}
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={`v-${i}`}
                              className="absolute"
                              style={{
                                top: `${15 + i * 25}%`,
                                left: '10%',
                                width: '80%',
                                height: '22px',
                                background: `repeating-linear-gradient(
                                  0deg,
                                  ${color2}20 0px,
                                  ${color2}20 4px,
                                  transparent 4px,
                                  transparent 11px
                                )`,
                                opacity: 0.5,
                                animation: 'moroccanSlide 3s ease-in-out infinite 0.5s'
                              }}
                            />
                          ))}
                        </div>
                      );
                    case 'checkerboard':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/6 left-1/6 w-20 h-20" style={{ backgroundColor: `${color}20`, animation: 'checkerPulse 2.5s ease-in-out infinite' }} />
                          <div className="absolute top-1/6 right-1/6 w-18 h-18" style={{ backgroundColor: `${color2}15`, animation: 'checkerPulse 2.5s ease-in-out infinite 0.4s' }} />
                          <div className="absolute bottom-1/6 left-1/6 w-18 h-18" style={{ backgroundColor: `${color2}18`, animation: 'checkerPulse 2.5s ease-in-out infinite 0.8s' }} />
                          <div className="absolute bottom-1/6 right-1/6 w-20 h-20" style={{ backgroundColor: `${color}22`, animation: 'checkerPulse 2.5s ease-in-out infinite 1.2s' }} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24" style={{ backgroundColor: `${color}15`, animation: 'checkerPulse 2.5s ease-in-out infinite 0.2s' }} />
                          <div className="absolute top-1/4 left-1/4 w-12 h-12" style={{ backgroundColor: `${color2}12`, animation: 'checkerPulse 2.5s ease-in-out infinite 0.6s' }} />
                          <div className="absolute top-3/4 right-1/4 w-12 h-12" style={{ backgroundColor: `${color}12`, animation: 'checkerPulse 2.5s ease-in-out infinite 1s' }} />
                        </div>
                      );
                    case 'solar':
                      return (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ 
                            backgroundColor: color, 
                            boxShadow: `0 0 30px ${color}80, 0 0 60px ${color}60, 0 0 90px ${color}40`,
                            animation: 'solarPulse 3s ease-in-out infinite'
                          }} />
                          
                          {[
                            { distance: 30, size: 2, color: color2, duration: 4 },
                            { distance: 42, size: 2.5, color: color3, duration: 6 },
                            { distance: 54, size: 2.2, color: color2, duration: 8 },
                            { distance: 66, size: 3, color: color3, duration: 10 },
                            { distance: 78, size: 2, color: color2, duration: 12 }
                          ].map((planet, i) => (
                            <div key={i} className="absolute top-1/2 left-1/2" style={{
                              animation: `orbit ${planet.duration}s linear infinite`
                            }}>
                              <div 
                                className="absolute w-1 h-1 rounded-full"
                                style={{ 
                                  border: `1px solid ${i % 2 === 0 ? color2 : color3}40`,
                                  width: `${planet.distance * 2}px`,
                                  height: `${planet.distance * 2}px`,
                                  transform: 'translate(-50%, -50%)',
                                  borderRadius: '50%'
                                }}
                              />
                              <div 
                                className="absolute w-2 h-2 rounded-full"
                                style={{ 
                                  backgroundColor: planet.color,
                                  boxShadow: `0 0 ${planet.size * 2}px ${planet.color}60`,
                                  width: `${planet.size}px`,
                                  height: `${planet.size}px`,
                                  transform: `translate(-50%, -50%) translateY(-${planet.distance}px)`,
                                  opacity: 0.8
                                }}
                              />
                            </div>
                          ))}
                          
                          {[...Array(25)].map((_, i) => (
                            <div
                              key={`star-${i}`}
                              className="absolute w-0.5 h-0.5 rounded-full"
                              style={{
                                backgroundColor: i % 3 === 0 ? color : color2,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.3 + Math.random() * 0.5,
                                boxShadow: `0 0 2px currentColor`,
                                animation: `starTwinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 2}s`
                              }}
                            />
                          ))}
                        </div>
                      );
                    default:
                      return <ImageIcon className="w-12 h-12 text-slate-400" />;
                  }
                })()}
                <style>{`
                  @keyframes mosaicPulse {
                    0%, 100% { transform: scale(1) rotate(var(--rotate, 0deg)); opacity: 0.7; }
                    50% { transform: scale(1.1) rotate(var(--rotate, 0deg)); opacity: 1; }
                  }
                  @keyframes herringboneSlide {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                  }
                  @keyframes greekPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                  }
                  @keyframes greekRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes gridPulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                  }
                  @keyframes gridRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes sacredPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(var(--rotate, 0deg)); }
                    50% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rotate, 0deg)); }
                  }
                  @keyframes sacredRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                  }
                  @keyframes artDecoWave {
                    0%, 100% { transform: translate(-50%, -100%) rotate(var(--rotate, 0deg)) scaleY(1); }
                    50% { transform: translate(-50%, -100%) rotate(var(--rotate, 0deg)) scaleY(0.9); }
                  }
                  @keyframes artDecoPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                  }
                  @keyframes hexagonPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.15); }
                  }
                  @keyframes moroccanSlide {
                    0%, 100% { opacity: 0.5; transform: translateX(0); }
                    50% { opacity: 0.8; transform: translateX(5px); }
                  }
                  @keyframes checkerPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                  }
                  @keyframes solarPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                  }
                  @keyframes orbit {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                  }
                  @keyframes starTwinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                  }
                `}</style>
              </div>
            )}
            
            {type === 'color' && (
              <div 
                className="w-full h-24 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
                <span className="font-black text-2xl relative z-10" style={{ 
                  color: item.color
                }}>
                  {lang === 'cn' ? '用户名' : 'Username'}
                </span>
              </div>
            )}
            
            {type === 'effect' && USERNAME_EFFECTS.some(e => e.id === item.id) && (
              <div 
                className="w-full h-24 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                style={{ background: item.bg || 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}
              >
                {(() => {
                  switch(item.animation) {
                    case 'sparkle':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                  width: `${1 + Math.random() * 2}px`,
                                  height: `${1 + Math.random() * 2}px`,
                                  backgroundColor: item.color,
                                  boxShadow: `0 0 ${4 + Math.random() * 4}px ${item.color}`,
                                  top: `${Math.random() * 100}%`,
                                  left: `${Math.random() * 100}%`,
                                  animation: `sparkleFloat ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={`star-${i}`}
                                className="absolute"
                                style={{
                                  top: `${15 + Math.random() * 70}%`,
                                  left: `${15 + Math.random() * 70}%`,
                                  animation: `sparkleStarRotate ${3 + i}s linear infinite`
                                }}
                              >
                                {[0, 45, 90, 135].map((angle, j) => (
                                  <div
                                    key={j}
                                    className="absolute top-1/2 left-1/2"
                                    style={{
                                      width: `${8 + Math.random() * 4}px`,
                                      height: '2px',
                                      backgroundColor: item.color,
                                      boxShadow: `0 0 4px ${item.color}`,
                                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                      animation: `sparkleStarGlow 1.5s ease-in-out infinite`,
                                      animationDelay: `${i * 0.3}s`
                                    }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10 animate-pulse"
                            style={{ 
                              color: item.color,
                              textShadow: `0 0 10px ${item.color}80, 0 0 20px ${item.color}60`
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes sparkleFloat {
                              0%, 100% { 
                                opacity: 0.2; 
                                transform: translate(0, 0) scale(0.6); 
                              }
                              50% { 
                                opacity: 1; 
                                transform: translate(${Math.random() > 0.5 ? '5px' : '-5px'}, ${Math.random() > 0.5 ? '5px' : '-5px'}) scale(1.3); 
                              }
                            }
                            @keyframes sparkleStarRotate {
                              from { transform: rotate(0deg); }
                              to { transform: rotate(360deg); }
                            }
                            @keyframes sparkleStarGlow {
                              0%, 100% { opacity: 0.4; }
                              50% { opacity: 1; }
                            }
                          `}</style>
                        </>
                      );
                    case 'neon':
                      return (
                        <>
                          <div 
                            className="absolute inset-0"
                            style={{ 
                              background: `radial-gradient(ellipse at 50% 50%, ${item.color}25 0%, transparent 60%)`,
                              animation: 'neonPulse 2s ease-in-out infinite'
                            }} 
                          />
                          <div 
                            className="absolute inset-0"
                            style={{ 
                              boxShadow: `inset 0 0 40px ${item.color}40`,
                              animation: 'neonGlow 1.5s ease-in-out infinite'
                            }} 
                          />
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: item.color,
                              textShadow: `
                                0 0 5px ${item.color},
                                0 0 10px ${item.color},
                                0 0 20px ${item.color},
                                0 0 40px ${item.color},
                                0 0 80px ${item.color}
                              `,
                              animation: 'neonTextPulse 1.5s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes neonPulse {
                              0%, 100% { opacity: 0.5; transform: scale(0.95); }
                              50% { opacity: 1; transform: scale(1.05); }
                            }
                            @keyframes neonGlow {
                              0%, 100% { box-shadow: inset 0 0 40px ${item.color}40; }
                              50% { box-shadow: inset 0 0 60px ${item.color}60; }
                            }
                            @keyframes neonTextPulse {
                              0%, 100% { 
                                text-shadow: 0 0 5px ${item.color}, 0 0 10px ${item.color}, 0 0 20px ${item.color}; 
                              }
                              50% { 
                                text-shadow: 0 0 10px ${item.color}, 0 0 20px ${item.color}, 0 0 40px ${item.color}, 0 0 80px ${item.color}; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    case 'fire':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(8)].map((_, i) => {
                              const height = 20 + Math.random() * 30;
                              const left = 10 + i * 12;
                              const delay = Math.random() * 0.5;
                              return (
                                <div
                                  key={i}
                                  className="absolute bottom-0"
                                  style={{
                                    left: `${left}%`,
                                    width: `${8 + Math.random() * 8}px`,
                                    height: `${height}px`,
                                    background: `linear-gradient(
                                      180deg,
                                      ${item.color}00 0%,
                                      ${item.color}40 30%,
                                      ${item.color}80 60%,
                                      ${item.color}ff 100%
                                    )`,
                                    borderRadius: '50% 50% 20% 20% / 40% 40% 20% 20%',
                                    transformOrigin: 'bottom center',
                                    animation: `fireFlicker ${0.8 + Math.random() * 0.5}s ease-in-out infinite`,
                                    animationDelay: `${delay}s`
                                  }}
                                />
                              );
                            })}
                            {[...Array(12)].map((_, i) => (
                              <div
                                key={`ember-${i}`}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: item.color,
                                  boxShadow: `0 0 6px ${item.color}`,
                                  bottom: '10%',
                                  left: `${10 + Math.random() * 80}%`,
                                  animation: `emberRise ${2 + Math.random() * 2}s ease-in infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: '#fef3c7',
                              textShadow: `
                                0 0 10px ${item.color},
                                0 0 20px ${item.color},
                                0 0 30px ${item.color}
                              `,
                              animation: 'fireTextGlow 1s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes fireFlicker {
                              0%, 100% { 
                                transform: scaleY(1) scaleX(1); 
                                opacity: 0.8; 
                              }
                              25% { 
                                transform: scaleY(1.15) scaleX(0.9); 
                                opacity: 1; 
                              }
                              50% { 
                                transform: scaleY(0.9) scaleX(1.1); 
                                opacity: 0.7; 
                              }
                              75% { 
                                transform: scaleY(1.1) scaleX(0.95); 
                                opacity: 0.9; 
                              }
                            }
                            @keyframes emberRise {
                              0% { 
                                transform: translateY(0) scale(0.5); 
                                opacity: 0; 
                              }
                              10% { 
                                opacity: 1; 
                              }
                              90% { 
                                opacity: 1; 
                              }
                              100% { 
                                transform: translateY(-80px) scale(1.2); 
                                opacity: 0; 
                              }
                            }
                            @keyframes fireTextGlow {
                              0%, 100% { 
                                text-shadow: 0 0 10px ${item.color}, 0 0 20px ${item.color}; 
                              }
                              50% { 
                                text-shadow: 0 0 20px ${item.color}, 0 0 40px ${item.color}, 0 0 60px ${item.color}; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    case 'water':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            <div 
                              className="absolute bottom-0 left-0 right-0"
                              style={{
                                height: '60%',
                                background: `linear-gradient(180deg, transparent, ${item.color}20 30%, ${item.color}40 100%)`,
                                animation: 'waterWave 3s ease-in-out infinite'
                              }}
                            />
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute bottom-8"
                                style={{
                                  left: `${10 + i * 15}%`,
                                  width: `${30 + Math.random() * 20}px`,
                                  height: `${15 + Math.random() * 10}px`,
                                  border: `2px solid ${item.color}40`,
                                  borderRadius: '50%',
                                  animation: `waterRipple ${2 + Math.random()}s ease-out infinite`,
                                  animationDelay: `${i * 0.3}s`
                                }}
                              />
                            ))}
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={`bubble-${i}`}
                                className="absolute rounded-full"
                                style={{
                                  width: `${3 + Math.random() * 4}px`,
                                  height: `${3 + Math.random() * 4}px`,
                                  backgroundColor: `${item.color}50`,
                                  bottom: '0',
                                  left: `${10 + Math.random() * 80}%`,
                                  animation: `bubbleRise ${3 + Math.random() * 2}s ease-in infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: item.color,
                              textShadow: `0 0 8px ${item.color}60, 0 0 16px ${item.color}40`,
                              animation: 'waterTextFloat 2s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes waterWave {
                              0%, 100% { transform: translateY(0); }
                              50% { transform: translateY(-5px); }
                            }
                            @keyframes waterRipple {
                              0% { 
                                transform: scale(0.3); 
                                opacity: 0.8; 
                              }
                              100% { 
                                transform: scale(2); 
                                opacity: 0; 
                              }
                            }
                            @keyframes bubbleRise {
                              0% { 
                                transform: translateY(0) scale(0.5); 
                                opacity: 0; 
                              }
                              20% { 
                                opacity: 1; 
                              }
                              80% { 
                                opacity: 1; 
                              }
                              100% { 
                                transform: translateY(-70px) scale(1.3); 
                                opacity: 0; 
                              }
                            }
                            @keyframes waterTextFloat {
                              0%, 100% { transform: translateY(0); }
                              50% { transform: translateY(-3px); }
                            }
                          `}</style>
                        </>
                      );
                    case 'lightning':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: `radial-gradient(ellipse at 50% 30%, ${item.color}20 0%, transparent 60%)`,
                                animation: 'lightningFlash 1.5s ease-in-out infinite'
                              }}
                            />
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute top-0 left-1/2 -translate-x-1/2"
                                style={{
                                  width: '3px',
                                  height: '70%',
                                  background: `linear-gradient(
                                    180deg,
                                    ${item.color}ff 0%,
                                    ${item.color}cc 30%,
                                    ${item.color}99 60%,
                                    ${item.color}00 100%
                                  )`,
                                  clipPath: 'polygon(40% 0%, 60% 0%, 55% 40%, 70% 40%, 45% 70%, 55% 70%, 35% 100%, 50% 60%, 30% 60%, 50% 30%, 40% 30%)',
                                  filter: `drop-shadow(0 0 8px ${item.color})`,
                                  animation: `lightningStrike ${0.8 + i * 0.5}s ease-in-out infinite`,
                                  animationDelay: `${i * 0.5}s`,
                                  opacity: 0
                                }}
                              />
                            ))}
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={`spark-${i}`}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                  backgroundColor: item.color,
                                  boxShadow: `0 0 6px ${item.color}`,
                                  top: `${20 + Math.random() * 60}%`,
                                  left: `${20 + Math.random() * 60}%`,
                                  animation: `lightningSpark ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                                  animationDelay: `${Math.random() * 1}s`
                                }}
                              />
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: '#fef9c3',
                              textShadow: `0 0 10px ${item.color}, 0 0 20px ${item.color}, 0 0 40px ${item.color}`,
                              animation: 'lightningTextFlash 1.5s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes lightningFlash {
                              0%, 45%, 55%, 100% { opacity: 0.3; }
                              48%, 52% { opacity: 1; }
                            }
                            @keyframes lightningStrike {
                              0%, 85%, 100% { opacity: 0; }
                              90%, 95% { opacity: 1; }
                            }
                            @keyframes lightningSpark {
                              0%, 70%, 100% { opacity: 0; transform: scale(0.5); }
                              75%, 85% { opacity: 1; transform: scale(1.5); }
                            }
                            @keyframes lightningTextFlash {
                              0%, 45%, 55%, 100% { 
                                text-shadow: 0 0 10px ${item.color}, 0 0 20px ${item.color}; 
                              }
                              48%, 52% { 
                                text-shadow: 0 0 20px ${item.color}, 0 0 40px ${item.color}, 0 0 80px ${item.color}; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    case 'glitter':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(30)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute"
                                style={{
                                  top: `${Math.random() * 100}%`,
                                  left: `${Math.random() * 100}%`,
                                  animation: `glitterFall ${2 + Math.random() * 3}s linear infinite`,
                                  animationDelay: `${Math.random() * 3}s`
                                }}
                              >
                                <div
                                  style={{
                                    width: `${2 + Math.random() * 3}px`,
                                    height: `${2 + Math.random() * 3}px`,
                                    backgroundColor: item.color,
                                    boxShadow: `0 0 ${4 + Math.random() * 4}px ${item.color}`,
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                                    clipPath: Math.random() > 0.7 ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none'
                                  }}
                                />
                              </div>
                            ))}
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={`burst-${i}`}
                                className="absolute"
                                style={{
                                  top: `${20 + Math.random() * 60}%`,
                                  left: `${20 + Math.random() * 60}%`,
                                  animation: `glitterBurst ${2.5 + Math.random()}s ease-out infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              >
                                {[...Array(6)].map((_, j) => (
                                  <div
                                    key={j}
                                    className="absolute w-1 h-1 rounded-full"
                                    style={{
                                      backgroundColor: item.color,
                                      boxShadow: `0 0 4px ${item.color}`,
                                      transform: `rotate(${j * 60}deg) translateY(-10px)`,
                                      animation: `glitterParticle 1s ease-out infinite`,
                                      animationDelay: `${j * 0.1}s`
                                    }}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: item.color,
                              textShadow: `0 0 8px ${item.color}80, 0 0 16px ${item.color}60`,
                              animation: 'glitterTextShimmer 2s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes glitterFall {
                              0% { 
                                transform: translateY(-20px) rotate(0deg); 
                                opacity: 0; 
                              }
                              10% { 
                                opacity: 1; 
                              }
                              90% { 
                                opacity: 1; 
                              }
                              100% { 
                                transform: translateY(100px) rotate(360deg); 
                                opacity: 0; 
                              }
                            }
                            @keyframes glitterBurst {
                              0%, 100% { 
                                transform: scale(0); 
                                opacity: 0; 
                              }
                              10% { 
                                opacity: 1; 
                              }
                              50% { 
                                opacity: 0.8; 
                              }
                              100% { 
                                transform: scale(2); 
                                opacity: 0; 
                              }
                            }
                            @keyframes glitterParticle {
                              0% { 
                                transform: rotate(0deg) translateY(-10px) scale(0.5); 
                                opacity: 1; 
                              }
                              100% { 
                                transform: rotate(0deg) translateY(-25px) scale(1.5); 
                                opacity: 0; 
                              }
                            }
                            @keyframes glitterTextShimmer {
                              0%, 100% { 
                                text-shadow: 0 0 8px ${item.color}80, 0 0 16px ${item.color}60; 
                              }
                              50% { 
                                text-shadow: 0 0 16px ${item.color}ff, 0 0 32px ${item.color}cc, 0 0 48px ${item.color}99; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    case 'glitch':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-full h-0.5"
                                style={{
                                  backgroundColor: `${item.color}${Math.floor(30 + Math.random() * 40).toString(16).padStart(2, '0')}`,
                                  top: `${10 + i * 12}%`,
                                  animation: `glitchScanline ${2 + Math.random()}s linear infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                          </div>
                          <div className="relative">
                            <span 
                              className="font-black text-2xl relative z-10"
                              style={{ 
                                color: item.color,
                                textShadow: `2px 2px 0 #ff0000, -2px -2px 0 #00ffff`,
                                animation: 'glitchText 0.5s ease-in-out infinite'
                              }}
                            >
                              {lang === 'cn' ? '用户名' : 'Username'}
                            </span>
                            <span 
                              className="absolute top-0 left-0 font-black text-2xl"
                              style={{ 
                                color: '#ff000080',
                                animation: 'glitchTextRed 0.5s ease-in-out infinite'
                              }}
                            >
                              {lang === 'cn' ? '用户名' : 'Username'}
                            </span>
                            <span 
                              className="absolute top-0 left-0 font-black text-2xl"
                              style={{ 
                                color: '#00ffff80',
                                animation: 'glitchTextCyan 0.5s ease-in-out infinite'
                              }}
                            >
                              {lang === 'cn' ? '用户名' : 'Username'}
                            </span>
                          </div>
                          <style>{`
                            @keyframes glitchScanline {
                              0%, 100% { 
                                transform: translateX(-100%); 
                                opacity: 0; 
                              }
                              10% { 
                                opacity: 0.8; 
                              }
                              50% { 
                                opacity: 0.6; 
                              }
                              90% { 
                                opacity: 0.8; 
                              }
                              100% { 
                                transform: translateX(100%); 
                                opacity: 0; 
                              }
                            }
                            @keyframes glitchText {
                              0%, 100% { 
                                transform: translate(0); 
                                text-shadow: 2px 2px 0 #ff0000, -2px -2px 0 #00ffff; 
                              }
                              20% { 
                                transform: translate(-3px, 2px); 
                                text-shadow: -2px 2px 0 #ff0000, 2px -2px 0 #00ffff; 
                              }
                              40% { 
                                transform: translate(3px, -2px); 
                                text-shadow: 2px -2px 0 #ff0000, -2px 2px 0 #00ffff; 
                              }
                              60% { 
                                transform: translate(-2px, 3px); 
                                text-shadow: -3px 1px 0 #ff0000, 3px -1px 0 #00ffff; 
                              }
                              80% { 
                                transform: translate(2px, -3px); 
                                text-shadow: 3px -1px 0 #ff0000, -3px 1px 0 #00ffff; 
                              }
                            }
                            @keyframes glitchTextRed {
                              0%, 100% { 
                                transform: translate(0); 
                                opacity: 0; 
                              }
                              20%, 80% { 
                                transform: translate(3px, 1px); 
                                opacity: 0.7; 
                              }
                            }
                            @keyframes glitchTextCyan {
                              0%, 100% { 
                                transform: translate(0); 
                                opacity: 0; 
                              }
                              40%, 60% { 
                                transform: translate(-3px, -1px); 
                                opacity: 0.7; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    case 'aurora':
                      return (
                        <>
                          <div className="absolute inset-0 overflow-hidden">
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(
                                  180deg,
                                  transparent 0%,
                                  ${item.color}20 20%,
                                  ${item.color}40 35%,
                                  ${item.color}30 50%,
                                  ${item.color}20 65%,
                                  transparent 80%
                                )`,
                                filter: 'blur(15px)',
                                animation: 'auroraWave1 6s ease-in-out infinite'
                              }}
                            />
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(
                                  -180deg,
                                  transparent 0%,
                                  ${item.color}15 25%,
                                  ${item.color}35 40%,
                                  ${item.color}25 55%,
                                  transparent 75%
                                )`,
                                filter: 'blur(12px)',
                                animation: 'auroraWave2 8s ease-in-out infinite',
                                animationDelay: '-2s'
                              }}
                            />
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                  backgroundColor: i % 3 === 0 ? item.color : (i % 3 === 1 ? '#10b981' : '#06b6d4'),
                                  boxShadow: `0 0 4px currentColor`,
                                  top: `${Math.random() * 100}%`,
                                  left: `${Math.random() * 100}%`,
                                  opacity: 0.3 + Math.random() * 0.5,
                                  animation: `auroraStar ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                          </div>
                          <span 
                            className="font-black text-2xl relative z-10"
                            style={{ 
                              color: '#f0fdf4',
                              textShadow: `0 0 10px ${item.color}, 0 0 20px #10b981, 0 0 30px #06b6d4`,
                              animation: 'auroraTextGlow 4s ease-in-out infinite'
                            }}
                          >
                            {lang === 'cn' ? '用户名' : 'Username'}
                          </span>
                          <style>{`
                            @keyframes auroraWave1 {
                              0%, 100% { 
                                transform: translateY(-10%) scaleY(1); 
                                opacity: 0.6; 
                              }
                              33% { 
                                transform: translateY(0%) scaleY(1.2); 
                                opacity: 0.8; 
                              }
                              66% { 
                                transform: translateY(10%) scaleY(0.9); 
                                opacity: 0.5; 
                              }
                            }
                            @keyframes auroraWave2 {
                              0%, 100% { 
                                transform: translateY(10%) scaleY(0.9); 
                                opacity: 0.4; 
                              }
                              33% { 
                                transform: translateY(-5%) scaleY(1.1); 
                                opacity: 0.7; 
                              }
                              66% { 
                                transform: translateY(5%) scaleY(1); 
                                opacity: 0.5; 
                              }
                            }
                            @keyframes auroraStar {
                              0%, 100% { opacity: 0.3; }
                              50% { opacity: 0.8; }
                            }
                            @keyframes auroraTextGlow {
                              0%, 100% { 
                                text-shadow: 0 0 10px ${item.color}, 0 0 20px #10b981; 
                              }
                              25% { 
                                text-shadow: 0 0 15px #10b981, 0 0 30px #06b6d4; 
                              }
                              50% { 
                                text-shadow: 0 0 20px #06b6d4, 0 0 40px ${item.color}; 
                              }
                              75% { 
                                text-shadow: 0 0 15px ${item.color}, 0 0 30px #10b981; 
                              }
                            }
                          `}</style>
                        </>
                      );
                    default:
                      return (
                        <span className="font-black text-2xl relative z-10" style={{ color: item.color || '#1f2937' }}>
                          {lang === 'cn' ? '用户名' : 'Username'}
                        </span>
                      );
                  }
                })()}
              </div>
            )}
            
            {type === 'title' && (
              <div className="w-full h-24 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl border-4 border-amber-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                <Crown className="w-12 h-12 text-amber-900 relative z-10 drop-shadow-xl" />
              </div>
            )}
            

            {type === 'effect' && PROFILE_EFFECTS.some(e => e.id === item.id) && (
              <div 
                className="w-full h-32 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800"
              >
                <div className="absolute inset-0">
                  {(() => {
                    const color = item.color;
                    switch(item.animation) {
                      case 'star-twinkle':
                        return (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: color,
                                  boxShadow: `0 0 8px ${color}`,
                                  top: `${15 + Math.random() * 70}%`,
                                  left: `${15 + Math.random() * 70}%`,
                                  animation: `twinkle 1.5s ease-in-out infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes twinkle {
                                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.2); }
                              }
                            `}</style>
                          </>
                        );
                      case 'floating-particles':
                        return (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: `${color}60`,
                                  top: `${20 + Math.random() * 60}%`,
                                  left: `${20 + Math.random() * 60}%`,
                                  animation: `float 3s ease-in-out infinite`,
                                  animationDelay: `${Math.random() * 2}s`
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes float {
                                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
                                50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
                              }
                            `}</style>
                          </>
                        );
                      case 'aurora-wave':
                        return (
                          <div 
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(-45deg, ${color}20, transparent 50%, ${color}15)`,
                              animation: 'aurora 4s ease-in-out infinite'
                            }}
                          />
                        );
                      case 'glow-pulse':
                        return (
                          <div 
                            className="absolute inset-0 animate-pulse"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${color}25 0%, transparent 50%)`
                            }}
                          />
                        );
                      case 'gradient-flow':
                        return (
                          <div 
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(45deg, ${color}20, transparent, ${color}15, transparent, ${color}20)`,
                              backgroundSize: '400% 400%',
                              animation: 'gradientFlow 6s ease infinite'
                            }}
                          />
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
                <Sparkles className="w-12 h-12 relative z-10" style={{ color: item.color }} />
              </div>
            )}
            

          </div>
          
          <div>
            <p className="font-bold text-slate-800 mb-1 text-center">{item.name}</p>
            {item.category && (
              <p className="text-xs text-slate-500 mb-3 text-center">{item.category}</p>
            )}
            {item.description && type === 'achievement' && (
              <p className="text-xs text-slate-500 mb-3 text-center">{item.description}</p>
            )}
          </div>
          
          {owned ? (
            <button
              onClick={() => !applying && handleApply(itemType, item.id)}
              disabled={applying === item.id}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                active
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600 hover:shadow-lg hover:shadow-slate-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 hover:shadow-lg hover:shadow-cyan-500/30'
              }`}
            >
              {applying === item.id ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : active ? (
                <>
                  <X className="w-4 h-4" />
                  {lang === 'cn' ? '取消使用' : 'Remove'}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {lang === 'cn' ? '使用' : 'Apply'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handlePurchase(itemType, item.id, item.price)}
              disabled={purchasing === item.id}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                userPoints >= item.price
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 hover:shadow-lg hover:shadow-slate-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {purchasing === item.id ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {item.price}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAvatarSection = () => (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Frame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '头像边框' : 'Avatar Borders'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '5 积分 · 永久使用' : '5 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {AVATAR_BORDERS.map((border) => renderProductCard(border, 'border'))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '头像挂件' : 'Avatar Accessories'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '5-20 积分/个 · 永久使用' : '5-20 Points Each · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {AVATAR_ACCESSORIES.map((accessory) => renderProductCard(accessory, 'accessory'))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '动态特效' : 'Dynamic Effects'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '12-30 积分 · 永久使用' : '12-30 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {AVATAR_EFFECTS.map((effect) => renderProductCard(effect, 'effect'))}
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '个人主页主题' : 'Profile Themes'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '12-16 积分 · 永久使用' : '12-16 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROFILE_THEMES.map((theme) => renderProductCard(theme, 'theme'))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '个人主页背景' : 'Profile Backgrounds'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '9-12 积分 · 永久使用' : '9-12 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROFILE_BACKGROUNDS.map((bg) => renderProductCard(bg, 'background'))}
        </div>
      </div>

    </div>
  );

  const renderUsernameSection = () => (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Type className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '用户名颜色' : 'Username Colors'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '10-22 积分 · 永久使用' : '10-22 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {USERNAME_COLORS.map((color) => renderProductCard(color, 'color'))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '用户名特效' : 'Username Effects'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '14-22 积分 · 永久使用' : '14-22 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {USERNAME_EFFECTS.map((effect) => renderProductCard(effect, 'effect'))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{lang === 'cn' ? '个性头衔' : 'Custom Titles'}</h3>
            <p className="text-sm text-slate-500">{lang === 'cn' ? '10-30 积分 · 永久使用' : '10-30 Points · Permanent'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CUSTOM_TITLES.map((title) => renderProductCard(title, 'title'))}
        </div>
      </div>
    </div>
  );



  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
        >
          <X className="w-4 h-4" />
          {t('backToProfile')}
        </button>

        <div className="relative overflow-hidden glass-card rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {lang === 'cn' ? '积分商城' : 'Points Shop'}
                </h1>
                <p className="text-slate-400">
                  {lang === 'cn' ? '用积分解锁专属定制，展示独特个性' : 'Unlock exclusive customizations with points'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl border border-yellow-500/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-yellow-300 font-bold uppercase tracking-wider">
                    {lang === 'cn' ? '我的积分' : 'My Points'}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {userPoints.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPointsInfo(true)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
              >
                <HelpCircle className="w-6 h-6 text-yellow-300 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
            : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-1 min-w-[140px] px-5 py-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${
              activeCategory === category.id
                ? 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 text-white shadow-lg shadow-slate-500/30'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeCategory === category.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {category.icon}
            </div>
            <span className="font-bold text-sm">{category.label}</span>
            <span className={`text-xs ${activeCategory === category.id ? 'text-white/70' : 'text-slate-400'}`}>
              {category.description}
            </span>
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeCategory === 'avatar' && renderAvatarSection()}
        {activeCategory === 'profile' && renderProfileSection()}
        {activeCategory === 'username' && renderUsernameSection()}
      </div>
      
      {/* Points & Contribution Info Modal */}
      {showPointsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {lang === 'cn' ? '积分与贡献值说明' : 'Points & Contribution Guide'}
                  </h3>
                  <p className="text-indigo-100 mt-1 text-sm">
                    {lang === 'cn' ? '完全非盈利' : 'Completely non-profit'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Contribution Points */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {lang === 'cn' ? '贡献值' : 'Contribution Points'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {lang === 'cn' ? '用于提升等级，解锁特权' : 'For leveling up and unlocking privileges'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-indigo-600">+10</span> {lang === 'cn' ? '上传审核通过的演示程序' : 'Upload an approved demo program'}
                  </p>
                </div>
              </div>
              
              {/* Points */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {lang === 'cn' ? '积分' : 'Points'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {lang === 'cn' ? '用于在积分商城兑换商品' : 'For redeeming items in the Points Shop'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-emerald-600">+10</span> {lang === 'cn' ? '上传审核通过的演示程序' : 'Upload an approved demo program'}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-emerald-600">{lang === 'cn' ? '悬赏任务' : 'Reward tasks'}</span>
                  </p>
                </div>
              </div>
              
              {/* Note */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-amber-700">
                  {lang === 'cn' ? '💡 本平台完全非盈利，所有功能均为免费使用' : '💡 This platform is completely non-profit, all features are free to use'}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowPointsInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                {lang === 'cn' ? '我知道了' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
