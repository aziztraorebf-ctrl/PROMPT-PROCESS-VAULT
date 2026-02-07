// views/Frameworks.tsx - Simplified frameworks view

import React, { useState } from 'react';
import { auth } from '../lib/firebaseConfig';
import { Button, Card, Badge, SearchBar } from '../components/ui';
import { useCollection } from '../hooks/useCollection';
import { Framework, ViewType } from '../types';

interface FrameworksProps {
  onNavigate: (view: ViewType, targetId?: string) => void;
}

export const Frameworks: React.FC<FrameworksProps> = ({ onNavigate }) => {
  const userId = auth.currentUser?.uid;
  const { data: frameworks, loading, stats, addItem, updateItem, deleteItem } = useCollection<Framework>('frameworks', { userId });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Process', tags: [] as string[] });

  const filtered = frameworks.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert('You must be logged in to create a framework');
      return;
    }
    await addItem({ ...form, userId, isFavorite: false });
    setShowCreate(false);
    setForm({ title: '', content: '', category: 'Process', tags: [] });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Frameworks</h1>
            <p className="text-slate-500 dark:text-slate-400">{stats.total} frameworks</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New Framework</Button>
        </div>

        <SearchBar
          placeholder="Search frameworks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">No frameworks yet</p>
            <Button onClick={() => setShowCreate(true)}>Create Framework</Button>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {filtered.map(framework => (
              <Card key={framework.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{framework.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                      {framework.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge color="emerald">{framework.category}</Badge>
                      {framework.isFavorite && <span>⭐</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this framework permanently?')) {
                        deleteItem(framework.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">New Framework</h2>
            
            <div className="space-y-4">
              <input
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <textarea
                placeholder="Framework steps or content..."
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                rows={8}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
