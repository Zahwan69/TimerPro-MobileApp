import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  startTime: number; 
  stopTime: number;  
  durationMs: number; 
  laps: number[];    
  isPersonalBest: boolean;
  bestLapIndex?: number | null;
  notes?: string;
}

export type TimerType = 'asap' | 'endurance';

export interface TimerCategory {
  id: string;
  name: string;
  personalBestMs: number | null; 
  bestLapMs: number | null;
  goalMs: number | null;
  timerType: TimerType;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  isProfileSetup: boolean; 
}

export interface TimerState {
  categories: TimerCategory[];
  records: TimerRecord[];
  isRunning: boolean;
  timeElapsed: number; 
  startTimestamp?: number | null;
  currentCategory: TimerCategory | null;
  currentLaps: number[];
  
  userProfile: UserProfile;
  isDarkMode: boolean;
  fontSizeMultiplier: number;
  backgroundImageUri: string | null; 

  addCategory: (name: string) => void;
  editCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  setCurrentCategory: (category: TimerCategory) => void;
  setCategoryGoal: (id: string, goalMs: number | null) => void;
  setCategoryTimerType: (id: string, timerType: TimerType) => void;
  
  startTimer: (category: TimerCategory | null) => void;
  pauseTimer: () => void;
  addLap: () => void;
  resetTimer: () => void;
  saveTimer: (categoryName: string) => void;

  deleteRecord: (id: string) => void;
  transferRecord: (recordId: string, newCategory: TimerCategory) => void;
  
  setDarkMode: (isDark: boolean) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  setBackgroundImageUri: (uri: string | null) => void;
  setUserProfile: (name: string) => void;
}


const isNewPersonalBest = (currentTime: number, existingPB: number | null, timerType: TimerType): boolean => {
  if (existingPB === null) return true;
  if (timerType === 'asap') {
    return currentTime < existingPB;
  } else {
    return currentTime > existingPB;
  }
};

const findBestTime = (records: TimerRecord[], timerType: TimerType): number | null => {
  if (records.length === 0) return null;
  if (timerType === 'asap') {
    return records.reduce((min, record) => (record.durationMs < min || min === null) ? record.durationMs : min, records[0].durationMs);
  } else {
    return records.reduce((max, record) => (record.durationMs > max || max === null) ? record.durationMs : max, records[0].durationMs);
  }
};

const findBestLapTime = (records: TimerRecord[], timerType: TimerType): number | null => {
  let allLaps: number[] = [];
  records.forEach(record => {
    allLaps = allLaps.concat(record.laps);
  });
  
  if (allLaps.length === 0) return null;
  if (timerType === 'asap') {
    return Math.min(...allLaps);
  } else {
    return Math.max(...allLaps);
  }
};

