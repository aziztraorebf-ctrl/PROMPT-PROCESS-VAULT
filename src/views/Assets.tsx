// views/Assets.tsx - Refactored assets view with masonry layout

import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Badge, SearchBar } from '../components/ui';
import { useCollection } from '../hooks/useCollection';
import { Asset, ViewType } from '../types';

interface AssetsProps {
  onNavigate: (view: ViewType, targetId?: string) => void;
  targetId?: string;
}

const COLLECTIONS = ['All', 'Favorites', 'Marketing & Strategy', 'Development & Code', 'Design & UI/UX', 'Archives / Other'];

export const Assets: React.FC<AssetsProps> = ({ onNavigate, targetId }) => {
  const userId = auth.currentUser?.uid;
  const { data: assets, loading, stats, addItem, updateItem, deleteItem } = useCollection<Asset>('assets', { userId });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMagicUpload, setShowMagicUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle targetId for deep linking
  useEffect(() => {
    if (targetId && assets.length > 0) {
      if (targetId === 'MAGIC_UPLOAD') {
        setShowMagicUpload(true);
        fileInputRef.current?.click();
      } else {
        const asset = assets.find(a => a.id === targetId);
        if (asset) {
          setSelectedAsset(asset);
        }
      }
    }
  }, [targetId, assets]);

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (selectedCollection === 'All') return true;
    if (selectedCollection === 'Favorites') return asset.isFavorite;
    return asset.category === selectedCollection;
  }).filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.title.toLowerCase().includes(query) ||
      asset.description.toLowerCase().includes(query) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    // TODO: Upload to Firebase Storage + AI analysis
    setTimeout(() => {
      setIsUploading(false);
      alert('Upload functionality to be implemented with Firebase Storage');
    }, 1000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this asset permanently?')) {
      await deleteItem(id);
      if (selectedAsset?.id === id) setSelectedAsset(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Assets</h1>
            <p className="text-slate-500 dark:text-slate-400">
              {stats.total} assets • {stats.favorites} favorites
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : '📤 Upload'}
            </Button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {COLLECTIONS.map(col => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCollection === col
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-slate-500 mb-4">No assets yet</p>
            <Button onClick={() => fileInputRef.current?.click()}>Upload your first asset</Button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredAssets.map(asset => (
              <Card
                key={asset.id}
                hover
                className="break-inside-avoid"
                onClick={() => setSelectedAsset(asset)}
              >
                {/* Image Preview */}
                <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 overflow-hidden">
                  {asset.url ? (
                    <img 
                      src={asset.url} 
                      alt={asset.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      🖼️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{asset.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {asset.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge color="purple">{asset.category}</Badge>
                    <div className="flex gap-1">
                      {asset.isFavorite && <span>⭐</span>}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="aspect-video bg-slate-100 dark:bg-slate-700">
              {selectedAsset.url ? (
                <img src={selectedAsset.url} alt={selectedAsset.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-6xl">🖼️</div>
              )}
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{selectedAsset.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">{selectedAsset.description}</p>
              
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge color="purple">{selectedAsset.category}</Badge>
                {selectedAsset.tags?.map(tag => (
                  <span key={tag}><Badge color="gray">{tag}</Badge></span>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelectedAsset(null)}>Close</Button>
                <Button 
                  variant="secondary"
                  onClick={() => updateItem(selectedAsset.id, { isFavorite: !selectedAsset.isFavorite })}
                >
                  {selectedAsset.isFavorite ? '⭐ Unfavorite' : '☆ Favorite'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
