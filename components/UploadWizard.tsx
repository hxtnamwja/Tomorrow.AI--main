
import React, { useState } from 'react';
import { Target, Globe, Users, Check, Upload, FileCode, Play, Image as ImageIcon, X, FolderOpen, FileText, Image as ImageIcon2 } from 'lucide-react';
import { Demo, Category, Subject, Bounty, Layer, Community } from '../types';

interface ProjectFile {
  type: 'file' | 'directory';
  path: string;
  name: string;
  size?: number;
  extension?: string;
  children?: ProjectFile[];
}

export const UploadWizard = ({ t, categories, communities, currentUserId, onSubmit, onCancel, bountyContext }: { 
  t: any, 
  categories: Category[], 
  communities: Community[],
  currentUserId: string,
  onSubmit: (d: Demo) => void, 
  onCancel: () => void,
  bountyContext: Bounty | null
}) => {
  const [step, setStep] = useState(0);
  const [isPlayground, setIsPlayground] = useState(false);
  const [editorMode, setEditorMode] = useState<'upload' | 'paste'>('upload');
  const [projectMode, setProjectMode] = useState<'single' | 'multi'>('single');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [projectStructure, setProjectStructure] = useState<ProjectFile[]>([]);
  const [isAnalyzingZip, setIsAnalyzingZip] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [entryFile, setEntryFile] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    categoryId: '',
    layer: (bountyContext ? bountyContext.layer : 'general') as Layer,
    communityId: bountyContext?.communityId || undefined,
    code: '',
    thumbnailUrl: ''
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Derived state for available categories based on selection
  const availableCategories = React.useMemo(() => {
    if (formData.layer === 'general') {
      return Object.values(Subject).map(s => ({ id: s, name: s }));
    } else if (formData.layer === 'community' && formData.communityId) {
      // Filter categories for this specific community
      return categories.filter(c => c.communityId === formData.communityId).map(c => ({ id: c.id, name: c.name }));
    }
    return [];
  }, [formData.layer, formData.communityId, categories]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setThumbnailPreview(base64);
        setFormData(prev => ({ ...prev, thumbnailUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleZipUpload = async (file: File) => {
    setIsAnalyzingZip(true);
    try {
      const JSZip = await import('jszip');
      const zip = await JSZip.loadAsync(file);
      
      const structure: ProjectFile[] = [];
      const htmlFiles: { path: string; content: string }[] = [];
      const imageFiles: Map<string, string> = new Map();
      
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        // 过滤掉系统隐藏文件和目录
        if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || relativePath.includes('.DS_Store')) {
          continue;
        }
        
        if (zipEntry.dir) {
          structure.push({
            type: 'directory',
            path: relativePath,
            name: relativePath.split('/').filter(Boolean).pop() || relativePath
          });
        } else {
          const ext = relativePath.split('.').pop()?.toLowerCase();
          structure.push({
            type: 'file',
            path: relativePath,
            name: relativePath.split('/').pop() || relativePath,
            extension: ext ? `.${ext}` : '',
            size: 0
          });
          
          // 收集图片文件并转换为DataURL
          if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext ? `.${ext}` : '')) {
            try {
              const dataUrl = await zipEntry.async('base64');
              const mimeType = getImageMimeType(ext || '');
              imageFiles.set(relativePath, `data:${mimeType};base64,${dataUrl}`);
            } catch (error) {
              console.warn('Error processing image:', relativePath, error);
            }
          }
          
          // 收集所有HTML文件
          if (['.html', '.htm'].includes(ext ? `.${ext}` : '')) {
            let content = await zipEntry.async('string');
            // 替换HTML中的图片路径为DataURL
            content = replaceImagePaths(content, imageFiles);
            htmlFiles.push({ path: relativePath, content });
          }
        }
      }
      
      // 优先选择根目录的HTML文件，然后选择其他HTML文件
      let selectedHtml = htmlFiles.find(file => file.path.split('/').length === 1);
      if (!selectedHtml && htmlFiles.length > 0) {
        selectedHtml = htmlFiles[0];
      }
      
      setProjectStructure(structure);
      setZipFile(file);
      setPreviewContent(selectedHtml?.content || '');
      setEntryFile(selectedHtml?.path || '');
      setIsAnalyzingZip(false);
    } catch (error) {
      console.error('Error analyzing ZIP:', error);
      setIsAnalyzingZip(false);
      alert('ZIP文件解析失败');
    }
  };

  // 辅助函数：获取图片的MIME类型
  const getImageMimeType = (ext: string): string => {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'image/unknown';
  };

  // 辅助函数：替换HTML中的图片路径为DataURL
  const replaceImagePaths = (html: string, imageFiles: Map<string, string>): string => {
    let modifiedHtml = html;
    
    // 替换<img>标签的src属性
    modifiedHtml = modifiedHtml.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
      // 处理相对路径
      const normalizedSrc = src.replace(/^\/+/, '');
      if (imageFiles.has(normalizedSrc)) {
        const dataUrl = imageFiles.get(normalizedSrc);
        return match.replace(src, dataUrl || src);
      }
      return match;
    });
    
    // 替换CSS中的background-image
    modifiedHtml = modifiedHtml.replace(/background-image:\s*url\(['"]([^'"]+)['"]\)/gi, (match, url) => {
      const normalizedUrl = url.replace(/^\/+/, '');
      if (imageFiles.has(normalizedUrl)) {
        const dataUrl = imageFiles.get(normalizedUrl);
        return match.replace(url, dataUrl || url);
      }
      return match;
    });
    
    return modifiedHtml;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (extension?: string) => {
    if (!extension) return <FileText className="w-4 h-4 text-slate-400" />;
    if (['.html', '.htm'].includes(extension)) return <FileCode className="w-4 h-4 text-orange-500" />;
    if (['.css'].includes(extension)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (['.js', '.ts'].includes(extension)) return <FileText className="w-4 h-4 text-yellow-500" />;
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(extension)) return <ImageIcon2 className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('sci_demo_token');
    const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
    
    if (projectMode === 'multi' && zipFile) {
      const formDataToSend = new FormData();
      formDataToSend.append('zipFile', zipFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('layer', formData.layer);
      if (formData.communityId) {
        formDataToSend.append('communityId', formData.communityId);
      }
      
      try {
        console.log('开始上传ZIP文件...');
        console.log('API Base:', apiBase);
        console.log('Token:', token ? '已提供' : '未提供');
        console.log('FormData包含:', {
          zipFile: zipFile ? zipFile.name : '无',
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          layer: formData.layer,
          communityId: formData.communityId
        });
        
        const response = await fetch(`${apiBase}/demos/upload-zip`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        console.log('响应状态:', response.status);
        console.log('响应头:', Object.fromEntries(response.headers));
        
        const result = await response.json();
        console.log('响应数据:', result);
        
        if (result.code === 200) {
          // For multi-file projects, the demo is already created on the backend
          // We just need to notify the parent component to refresh data
          onSubmit({
            id: result.data.id,
            title: formData.title,
            description: formData.description,
            author: currentUserId,
            categoryId: formData.categoryId,
            layer: formData.layer,
            communityId: formData.communityId,
            code: result.data.entryFile,
            thumbnailUrl: formData.thumbnailUrl || undefined,
            status: 'pending',
            createdAt: Date.now(),
            bountyId: bountyContext?.id,
            projectType: 'multi-file',
            entryFile: result.data.entryFile,
            projectSize: result.data.size
          });
        } else {
          console.error('上传失败，后端返回错误:', result);
          alert(`上传失败: ${result.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('上传错误:', error);
        alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      const newDemo: Demo = {
        id: `demo-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        author: currentUserId,
        categoryId: formData.categoryId,
        layer: formData.layer,
        communityId: formData.communityId,
        code: formData.code,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        status: 'pending',
        createdAt: Date.now(),
        bountyId: bountyContext?.id,
        projectType: 'single-file'
      };
      onSubmit(newDemo);
    }
  };
  
  // If uploading for a bounty, skip step 0 as context is fixed
  React.useEffect(() => {
      if(bountyContext) {
          setStep(1);
          setFormData(prev => ({
              ...prev,
              layer: bountyContext.layer,
              communityId: bountyContext.communityId
          }));
      }
  }, [bountyContext]);

  // My joined communities
  const myCommunities = communities.filter(c => c.members.includes(currentUserId) && c.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
       {/* Header */}
       <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
         <div>
           <h2 className="text-xl font-bold text-slate-800">{t('uploadTitle')}</h2>
           {bountyContext && (
             <div className="flex items-center gap-2 mt-1 text-sm text-amber-600">
               <Target className="w-4 h-4" />
               <span>{t('submittingFor')} <strong>{bountyContext.title}</strong></span>
             </div>
           )}
         </div>
         <div className="flex gap-2">
            {[0, 1, 2, 3].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            ))}
         </div>
       </div>

       {/* Body */}
       <div className="flex-1 p-8 overflow-y-auto">
         
         {/* Step 0: Target Selection */}
         {step === 0 && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-300">
                 <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">{t('selectLayer')}</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {/* General Library Option */}
                     <div 
                        onClick={() => setFormData({...formData, layer: 'general', communityId: undefined})}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${formData.layer === 'general' && !isPlayground ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.layer === 'general' && !isPlayground ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Globe className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('layerGeneral')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('publiclyAvailable')}</p>
                         </div>
                         {formData.layer === 'general' && !isPlayground && <div className="absolute top-4 right-4 text-indigo-600"><Check className="w-5 h-5" /></div>}
                     </div>

                     {/* Community Option */}
                     <div 
                        onClick={() => setFormData({...formData, layer: 'community', communityId: myCommunities[0]?.id || ''})}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${formData.layer === 'community' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.layer === 'community' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Users className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('layerCommunity')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('exclusiveToCommunity')}</p>
                         </div>
                         {formData.layer === 'community' && <div className="absolute top-4 right-4 text-indigo-600"><Check className="w-5 h-5" /></div>}
                     </div>

                     {/* Playground Option */}
                     <div
                        onClick={() => {
                            setIsPlayground(true);
                            setEditorMode('paste');
                            setFormData({...formData, layer: 'general', code: ''});
                            setStep(2);
                        }}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 border-slate-200 hover:border-indigo-300 hover:bg-slate-50`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 text-slate-500`}>
                             <Play className="w-8 h-8 ml-1" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('onlinePreview')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('playgroundDesc')}</p>
                         </div>
                     </div>
                 </div>

                 {/* If Community Selected, Show Dropdown */}
                 {formData.layer === 'community' && (
                     <div className="mt-8 animate-in fade-in slide-in-from-top-2">
                         <label className="block text-sm font-bold text-slate-700 mb-2">{t('selectCommunity')}</label>
                         {myCommunities.length > 0 ? (
                             <select 
                                value={formData.communityId || ''}
                                onChange={e => setFormData({...formData, communityId: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                             >
                                 {myCommunities.map(c => (
                                     <option key={c.id} value={c.id}>{c.name}</option>
                                 ))}
                             </select>
                         ) : (
                             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                                 {t('noCommunitiesJoin')}
                             </div>
                         )}
                     </div>
                 )}
             </div>
         )}

         {/* Step 1: Basic Info */}
         {step === 1 && (
           <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-right-8 duration-300">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t('titleLabel')}</label>
               <input 
                 value={formData.title} 
                 onChange={e => setFormData({...formData, title: e.target.value})}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('subjectLabel')}</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">{t('selectCategory')}</option>
                  {availableCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {availableCategories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">{t('noCategoriesFound')}</p>
                )}
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t('descLabel')}</label>
               <textarea 
                 value={formData.description} 
                 onChange={e => setFormData({...formData, description: e.target.value})}
                 rows={4}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>
           </div>
         )}

         {step === 2 && (
           <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
             {/* Project Mode Selection */}
             <div className="flex gap-4 mb-4">
               <button 
                 onClick={() => {
                   setProjectMode('single');
                   setEditorMode('upload');
                 }}
                 className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${projectMode === 'single' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
               >
                 {t('singleFile')}
               </button>
               <button 
                 onClick={() => {
                   setProjectMode('multi');
                   setEditorMode('upload');
                 }}
                 className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${projectMode === 'multi' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
               >
                 {t('multiFile')}
               </button>
             </div>

             {/* Single File Mode */}
             {projectMode === 'single' && (
               <>
                 <div className="flex gap-4 mb-4">
                   <button 
                     onClick={() => {
                       setEditorMode('upload');
                       const fileInput = document.getElementById('code-upload') as HTMLInputElement;
                       if (fileInput) fileInput.value = '';
                     }}
                     className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${editorMode === 'upload' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                   >
                     {t('uploadFile')}
                   </button>
                   <button 
                     onClick={() => setEditorMode('paste')}
                     className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${editorMode === 'paste' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                   >
                     {t('pasteCode')}
                   </button>
                 </div>

                 <div className="flex-1 relative min-h-[300px]">
                    {/* File Upload Mode */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 transition-all ${editorMode === 'upload' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                        <div className="text-center p-8 w-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 mb-2">{t('uploadCodeFile')}</h4>
                            <p className="text-sm text-slate-500 mb-6">{t('selectHtmlFile')}</p>
                            
                            <input 
                              id="code-upload"
                              type="file" 
                              accept=".html,.htm"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        setFormData({...formData, code: ev.target?.result as string});
                                        setEditorMode('paste'); // Auto switch to preview/edit after upload
                                    };
                                    reader.readAsText(file);
                                }
                              }}
                            />
                            
                            <button 
                                type="button"
                                onClick={() => document.getElementById('code-upload')?.click()}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                                {t('selectFile')}
                            </button>
                        </div>
                    </div>

                    {/* Paste Code Mode (Textarea) */}
                    <textarea 
                      value={formData.code} 
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className={`absolute inset-0 w-full h-full p-4 font-mono text-sm bg-slate-900 text-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all ${editorMode === 'paste' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
                      spellCheck={false}
                      placeholder={t('pasteCodePlaceholder')}
                    />
                 </div>
               </>
             )}

             {/* Multi File Mode */}
             {projectMode === 'multi' && (
               <div className="flex-1 flex flex-col gap-4">
                 {!zipFile ? (
                   <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 transition-all hover:border-indigo-300">
                     <div className="text-center p-8 w-full flex flex-col items-center justify-center">
                       <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                         <FolderOpen className="w-8 h-8" />
                       </div>
                       <h4 className="text-lg font-bold text-slate-700 mb-2">{t('uploadZipFile')}</h4>
                       <p className="text-sm text-slate-500 mb-6">{t('zipFileDesc')}</p>
                       
                       <input 
                         id="zip-upload"
                         type="file" 
                         accept=".zip"
                         className="hidden"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             handleZipUpload(file);
                           }
                         }}
                       />
                       
                       <button 
                         type="button"
                         onClick={() => document.getElementById('zip-upload')?.click()}
                         className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
                       >
                         {t('selectZipFile')}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col gap-4">
                     <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                       <div className="flex items-center gap-3">
                         <FolderOpen className="w-8 h-8 text-indigo-600" />
                         <div>
                           <p className="font-medium text-slate-800">{zipFile.name}</p>
                           <p className="text-sm text-slate-500">{formatFileSize(zipFile.size)}</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => {
                           setZipFile(null);
                           setProjectStructure([]);
                           const fileInput = document.getElementById('zip-upload') as HTMLInputElement;
                           if (fileInput) fileInput.value = '';
                         }}
                         className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>

                     {isAnalyzingZip ? (
                       <div className="flex-1 flex items-center justify-center">
                         <div className="text-center">
                           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                           <p className="text-slate-600">{t('analyzingZip')}</p>
                         </div>
                       </div>
                     ) : (
                       <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-hidden">
                         <div className="p-3 bg-slate-50 border-b border-slate-200">
                           <p className="text-sm font-medium text-slate-700">{t('projectStructure')}</p>
                         </div>
                         <div className="p-4 max-h-[300px] overflow-y-auto">
                           {projectStructure.length === 0 ? (
                             <p className="text-sm text-slate-500 text-center py-8">{t('emptyZip')}</p>
                           ) : (
                             <div className="space-y-1">
                               {projectStructure
                                 .sort((a, b) => {
                                   if (a.type === 'directory' && b.type !== 'directory') return -1;
                                   if (a.type !== 'directory' && b.type === 'directory') return 1;
                                   return a.path.localeCompare(b.path);
                                 })
                                 .map((file, index) => (
                                   <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                     {file.type === 'directory' ? (
                                       <FolderOpen className="w-4 h-4 text-indigo-400" />
                                     ) : (
                                       getFileIcon(file.extension)
                                     )}
                                     <span className="text-sm text-slate-700 flex-1 truncate">{file.path}</span>
                                     {file.size && file.size > 0 && (
                                       <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                                     )}
                                   </div>
                                 ))}
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
             
             <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setFormData({...formData, code: ''})}
                        className={`text-slate-400 hover:text-slate-600 font-medium ${formData.code.length < 50 ? 'hidden' : ''}`}
                    >
                        {t('clear')}
                    </button>
                    <span className={`text-slate-400 text-xs ${formData.code.length > 0 ? 'hidden' : ''}`}>
                        {t('pleaseEnterCode')}
                    </span>
                </div>
                {formData.code.length > 100 && (
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Check className="w-4 h-4" />
                        <span>{formData.code.length} {t('chars')}</span>
                    </div>
                )}
             </div>
             
             {/* Thumbnail Upload Section */}
             <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="flex items-center gap-2 mb-3">
                 <ImageIcon className="w-4 h-4 text-slate-500" />
                 <span className="text-sm font-medium text-slate-700">{t('thumbnail')}（{t('thumbnailOptional')}）</span>
               </div>
               
               {thumbnailPreview ? (
                 <div className="relative inline-block">
                   <img 
                     src={thumbnailPreview} 
                     alt={t('thumbnail')}
                     className="w-32 h-24 object-cover rounded-lg border border-slate-200"
                   />
                   <button
                     onClick={handleRemoveThumbnail}
                     className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                     title={t('removeThumbnail')}
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ) : (
                 <div className="flex items-center gap-4">
                   <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm text-slate-600">
                     <Upload className="w-4 h-4" />
                     <span>{t('uploadThumbnail')}</span>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleThumbnailUpload}
                       className="hidden"
                     />
                   </label>
                   <span className="text-xs text-slate-400">{t('thumbnailFormats')}</span>
                 </div>
               )}
             </div>
           </div>
         )}

         {step === 3 && (
            <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('stepPreview')}</label>
              <div className="flex-1 min-h-[400px] border-2 border-slate-200 border-dashed rounded-xl bg-white overflow-hidden relative">
                 {projectMode === 'single' ? (
                   <iframe 
                     key={formData.code.length + step}
                     srcDoc={formData.code} 
                     className="w-full h-full absolute inset-0 border-0" 
                     title={t('stepPreview')} 
                     sandbox="allow-scripts allow-popups allow-modals allow-same-origin"
                   />
                 ) : previewContent ? (
                   <iframe 
                     key={previewContent.length + step}
                     srcDoc={previewContent} 
                     className="w-full h-full absolute inset-0 border-0" 
                     title={t('stepPreview')} 
                     sandbox="allow-scripts allow-popups allow-modals allow-same-origin"
                   />
                 ) : (
                   <div className="flex items-center justify-center h-full bg-slate-50">
                     <div className="text-center">
                       <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                         <FolderOpen className="w-8 h-8" />
                       </div>
                       <h4 className="text-lg font-bold text-slate-700 mb-2">{t('multiFile')} {t('project')}</h4>
                       <p className="text-sm text-slate-500 mb-4">{t('multiFilePreviewDesc')}</p>
                       <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
                         <p className="text-xs text-slate-600 mb-2 font-medium">{t('projectDetails')}:</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileName')}: {zipFile?.name || '-'}</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileSize')}: {zipFile ? formatFileSize(zipFile.size) : '-'}</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileCount')}: {projectStructure.length}</p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>{t('submitForReview')}</span>
                </div>
              </div>
            </div>
         )}
       </div>

       {/* Footer */}
       <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
         <button 
           onClick={() => {
             if (step === 0) onCancel();
             else if (step === 2 && isPlayground) { setIsPlayground(false); setStep(0); }
             else setStep(s => s - 1);
           }}
           className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
         >
           {step === 0 ? t('cancel') : t('back')}
         </button>
         
         <div className="flex gap-2">
            {isPlayground && step === 3 && (
                <button 
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                    {t('exit')}
                </button>
            )}

            {(!isPlayground || step !== 3) && (
                <button 
                onClick={() => step === 3 ? handleSubmit() : setStep(s => s + 1)}
                disabled={
                    (step === 0 && formData.layer === 'community' && !formData.communityId) ||
                    (step === 1 && (!formData.title || !formData.categoryId))
                }
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {step === 3 ? t('submit') : t('next')}
                </button>
            )}
         </div>
       </div>
    </div>
  );
};
