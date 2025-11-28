export interface TimerRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  startTime: number; 
  stopTime: number;  
  durationMs: number; 
  laps: number[];    
  isPersonalBest: boolean;
  bestLapIndex?: number | null;  // Index of lap that is a PB lap (e.g., 0 = first lap)
  notes?: string;
}

export type TimerType = 'asap' | 'endurance'; // ASAP = shortest is best, Endurance = longest is best

export interface TimerCategory {
  id: string;
  name: string;
  personalBestMs: number | null;  // Category-level: best overall time
  bestLapMs: number | null;       // Category-level: best single lap time
  goalMs: number | null;          // Goal time in milliseconds
  timerType: TimerType;           // 'asap' for fastest time, 'endurance' for longest time
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
  currentCategory: TimerCategory | null;
  currentLaps: number[];
  
  userProfile: UserProfile;
  isDarkMode: boolean;
  fontSizeMultiplier: number;
  backgroundImageUri: string | null; 

  // --- ACTIONS ---
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
  transferRecord: (recordId: string, newCategory: TimerCategory) => void; // CORRECTED
  
  setDarkMode: (isDark: boolean) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  setBackgroundImageUri: (uri: string | null) => void;
  setUserProfile: (name: string) => void;
}