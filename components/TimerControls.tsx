import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface TimerControlsProps {
  isRunning: boolean;
  timeElapsed: number;
  isDisabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onLap: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({ 
  isRunning, 
  timeElapsed, 
  isDisabled,
  onStart, 
  onPause, 
  onStop,
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

  const showStopButton = !isRunning && timeElapsed > 0;
  const showLapButton = isRunning && timeElapsed > 0;

  return (
    <View style={styles.controlContainer}>
      {/* Left Button: Reset or Lap */}
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={showLapButton ? onLap : onReset}
        disabled={isRunning && timeElapsed === 0}
      >
        <Text style={styles.secondaryButtonText}>
          {showLapButton ? 'Lap' : 'Reset'}
        </Text>
      </TouchableOpacity>
      
      {/* Center Button: Start/Pause */}
      <TouchableOpacity 
        style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]} 
        onPress={isRunning ? onPause : onStart}
      >
        <Text style={styles.primaryButtonText}>
          {isRunning ? 'Pause' : (timeElapsed > 0 ? 'Resume' : 'Start')}
        </Text>
      </TouchableOpacity>

      {/* Right Button: Stop (when paused) or placeholder */}
      {showStopButton ? (
        <TouchableOpacity 
          style={[styles.button, styles.stopButton]} 
          onPress={onStop}
        >
          <Text style={styles.primaryButtonText}>Stop</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.button, styles.placeholderButton]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginVertical: 30,
    paddingHorizontal: 10,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: '#34C759', // iOS Green
  },
  pauseButton: {
    backgroundColor: '#FF9500', // iOS Orange
  },
  stopButton: {
    backgroundColor: '#FF3B30', // iOS Red
  },
  secondaryButton: {
    backgroundColor: '#E5E5EA', // Light gray
  },
  placeholderButton: {
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
  },
  disabledText: {
    fontSize: 18,
    color: '#999',
    padding: 20,
  }
});

export default TimerControls;
