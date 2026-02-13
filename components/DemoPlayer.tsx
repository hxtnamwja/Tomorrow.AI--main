import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Sparkles, Heart, Maximize2, Minimize2, Smartphone, Send, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Demo } from '../types';
import { AiService } from '../services/aiService';
import { DemosAPI } from '../services/apiService';
import { AIMessageContent } from './AIMessageContent';

export const DemoPlayer = ({ demo, onClose, t, onOpenDemo, onLikeChange }: { demo: Demo, onClose: () => void, t: any, onOpenDemo?: (demoId: string) => void, onLikeChange?: (demoId: string, likeCount: number, userLiked: boolean) => void }) => {
  const [activeTab, setActiveTab] = useState<'concept' | 'code' | 'ai'>('concept');
  const [iframeKey, setIframeKey] = useState(0); // to force reload
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Like state
  const [likeCount, setLikeCount] = useState(demo.likeCount || 0);
  const [userLiked, setUserLiked] = useState(demo.userLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Mobile fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar Resize Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate width based on the right edge of the sidebar
      if (sidebarRef.current) {
        const rightEdge = sidebarRef.current.getBoundingClientRect().right;
        const newWidth = rightEdge - e.clientX;
        
        // Clamp width
        if (newWidth > 300 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  // Handle mobile fullscreen toggle
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        if (previewContainerRef.current) {
          const element = previewContainerRef.current;
          
          // Try different fullscreen methods for better mobile compatibility
          const requestFullscreen = 
            element.requestFullscreen ||
            (element as any).webkitRequestFullscreen ||
            (element as any).msRequestFullscreen ||
            (element as any).mozRequestFullScreen;
          
          if (requestFullscreen) {
            try {
              await requestFullscreen.call(element);
              
              // Try to lock to landscape orientation on mobile after a short delay
              setTimeout(async () => {
                try {
                  const orientation = screen.orientation as any;
                  if (orientation && orientation.lock) {
                    await orientation.lock('landscape');
                  }
                } catch (orientationErr) {
                  console.warn('Orientation lock failed:', orientationErr);
                }
              }, 100);
              
              setIsFullscreen(true);
              return;
            } catch (fullscreenErr) {
              console.warn('Native fullscreen failed, using CSS fallback:', fullscreenErr);
            }
          }
          
          // Fallback: Use CSS to simulate fullscreen
          console.log('Using CSS fullscreen fallback');
          setIsFullscreen(true);
          
          // Try to suggest landscape orientation
          setTimeout(() => {
            const orientation = screen.orientation as any;
            if (orientation && orientation.lock) {
              orientation.lock('landscape').catch(() => {});
            }
          }, 100);
        }
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
        // Still try CSS fallback
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      try {
        const exitFullscreen = 
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).msExitFullscreen ||
          (document as any).mozCancelFullScreen;
        
        if (exitFullscreen && document.fullscreenElement) {
          await exitFullscreen.call(document);
        }
        
        // Unlock orientation
        try {
          const orientation = screen.orientation as any;
          if (orientation && orientation.unlock) {
            await orientation.unlock();
          }
        } catch (orientationErr) {
          console.warn('Orientation unlock failed:', orientationErr);
        }
        
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = !!document.fullscreenElement;
      // Only update if native fullscreen state changes
      if (!isNativeFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
      // Unlock orientation when exiting fullscreen
      const orientation = screen.orientation as any;
      if (!isNativeFullscreen && orientation && orientation.unlock) {
        orientation.unlock();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  // Handle orientation change to show/hide rotate hint
  useEffect(() => {
    const rotateHint = document.getElementById('rotate-hint');
    if (!rotateHint) return;

    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        rotateHint.style.display = 'none';
      } else {
        rotateHint.style.display = 'flex';
      }
    };

    // Check initial orientation
    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isFullscreen]);

  // Load like status when component mounts
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        const likeData = await DemosAPI.getLikes(demo.id);
        setLikeCount(likeData.count);
        setUserLiked(likeData.userLiked);
      } catch (error) {
        console.error('Error loading like status:', error);
      }
    };
    loadLikeStatus();
  }, [demo.id]);

  // Handle like/unlike
  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (userLiked) {
        const result = await DemosAPI.unlike(demo.id);
        setLikeCount(result.count);
        setUserLiked(false);
        // Notify parent component
        onLikeChange?.(demo.id, result.count, false);
      } else {
        const result = await DemosAPI.like(demo.id);
        setLikeCount(result.count);
        setUserLiked(true);
        // Notify parent component
        onLikeChange?.(demo.id, result.count, true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  // Load KaTeX when AI tab is activated
  // useEffect(() => {
  //   if (activeTab === 'ai') {
  //     loadKatex();
  //   }
  // }, [activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Listen for messages from AI links
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'openDemo' && event.data?.demoId) {
        onOpenDemo?.(event.data.demoId);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenDemo]);

  useEffect(() => {
    if (activeTab === 'ai' && aiMessages.length === 0) {
      setAiMessages([{ 
        role: 'model', 
        text: `👋 你好！我是你的学习向导！\n\n我可以帮你：\n• **理解概念** - 深入讲解这个演示展示的科学原理\n• **互动学习** - 引导你通过操作演示来探索知识\n• **联系实际** - 解释这些概念在现实世界中的应用\n• **启发思考** - 提出有趣的问题帮助你深入理解\n\n💡 **建议**：试着与演示程序互动（拖动滑块、点击按钮等），然后告诉我你观察到了什么现象？` 
      }]);
    }
  }, [activeTab, aiMessages.length]);

  const handleDemoAiAsk = async (query: string) => {
      if (!query.trim()) return;

      // Add user message
      setAiMessages(prev => [...prev, { role: 'user', text: query }]);
      setAiLoading(true);

      // Add empty model message for streaming
      setAiMessages(prev => [...prev, { role: 'model', text: '' }]);

      // Use a ref to accumulate text to avoid React state batching issues
      let accumulatedText = '';

      try {
        // Use explain mode for demo page - sends full code to AI for analysis
        await AiService.explain(
          query,
          demo.id,
          `Title: ${demo.title}`,
          (chunk) => {
            accumulatedText += chunk;
            setAiMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'model') {
                lastMessage.text = accumulatedText;
              }
              return [...newMessages];
            });
          }
        );
      } catch (error) {
        setAiMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model' && lastMessage.text === '') {
            lastMessage.text = t('aiError');
          }
          return [...newMessages];
        });
      } finally {
        setAiLoading(false);
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6"
    >
      <div className="w-full h-full bg-slate-900 md:rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-slate-800">
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 z-20 bg-black/30 hover:bg-black/50 backdrop-blur text-white p-2 rounded-lg transition-colors border border-white/20"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Preview - Added explicit rounded-l-2xl to prevent square corners covering parent radius */}
        <div
          ref={previewContainerRef}
          className={`flex-1 bg-slate-900 relative flex flex-col h-[50vh] md:h-full overflow-hidden md:rounded-l-2xl ${isFullscreen ? 'fixed inset-0 z-[100] h-screen w-screen !max-w-none !rounded-none' : ''}`}
        >
          <div className={`flex-1 relative w-full h-full bg-white ${isFullscreen ? 'h-screen' : ''}`}>
            <iframe
              key={iframeKey}
              srcDoc={demo.code}
              className={`border-0 block ${isFullscreen ? 'fixed inset-0 w-screen h-screen z-[101]' : 'w-full h-full'}`}
              title={demo.title}
              sandbox="allow-scripts allow-popups allow-modals allow-same-origin"
              allow="fullscreen"
            />
            {/* Mobile Fullscreen Hint - Only show on small screens when not fullscreen */}
            {!isFullscreen && (
              <div className="md:hidden absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-bold">点击底部&quot;全屏&quot;横屏观看</span>
                </div>
              </div>
            )}
            
            {/* Rotate Hint - Show in fullscreen on mobile when in portrait */}
            {isFullscreen && (
              <div 
                className="md:hidden fixed inset-0 flex items-center justify-center bg-black/90 z-[200]" 
                id="rotate-hint"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div className="text-center text-white p-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <RotateCcw className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <p className="text-xl font-bold mb-2">请旋转手机</p>
                  <p className="text-sm text-white/70 mb-6">横屏观看体验更佳</p>
                  <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                  >
                    退出全屏
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Preview Controls - Hidden in fullscreen mode on mobile */}
          <div className={`h-14 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 ${isFullscreen ? 'md:flex hidden' : 'flex'}`}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-white font-medium text-sm truncate max-w-[150px] md:max-w-[200px]">{demo.title}</h3>
            </div>
            <div className="flex gap-2">
              {/* Mobile Fullscreen Button - Only show on small screens */}
              <button
                onClick={toggleFullscreen}
                className="md:hidden px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
                title={isFullscreen ? t('exitFullscreen') || '退出全屏' : t('fullscreen') || '全屏显示'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span className="text-xs font-bold">{isFullscreen ? t('exitFullscreen') || '退出' : t('fullscreen') || '全屏'}</span>
              </button>
              {/* Desktop Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="hidden md:flex p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
                title={isFullscreen ? t('exitFullscreen') || '退出全屏' : t('fullscreen') || '全屏显示'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
                title={t('refresh')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Floating Exit Button for Mobile Fullscreen */}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="md:hidden fixed top-4 right-4 z-[102] w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all active:scale-95"
              title={t('exitFullscreen') || '退出全屏'}
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right Side: Sidebar - Added explicit rounded-r-2xl */}
        <div 
          ref={sidebarRef}
          style={isDesktop ? { width: `${sidebarWidth}px` } : {}}
          className="w-full md:w-auto bg-white flex flex-col h-[50vh] md:h-full overflow-hidden relative border-l border-slate-200 md:rounded-r-2xl"
        >
          {/* Resize Handle - Only visible on desktop */}
          <div 
            className="hidden md:flex absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-50 items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            {/* Visible Line on Hover/Active */}
            <div className={`w-1 h-full rounded-full transition-colors ${isResizing ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-200'}`} />
          </div>

          {/* Global Resize Overlay - Handles iframe issues and ensures smooth resizing */}
          {isResizing && (
            <div 
              className="fixed inset-0 z-[60] cursor-ew-resize bg-transparent"
              style={{ userSelect: 'none' }}
            />
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 shrink-0 bg-white">
            {['concept', 'code', 'ai'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {t(tab === 'ai' ? 'aiHelper' : tab === 'code' ? 'code' : 'concept')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {activeTab === 'concept' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                   <div className="flex items-start justify-between gap-4">
                     <h4 className="text-xl font-bold text-slate-800 mb-2">{demo.title}</h4>
                     {/* Like Button */}
                     <button
                       onClick={handleLike}
                       disabled={likeLoading}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                         userLiked
                           ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                           : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                       } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                       title={userLiked ? t('unlike') || '取消点赞' : t('like') || '点赞'}
                     >
                       <Heart
                         className={`w-4 h-4 transition-all ${userLiked ? 'fill-current' : ''}`}
                       />
                       <span>{likeCount}</span>
                     </button>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                     <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-indigo-600">
                       {demo.layer === 'general' ? demo.categoryId : t('communityRoot')}
                     </span>
                     <span>{t('by')} {demo.author}</span>
                     <span>• {new Date(demo.createdAt).toLocaleDateString()}</span>
                   </div>
                 </div>
                 
                 <div className="prose prose-sm prose-slate text-slate-600">
                   <p className="leading-relaxed">{demo.description}</p>
                 </div>

                 <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm mt-6">
                   <h5 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                     <Sparkles className="w-4 h-4" /> {t('didYouKnow')}
                   </h5>
                   <p className="text-xs text-slate-600">
                     {t('didYouKnowText')}
                   </p>
                 </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-slate-500 uppercase">index.html</span>
                   <span className="text-xs text-slate-400">{t('readOnly')}</span>
                </div>
                <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto flex-1 shadow-inner border border-slate-700">
                  {demo.code}
                </pre>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                   {aiMessages.map((msg, idx) => (
                     <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                         msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
                       }`}>
                         {msg.role === 'user' ? (
                           <span className="text-white text-xs font-bold">{t('user').charAt(0).toUpperCase()}</span>
                         ) : (
                           <Sparkles className="w-4 h-4 text-white" />
                         )}
                       </div>
                       <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[80%] ${
                         msg.role === 'user'
                           ? 'bg-indigo-600 text-white rounded-tr-none'
                           : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                       }`}>
                         {msg.role === 'user' ? (
                           msg.text
                         ) : (
                           <AIMessageContent
                             text={msg.text}
                             onOpenDemo={onOpenDemo}
                           />
                         )}
                       </div>
                     </div>
                   ))}
                   <div ref={messagesEndRef} />
                 </div>
                 
                 <div className="mt-auto pt-4 border-t border-slate-200 bg-slate-50/50">
                   <div className="relative">
                     <input
                       type="text"
                       placeholder={t('aiChatPlaceholder')}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           handleDemoAiAsk((e.target as HTMLInputElement).value);
                           (e.target as HTMLInputElement).value = '';
                         }
                       }}
                     />
                     <button
                       className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                       onClick={(e) => {
                         const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                         if (input && input.value.trim()) {
                           handleDemoAiAsk(input.value);
                           input.value = '';
                         }
                       }}
                     >
                        <Send className="w-4 h-4" />
                        <span className="text-xs font-medium hidden sm:inline">{t('send') || '发送'}</span>
                     </button>
                   </div>
                   {aiLoading && (
                     <div className="flex items-center gap-2 text-xs text-indigo-600 mt-3">
                       <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                       {t('analyzing')}
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
