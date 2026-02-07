// views/Prompts.tsx - Refactored prompts view with split-screen editor

import React, { useState, useMemo } from 'react';
import { auth } from '../lib/firebaseConfig';
import { Button, Card, CardHeader, Badge, SearchBar } from '../components/ui';
import { useCollection } from '../hooks/useCollection';
import { Prompt, ViewType } from '../types';

interface PromptsProps {
  onNavigate: (view: ViewType, targetId?: string) => void;
  targetId?: string;
}

const CATEGORIES = ['All', 'Favorites', 'UI/UX', 'Code', 'Marketing', 'Content', 'Data', 'Design', 'Other'];

export const Prompts: React.FC<PromptsProps> = ({ onNavigate, targetId }) => {
  const { data: prompts, loading, stats, addItem, updateItem, deleteItem } = useCollection<Prompt>('prompts');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Other',
    tags: [] as string[],
    isFavorite: false,
  });

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      // Category filter
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Favorites') return prompt.isFavorite;
      return prompt.category === selectedCategory || prompt.tags?.includes(selectedCategory);
    }).filter(prompt => {
      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [prompts, selectedCategory, searchQuery]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert('You must be logged in to create a prompt');
      return;
    }
    await addItem({ ...form, userId });
    setShowCreateModal(false);
    setForm({ title: '', content: '', category: 'Other', tags: [], isFavorite: false });
  };

  const handleUpdate = async () => {
    if (!selectedPrompt || !form.title.trim()) return;
    await updateItem(selectedPrompt.id, form);
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this prompt permanently?')) {
      await deleteItem(id);
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setForm({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags || [],
      isFavorite: prompt.isFavorite,
    });
    setIsEditing(true);
  };

  const toggleFavorite = async (prompt: Prompt) => {
    await updateItem(prompt.id, { isFavorite: !prompt.isFavorite });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Prompts</h1>
            <p className="text-slate-500 dark:text-slate-400">
              {stats.total} prompts • {stats.favorites} favorites
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <span className="mr-2">+</span> New Prompt
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split View: List + Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Prompts List */}
        <div className={`${selectedPrompt ? 'hidden md:block md:w-1/3' : 'w-full'} border-r border-slate-200 dark:border-slate-700 overflow-y-auto`}>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading prompts...</div>
          ) : filteredPrompts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-slate-500 mb-4">No prompts found</p>
              {searchQuery && (
                <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedPrompt?.id === prompt.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{prompt.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {prompt.content.slice(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="blue">{prompt.category}</Badge>
                        {prompt.isFavorite && <span>⭐</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Panel */}
        <div className={`${selectedPrompt ? 'flex-1' : 'hidden'} bg-white dark:bg-slate-800 overflow-y-auto`}>
          {selectedPrompt ? (
            <div className="p-6 max-w-3xl">
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPrompt(null)}
                    className="md:hidden"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant={isEditing ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => isEditing ? handleUpdate() : handleEdit(selectedPrompt)}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(selectedPrompt)}
                  >
                    {selectedPrompt.isFavorite ? '⭐' : '☆'}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleDelete(selectedPrompt.id)}
                >
                  🗑️ Delete
                </Button>
              </div>

              {/* Editor Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={isEditing ? form.title : selectedPrompt.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={isEditing ? form.category : selectedPrompt.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                  >
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                  <textarea
                    value={isEditing ? form.content : selectedPrompt.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    disabled={!isEditing}
                    rows={12}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:bg-slate-50 dark:disabled:bg-slate-800 font-mono text-sm"
                  />
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Created: {new Date(selectedPrompt.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>Select a prompt to view or edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Prompt</h2>
            
            <div className="space-y-4">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              
              <textarea
                placeholder="Prompt content..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