const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      categories: [{ id: 'default', name: 'Default Activity', personalBestMs: null, bestLapMs: null, goalMs: null, timerType: 'asap', createdAt: Date.now() }],
      records: [],
      isRunning: false,
      timeElapsed: 0,
      startTimestamp: null,
      currentCategory: null,
      currentLaps: [],
      userProfile: { name: 'Guest', isProfileSetup: false },
      isDarkMode: false,
      fontSizeMultiplier: 1.0,
      backgroundImageUri: null,

      addCategory: (name) => set((state) => {
        const trimmedName = name.trim();
        // Check for duplicate names (case-insensitive)
        const isDuplicate = state.categories.some(
          cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        // Return state unchanged if duplicate found
        if (isDuplicate) {
          return state;
        }
        
        return {
          categories: [...state.categories, { 
            id: Date.now().toString(), 
            name: trimmedName, 
            personalBestMs: null, 
            bestLapMs: null,
            goalMs: null,
            timerType: 'asap',
            createdAt: Date.now() 
          }],
        };
      }),
      editCategory: (id, newName) => set((state) => {
        const trimmedName = newName.trim();
        // Check for duplicate names (case-insensitive), excluding the current category being edited
        const isDuplicate = state.categories.some(
          cat => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        // Return state unchanged if duplicate found
        if (isDuplicate) {
          return state;
        }
        
        return {
          categories: state.categories.map(cat => cat.id === id ? { ...cat, name: trimmedName } : cat),
        };
      }),
      deleteCategory: (id) => set((state) => {
        const remainingRecords = state.records.filter(record => record.categoryId !== id);
        return {
            categories: state.categories.filter(cat => cat.id !== id),
            records: remainingRecords,
            currentCategory: state.currentCategory?.id === id ? null : state.currentCategory,
        };
      }),
      setCurrentCategory: (category) => set({ currentCategory: category }),
      setCategoryGoal: (id, goalMs) => set((state) => ({
        categories: state.categories.map(cat => cat.id === id ? { ...cat, goalMs } : cat),
      })),
      setCategoryTimerType: (id, timerType) => set((state) => {
        const category = state.categories.find(c => c.id === id);
        if (!category) return state;
        
        const recordsInCat = state.records.filter(r => r.categoryId === id);
        const newPB = findBestTime(recordsInCat, timerType);
        
        const updatedRecords = state.records.map(record => {
          if (record.categoryId === id && newPB !== null && record.durationMs === newPB) {
            return { ...record, isPersonalBest: true };
          } else if (record.categoryId === id) {
            return { ...record, isPersonalBest: false };
          }
          return record;
        });
        
        return {
          categories: state.categories.map(cat => 
            cat.id === id ? { ...cat, timerType, personalBestMs: newPB } : cat
          ),
          records: updatedRecords,
        };
      }),
      startTimer: (category) => {
          if (!get().isRunning) {
            const currentElapsed = get().timeElapsed || 0;
            const startTs = Date.now() - currentElapsed;
            if (currentElapsed === 0) {
              set({ currentCategory: category || null, isRunning: true, currentLaps: [], startTimestamp: Date.now() });
            } else {
              set({ isRunning: true, startTimestamp: startTs });
            }
          }
        },
        pauseTimer: () => {
          const state = get();
          const elapsed = state.startTimestamp ? Date.now() - state.startTimestamp : state.timeElapsed;
          set({ isRunning: false, timeElapsed: elapsed, startTimestamp: null });
        },
        addLap: () => set((state) => {
          if (state.isRunning) {
            const nowElapsed = state.startTimestamp ? Date.now() - state.startTimestamp : state.timeElapsed;
            const totalTimeSoFar = state.currentLaps.reduce((sum, lap) => sum + lap, 0);
            const currentLapTime = Math.max(0, nowElapsed - totalTimeSoFar);
            return { currentLaps: [...state.currentLaps, currentLapTime] };
          }
          return state;
        }),
      saveTimer: (categoryName) => {
          const state = get();
          if (state.timeElapsed > 0 && !state.isRunning) {
              let category = state.categories.find(cat => cat.name.toLowerCase() === categoryName.trim().toLowerCase());
              let updatedCategories = state.categories;
              
              if (!category) {
                  category = { 
                    id: Date.now().toString(), 
                    name: categoryName.trim(), 
                    personalBestMs: null, 
                    bestLapMs: null,
                    goalMs: null,
                    timerType: 'asap',
                    createdAt: Date.now() 
                  };
                  updatedCategories = [...state.categories, category];
              }
              
              let bestLapIndexInRecord: number | null = null;
              if (state.currentLaps.length > 0) {
                  for (let i = 0; i < state.currentLaps.length; i++) {
                      if (isNewPersonalBest(state.currentLaps[i], category.bestLapMs, category.timerType)) {
                          bestLapIndexInRecord = i;
                          break;
                      }
                  }
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
                  bestLapIndex: bestLapIndexInRecord,
              };
              
              let newBestLapMs = category.bestLapMs;
              if (bestLapIndexInRecord !== null) {
                  newBestLapMs = state.currentLaps[bestLapIndexInRecord];
              }
              
              if (isNewPersonalBest(state.timeElapsed, category.personalBestMs, category.timerType)) {
                  finalRecord.isPersonalBest = true;
                  const updatedRecordsWithoutPB = state.records.map(rec =>
                      rec.categoryId === category.id 
                          ? { ...rec, isPersonalBest: false }
                          : rec
                  );
                  updatedCategories = updatedCategories.map(cat => 
                      cat.id === category.id ? { ...cat, personalBestMs: state.timeElapsed, bestLapMs: newBestLapMs } : cat
                  );
                  set({
                      categories: updatedCategories, 
                      records: [...updatedRecordsWithoutPB, finalRecord],
                      timeElapsed: 0,
                      currentLaps: [],
                      isRunning: false,
                      startTimestamp: null,
                      currentCategory: updatedCategories.find(cat => cat.id === category.id) || category,
                  });
                  return;
              } else if (newBestLapMs !== category.bestLapMs) {
                  updatedCategories = updatedCategories.map(cat => 
                      cat.id === category.id ? { ...cat, bestLapMs: newBestLapMs } : cat
                  );
              }

                set({
                  categories: updatedCategories, 
                  records: [...state.records, finalRecord],
                  timeElapsed: 0,
                  currentLaps: [],
                  isRunning: false,
                  startTimestamp: null,
                  currentCategory: updatedCategories.find(cat => cat.id === category.id) || category,
                });
          }
      },
        resetTimer: () => {
          set({ isRunning: false, timeElapsed: 0, currentLaps: [], currentCategory: null, startTimestamp: null });
        },

      deleteRecord: (id) => set((state) => {
          const oldRecord = state.records.find(r => r.id === id);
          const updatedRecords = state.records.filter(record => record.id !== id);
          const updatedCategories = state.categories.map(cat => {
              if (cat.id === oldRecord?.categoryId) {
                  const recordsInCat = updatedRecords.filter(r => r.categoryId === cat.id);
                  const newPB = findBestTime(recordsInCat, cat.timerType);
                  const newBestLap = findBestLapTime(recordsInCat, cat.timerType);
                  return { ...cat, personalBestMs: newPB, bestLapMs: newBestLap };
              }
              return cat;
          });
          const finalRecords: TimerRecord[] = updatedRecords.map(record => {
            const category = updatedCategories.find(c => c.id === record.categoryId);
            let bestLapIdx: number | null = null;
            if (category && record.laps.length > 0) {
                for (let i = 0; i < record.laps.length; i++) {
                    if (category.bestLapMs !== null && record.laps[i] === category.bestLapMs) {
                        bestLapIdx = i;
                        break;
                    }
                }
            }
            const isPB = !!(category && category.personalBestMs !== null && record.durationMs === category.personalBestMs);
            return { ...record, isPersonalBest: isPB, bestLapIndex: bestLapIdx };
          });
          return { records: finalRecords, categories: updatedCategories };
      }),

      transferRecord: (recordId, newCategory) => set((state) => {
        const oldRecord = state.records.find(r => r.id === recordId);
        const oldCategoryId = oldRecord?.categoryId;
        
        const updatedRecords = state.records.map(record => 
          record.id === recordId 
            ? { ...record, categoryId: newCategory.id, categoryName: newCategory.name, isPersonalBest: false, bestLapIndex: null } 
            : record
        );
        
        const updatedCategories = state.categories.map(cat => {
          if (cat.id === newCategory.id || (oldCategoryId && cat.id === oldCategoryId)) {
            const recordsInCat = updatedRecords.filter(r => r.categoryId === cat.id);
            const newPB = findBestTime(recordsInCat, cat.timerType);
            const newBestLap = findBestLapTime(recordsInCat, cat.timerType);
            return { ...cat, personalBestMs: newPB, bestLapMs: newBestLap };
          }
          return cat;
        });

        const finalRecords: TimerRecord[] = updatedRecords.map(record => {
          const category = updatedCategories.find(c => c.id === record.categoryId);
          let bestLapIdx: number | null = null;
          if (category && record.laps.length > 0) {
              for (let i = 0; i < record.laps.length; i++) {
                  if (category.bestLapMs !== null && record.laps[i] === category.bestLapMs) {
                      bestLapIdx = i;
                      break;
                  }
              }
          }
          const isPB = !!(category && category.personalBestMs !== null && record.durationMs === category.personalBestMs);
          return { ...record, isPersonalBest: isPB, bestLapIndex: bestLapIdx };
        });

        return { records: finalRecords, categories: updatedCategories };
      }),

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