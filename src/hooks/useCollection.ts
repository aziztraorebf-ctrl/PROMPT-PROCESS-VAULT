// hooks/useCollection.ts - Optimized data fetching

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc,
  addDoc,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { CollectionName } from '../types';

interface UseCollectionOptions {
  filters?: QueryConstraint[];
  orderByField?: string;
  limitCount?: number;
}

export function useCollection<T extends { id: string }>(
  collectionName: CollectionName,
  options: UseCollectionOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    let q = collection(db, collectionName);
    
    if (options.filters) {
      q = query(q, ...options.filters) as typeof q;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as T));
        
        // Client-side sorting if needed
        if (options.orderByField) {
          items.sort((a: any, b: any) => {
            const aVal = a[options.orderByField!];
            const bVal = b[options.orderByField!];
            return bVal - aVal; // Descending
          });
        }
        
        // Client-side limit
        if (options.limitCount) {
          items.splice(options.limitCount);
        }
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(options)]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      setData(items);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return true;
    } catch (err) {
      console.error('Delete failed:', err);
      return false;
    }
  }, [collectionName]);

  const updateItem = useCallback(async (id: string, data: Partial<T>) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('Update failed:', err);
      return false;
    }
  }, [collectionName]);

  const addItem = useCallback(async (data: Omit<T, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.error('Add failed:', err);
      return null;
    }
  }, [collectionName]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: data.length,
    favorites: data.filter((item: any) => item.isFavorite).length,
    recent: data.filter((item: any) => {
      const created = item.createdAt?.seconds || 0;
      const weekAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
      return created > weekAgo;
    }).length,
  }), [data]);

  return {
    data,
    loading,
    error,
    stats,
    refresh,
    deleteItem,
    updateItem,
    addItem,
  };
}
