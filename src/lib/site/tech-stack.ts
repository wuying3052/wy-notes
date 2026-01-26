import { Zap, Wind, Database, Code, Sparkles, Feather } from 'lucide-svelte';

export const techStack = [
    {
        name: 'Svelte 5',
        desc: '响应式 UI',
        icon: Zap,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        border: 'border-orange-100'
    },
    {
        name: 'Tailwind 4',
        desc: '现代 CSS',
        icon: Wind,
        color: 'text-sky-500',
        bg: 'bg-sky-50',
        border: 'border-sky-100'
    },
    {
        name: 'Supabase',
        desc: '后端服务',
        icon: Database,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
    },
    {
        name: 'TypeScript',
        desc: '类型安全',
        icon: Code,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100'
    },
    {
        name: 'Vite',
        desc: '构建工具',
        icon: Sparkles,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-100'
    },
    {
        name: 'Lucide',
        desc: '图标系统',
        icon: Feather,
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        border: 'border-pink-100'
    }
] as const;
