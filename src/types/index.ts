// types/index.ts - TypeScript strict definitions

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt?: Date;
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
  createdAt: Date;
  updatedAt?: Date;
  userId: string;
}

export interface Framework {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
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

export interface Theme {
  mode: 'light' | 'dark' | 'system';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
}
