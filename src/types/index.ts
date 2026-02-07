// types/index.ts - TypeScript strict definitions

// Firebase Timestamp type
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface Framework {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export type CollectionName = 'prompts' | 'assets' | 'frameworks';

export type ViewType = 'dashboard' | 'prompts' | 'assets' | 'frameworks';

export interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
  badge?: number;
}

export interface QuickActionType {
  id: string;
  label: string;
  icon: string;
  color: string;
  targetView: ViewType;
  targetId?: string;
}

// Theme type is defined in lib/theme.ts - use that as the single source of truth
export type { Theme } from '../lib/theme';
