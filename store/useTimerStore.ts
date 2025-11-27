// store/useTimerStore.ts (Corrected and Completed)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Required for Persistence (15 marks)
import AsyncStorage from '@react-native-async-storage/async-storage';
// Assuming you have moved your interfaces to types/index.ts:
// import { TimerState, TimerCategory, TimerRecord, UserProfile } from '../types';

// NOTE: Since the full project structure is not reflected here, I will use the types defined above 
// and add the missing ones directly below for compilation purposes.

export interface TimerRecord {
  id: string; // Unique ID for the record
  categoryId: string;
  categoryName: string;
  startTime: number; 
  stopTime: number;  
  durationMs: number; 
  laps: number[];    
  isPersonalBest: boolean;
  notes?: string;
}

export interface TimerCategory {
  id: string;
  name: string;
  personalBestMs: number | null; 
  createdAt: number;
}

export interface UserProfile {
  name: string;
  isProfileSetup: boolean; 
}

// 📌 CORRECTED TimerState Interface (Must include all defined actions)
export interface TimerState {
  categories: TimerCategory[];
  records: TimerRecord[];
  isRunning: boolean;
  timeElapsed: number; 
  currentCategory: TimerCategory | null;
  currentLaps: number[];
  
  // Settings & Profile
  userProfile: UserProfile;
  isDarkMode: boolean;
  fontSizeMultiplier: number;
  backgroundImageUri: string | null; 

  // Actions (Full List of required actions)
  addCategory: (name: string) => void;
  editCategory: (id: string, newName: string) => void; // 👈 Explicit Types
  deleteCategory: (id: string) => void;
  setCurrentCategory: (category: TimerCategory) => void; // 👈 Explicit Types
  
  startTimer: (category: TimerCategory | null) => void; // 👈 Explicit Types
  pauseTimer: () => void;
  addLap: () => void;
  resetTimer: () => void;
  saveTimer: (categoryName: string) => void; // Save timer with category name without resetting

  deleteRecord: (id: string) => void; // 👈 Explicit Types
  transferRecord: (recordId: string, newCategory: TimerCategory) => void;
  
  // Settings Actions (Need to be added for Settings Screen functionality)
  setDarkMode: (isDark: boolean) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  setBackgroundImageUri: (uri: string | null) => void;
  setUserProfile: (name: string) => void;
}


