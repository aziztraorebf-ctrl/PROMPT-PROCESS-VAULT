// views/Dashboard.tsx - New improved dashboard

import React, { useMemo } from 'react';
import { User } from 'firebase/auth';
import { Button, Card, CardHeader, Badge } from '../components/ui';
import { useCollection } from '../hooks/useCollection';
import { Prompt, Asset, Framework, ViewType, QuickActionType } from '../types';

interface DashboardProps {
  user: User | null;
  onNavigate: (view: ViewType, targetId?: string) => void;
}

const quickActions: QuickActionType[] = [
  { id: 'new-prompt', label: 'New Prompt', icon: 'FileText', color: 'from-blue-500 to-indigo-500', targetView: 'prompts' },
  { id: 'upload-asset', label: 'Upload Asset', icon: 'Upload', color: 'from-purple-500 to-pink-500', targetView: 'assets' },
  { id: 'new-framework', label: 'New Framework', icon: 'Box', color: 'from-emerald-500 to-teal-500', targetView: 'frameworks' },
  { id: 'magic-analysis', label: 'Magic Analysis', icon: 'Sparkles', color: 'from-amber-400 to-orange-500', targetView: 'assets', targetId: 'MAGIC_UPLOAD' },
];

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const prompts = useCollection<Prompt>('prompts');
  const assets = useCollection<Asset>('assets');
  const frameworks = useCollection<Framework>('frameworks');

  // Get recent items (last 5)
  const recentItems = useMemo(() => {
    const all = [
      ...prompts.data.map(p => ({ ...p, type: 'prompt' as const })),
      ...assets.data.map(a => ({ ...a, type: 'asset' as const })),
      ...frameworks.data.map(f => ({ ...f, type: 'framework' as const })),
    ];
    return all
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);
  }, [prompts.data, assets.data, frameworks.data]);

  const stats = [
    { label: 'Prompts', value: prompts.stats.total, icon: '📝', color: 'blue' },
    { label: 'Assets', value: assets.stats.total, icon: '🖼️', color: 'purple' },
    { label: 'Frameworks', value: frameworks.stats.total, icon: '📦', color: 'emerald' },
    { label: 'This Week', value: prompts.stats.recent + assets.stats.recent, icon: '⚡', color: 'amber' },
  ];

  const getFirstName = () => user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {getFirstName()} 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            Here's what's happening in your vault
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                fullWidth
                className="h-auto py-4 flex-col items-center gap-2 group"
                onClick={() => onNavigate(action.targetView, action.targetId)}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  {action.icon === 'FileText' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {action.icon === 'Upload' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                  {action.icon === 'Box' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                  {action.icon === 'Sparkles' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Items */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recently Added</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('prompts')}>
              View All →
            </Button>
          </div>

          {recentItems.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No items yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Start by creating your first prompt or uploading an asset
              </p>
              <Button onClick={() => onNavigate('prompts')}>Create Prompt</Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recentItems.map((item) => (
                <Card
                  key={item.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => onNavigate(item.type + 's' as ViewType, item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {item.type === 'prompt' && '📝'}
                        {item.type === 'asset' && '🖼️'}
                        {item.type === 'framework' && '📦'}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                          {('description' in item ? item.description : item.content)?.slice(0, 60) + '...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={item.type === 'prompt' ? 'blue' : item.type === 'asset' ? 'purple' : 'emerald'}>
                        {item.type}
                      </Badge>
                      {item.isFavorite && <span>⭐</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
