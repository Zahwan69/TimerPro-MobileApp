import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import useTimerStore, {  } from '../../store/useTimerStore';
import TimerControls from '../../components/TimerControls';
import TimerDisplay from '../../components/TimerDisplay';
import CategoryManagementModal from '../../components/CategoryManagementModal';
import { Stack } from 'expo-router'; // Necessary for setting screen options


const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // show hundredths
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export default function TimerScreen() {
  // Pull state and actions from the Zustand store
  const { 
    isRunning, 
    timeElapsed, 
    currentCategory, 
    currentLaps, 
    categories,
    // Actions you will define later:
    startTimer, 
    pauseTimer, 
    resetTimer, 
    addLap, 
    setCurrentCategory,
  } = useTimerStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  
  useEffect(() => {
    // 1. Declare the interval handle in the outer scope
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
        const startTime = Date.now() - timeElapsed;
        
        interval = setInterval(() => {
            // Update the time in the Zustand store
            useTimerStore.setState({ timeElapsed: Date.now() - startTime });
        }, 10);
    } 
    // 2. The problematic 'else if' block is removed as it's not needed.

    // 3. Cleanup function runs when the component unmounts OR when 'isRunning' changes
    return () => {
        if (interval !== null) {
            clearInterval(interval);
        }
    };
}, [isRunning, timeElapsed]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Timer & PB Tracker' }} />
      
      {/* 1. Timer Display */}
      <TimerDisplay 
        timeString={formatTime(timeElapsed)} 
        categoryName={currentCategory?.name || 'Select a Category'}
      />
      
      {/* 2. Current Personal Best (PB) Display */}
      {currentCategory && (
        <View style={styles.pbContainer}>
          <Text style={styles.pbLabel}>Personal Best ({currentCategory.name}):</Text>
          <Text style={styles.pbTime}>
            {currentCategory.personalBestMs ? formatTime(currentCategory.personalBestMs) : 'N/A'}
          </Text>
        </View>
      )}

      {/* 3. Timer Controls */}
      <TimerControls 
        isRunning={isRunning} 
        timeElapsed={timeElapsed}
        onStart={() => startTimer(currentCategory!)} // You'll implement startTimer to use currentCategory
        onPause={pauseTimer}
        onReset={resetTimer} 
        onLap={addLap}
        isDisabled={!currentCategory} // Disable controls if no category is selected
      />
      
      {/* 4. Category Management Access */}
      <TouchableOpacity 
        style={styles.categoryButton} 
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.categoryButtonText}>Manage Categories ({categories.length})</Text>
      </TouchableOpacity>
      
      {/* 5. Lap List (Simple display for now) */}
      <ScrollView style={styles.lapList}>
        <Text style={styles.lapHeader}>Laps:</Text>
        {currentLaps.slice().reverse().map((lapTime, index) => (
          <Text key={index} style={styles.lapText}>
            Lap {currentLaps.length - index}: {formatTime(lapTime)}
          </Text>
        ))}
      </ScrollView>

      {/* 6. Category Management Modal */}
      <CategoryManagementModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)}
        onSelectCategory={setCurrentCategory}
        currentSelectedCategory={currentCategory}
      />
    </View>
  );
}

// Basic Styling (use NativeWind or style the full object later)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    pbContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    pbLabel: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    pbTime: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF', // Blue accent color
    },
    categoryButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#4CAF50', // Green button
        borderRadius: 8,
    },
    categoryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    lapList: {
        marginTop: 20,
        width: '100%',
        maxHeight: 150, // Limit height
    },
    lapHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    lapText: {
        fontSize: 14,
        paddingVertical: 2,
    }
});