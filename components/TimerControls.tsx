import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface TimerControlsProps {
  isRunning: boolean;
  timeElapsed: number;
  isDisabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onLap: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({ 
  isRunning, 
  timeElapsed, 
  isDisabled,
  onStart, 
  onPause, 
  onReset, 
  onLap 
}) => {
  
  if (isDisabled) {
    return (
      <View style={styles.controlContainer}>
        <Text style={styles.disabledText}>Select a Category to Start</Text>
      </View>
    );
  }

  return (
    <View style={styles.controlContainer}>
      {/* Button Row 1 (Lap/Reset) */}
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={timeElapsed === 0 ? onReset : onLap}
        disabled={isRunning && timeElapsed === 0} // Can't lap until timer has some time
      >
        <Text style={styles.secondaryButtonText}>
          {timeElapsed > 0 && isRunning ? 'Lap' : 'Reset'}
        </Text>
      </TouchableOpacity>
      
      {/* Button Row 2 (Start/Pause) */}
      <TouchableOpacity 
        style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]} 
        onPress={isRunning ? onPause : onStart}
      >
        <Text style={styles.primaryButtonText}>
          {isRunning ? 'Pause' : (timeElapsed > 0 ? 'Resume' : 'Start')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 30,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  startButton: {
    backgroundColor: '#34C759', // iOS Green
  },
  pauseButton: {
    backgroundColor: '#FF3B30', // iOS Red
  },
  secondaryButton: {
    backgroundColor: '#E5E5EA', // Light gray
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '500',
  },
  disabledText: {
    fontSize: 18,
    color: '#999',
    padding: 20,
  }
});

export default TimerControls;