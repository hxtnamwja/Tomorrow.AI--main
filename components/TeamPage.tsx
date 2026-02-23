import React from 'react';
import { motion } from 'framer-motion';
import { Users, Code, Palette, Database, Sparkles, ArrowLeft, Layers, User, Monitor, Cpu, Server, Palette as PaletteIcon, Image as ImageIcon } from 'lucide-react';

interface TeamMember {
  name: string;
  nameEn: string;
  roles: string[];
  color: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Lioyd',
    nameEn: 'Lioyd',
    roles: ['前端工程师', '后端工程师', '设计师'],
    color: '#3b82f6',
    icon: <Cpu className="w-10 h-10" />,
    description: '负责设计的技术实现以及功能优化，追求极致的用户体验',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    name: 'Kyra',
    nameEn: 'Kyra',
    roles: ['素材库工程师', '艺术设计'],
    color: '#a855f7',
    icon: <PaletteIcon className="w-10 h-10" />,
    description: '负责素材库建设与视觉设计，创造令人惊艳的视觉效果',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Vincent',
    nameEn: 'Vincent',
    roles: ['素材库工程师', '艺术设计'],
    color: '#f59e0b',
    icon: <ImageIcon className="w-10 h-10" />,
    description: '负责素材库工程化与创意设计，让艺术与技术完美融合',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    name: 'Alan',
    nameEn: 'Alan',
    roles: ['前端工程师', '后端工程师', '项目总设计师'],
    color: '#10b981',
    icon: <Server className="w-10 h-10" />,
    description: '负责产品方向把控与团队协作，并负责了相关技术工作',
    gradient: 'from-emerald-500 to-teal-500'
  }
];

export const TeamPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="mb-10 flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-white hover:shadow-lg transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">返回</span>
        </motion.button>

        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6 border border-blue-200/50">
            <Users className="w-6 h-6 text-indigo-600" />
            <span className="text-indigo-700 font-bold tracking-wide">构建团队</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            我们的团队
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            一群充满激情的创造者，用代码与设计构建美好未来
          </p>
        </motion.div>

        {/* 团队成员卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                {/* 装饰背景 */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${member.gradient} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />
                
                <div className="relative">
                  {/* 头像区域 */}
                  <div className="flex items-center gap-6 mb-6">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}
                    >
                      <div className="text-white">
                        {member.icon}
                      </div>
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {member.name}
                      </h2>
                      <p className="text-slate-500 font-medium mt-1">{member.nameEn}</p>
                    </div>
                  </div>

                  {/* 角色标签 */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {member.roles.map((role, roleIndex) => (
                      <motion.span
                        key={roleIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + roleIndex * 0.05 }}
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 group-hover:border-slate-300 transition-all"
                      >
                        {role}
                      </motion.span>
                    ))}
                  </div>

                  {/* 描述 */}
                  <p className="text-slate-600 leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 底部标语 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <p className="text-lg text-slate-700 font-medium">
              用技术创造无限可能 · 用设计改变世界
            </p>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
        </motion.div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};