const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // --- Initial State (Matching TimerState) ---
      categories: [{ id: 'default', name: 'Default Activity', personalBestMs: null, createdAt: Date.now() }],
      records: [],
      isRunning: false,
      timeElapsed: 0,
      currentCategory: null,
      currentLaps: [],
      userProfile: { name: 'Guest', isProfileSetup: false },
      isDarkMode: false,
      fontSizeMultiplier: 1.0,
      backgroundImageUri: null,

      // --- Category CRUD Actions ---
      addCategory: (name) => set((state) => ({
        categories: [...state.categories, { id: Date.now().toString(), name: name.trim(), personalBestMs: null, createdAt: Date.now() }],
      })),
      editCategory: (id, newName) => set((state) => ({
        categories: state.categories.map(cat => cat.id === id ? { ...cat, name: newName.trim() } : cat),
      })),
      deleteCategory: (id) => set((state) => {
        const remainingRecords = state.records.filter(record => record.categoryId !== id);
        return {
            categories: state.categories.filter(cat => cat.id !== id),
            records: remainingRecords,
            currentCategory: state.currentCategory?.id === id ? null : state.currentCategory,
        };
      }),
      setCurrentCategory: (category) => set({ currentCategory: category }),


      // --- Timer Control Actions ---
      startTimer: (category) => {
          if (!get().isRunning) {
              if (get().timeElapsed === 0) {
                  set({ currentCategory: category || null, isRunning: true, currentLaps: [] });
              } else {
                  set({ isRunning: true });
              }
          }
      },
      pauseTimer: () => set({ isRunning: false }),
      addLap: () => set((state) => {
          if (state.isRunning) {
              const totalTimeSoFar = state.currentLaps.reduce((sum, lap) => sum + lap, 0);
              const currentLapTime = state.timeElapsed - totalTimeSoFar;
              return { currentLaps: [...state.currentLaps, currentLapTime] };
          }
          return state;
      }),
      saveTimer: (categoryName) => {
          const state = get();
          if (state.timeElapsed > 0 && !state.isRunning) {
              // Find or create category
              let category = state.categories.find(cat => cat.name.toLowerCase() === categoryName.trim().toLowerCase());
              let updatedCategories = state.categories;
              
              if (!category) {
                  // Create new category
                  category = { id: Date.now().toString(), name: categoryName.trim(), personalBestMs: null, createdAt: Date.now() };
                  updatedCategories = [...state.categories, category];
              }
              
              const finalRecord: TimerRecord = {
                  id: Date.now().toString(), 
                  categoryId: category.id, 
                  categoryName: category.name,
                  startTime: Date.now() - state.timeElapsed, 
                  stopTime: Date.now(), 
                  durationMs: state.timeElapsed, 
                  laps: state.currentLaps,
                  isPersonalBest: false, 
              };
              
              // Update PB if needed
              if (!category.personalBestMs || state.timeElapsed < category.personalBestMs) {
                  finalRecord.isPersonalBest = true;
                  updatedCategories = updatedCategories.map(cat => 
                      cat.id === category.id ? { ...cat, personalBestMs: state.timeElapsed } : cat
                  );
              }

              set({
                  categories: updatedCategories, 
                  records: [...state.records, finalRecord],
                  currentCategory: updatedCategories.find(cat => cat.id === category.id) || category,
              });
          }
      },
      resetTimer: () => {
          set({ isRunning: false, timeElapsed: 0, currentLaps: [], currentCategory: null });
      },

      // --- Record CRUD / Update Actions ---
      deleteRecord: (id) => set((state) => {
          const oldRecord = state.records.find(r => r.id === id);
          const updatedRecords = state.records.filter(record => record.id !== id);
          const findNewPB = (catId: string) => {
              const recordsInCat = updatedRecords.filter(r => r.categoryId === catId);
              if (recordsInCat.length === 0) return null;
              return recordsInCat.reduce((min, record) => (record.durationMs < min || min === null) ? record.durationMs : min, recordsInCat[0].durationMs);
          };
          const updatedCategories = state.categories.map(cat => {
              if (cat.id === oldRecord?.categoryId) {
                  return { ...cat, personalBestMs: findNewPB(cat.id) };
              }
              return cat;
          });
          return { records: updatedRecords, categories: updatedCategories };
      }),

      transferRecord: (recordId, newCategory) => set((state) => {
        
        const oldRecord = state.records.find(r => r.id === recordId);
        const oldCategoryId = oldRecord?.categoryId;
        
        // 1. Update the record itself 
        const updatedRecords = state.records.map(record => 
          record.id === recordId 
            ? { ...record, categoryId: newCategory.id, categoryName: newCategory.name, isPersonalBest: false } 
            : record
        );
        
        const findNewPB = (catId: string | undefined) => {
          if (!catId) return null; 
          const recordsInCat = updatedRecords.filter(r => r.categoryId === catId);
          if (recordsInCat.length === 0) return null;
          return recordsInCat.reduce((min, record) => (record.durationMs < min || min === null) ? record.durationMs : min, recordsInCat[0].durationMs);
        };
        
        // 2. Update category PBs
        const updatedCategories = state.categories.map(cat => {
          if (cat.id === newCategory.id || (oldCategoryId && cat.id === oldCategoryId)) {
            return { ...cat, personalBestMs: findNewPB(cat.id) };
          }
          return cat;
        });

        // 3. Set the new PB flag 
        const finalRecords = updatedRecords.map(record => {
             if (record.categoryId === newCategory.id && record.durationMs === updatedCategories.find(c => c.id === newCategory.id)?.personalBestMs) {
                return { ...record, isPersonalBest: true };
            } else {
                 const isPb = record.categoryId === record.categoryId && record.durationMs === updatedCategories.find(c => c.id === record.categoryId)?.personalBestMs;
                 return { ...record, isPersonalBest: isPb };
            }
        });

        return { records: finalRecords, categories: updatedCategories };
      }),

      // --- Settings Actions ---
      setUserProfile: (name) => set({ userProfile: { name: name.trim(), isProfileSetup: true } }),
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setFontSizeMultiplier: (multiplier) => set({ fontSizeMultiplier: multiplier }),
      setBackgroundImageUri: (uri) => set({ backgroundImageUri: uri }),
    }),
    {
      name: 'timer-storage', 
      storage: createJSONStorage(() => AsyncStorage), 
      partialize: (state) => ({
        categories: state.categories, records: state.records, userProfile: state.userProfile,
        isDarkMode: state.isDarkMode, fontSizeMultiplier: state.fontSizeMultiplier, backgroundImageUri: state.backgroundImageUri,
      }),
    }
  )
);

export default useTimerStore;