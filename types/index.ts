export interface TimerRecord {
  id: string;
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
  
  startTimer: (category: TimerCategory) => void;
  pauseTimer: () => void;
  addLap: () => void;
  resetTimer: () => void;

  deleteRecord: (id: string) => void;
  transferRecord: (recordId: string, newCategory: TimerCategory) => void; // CORRECTED
  
  setDarkMode: (isDark: boolean) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  setBackgroundImageUri: (uri: string | null) => void;
  setUserProfile: (name: string) => void;
}