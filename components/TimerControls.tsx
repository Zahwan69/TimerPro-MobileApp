import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

interface TimerControlsProps {
  isRunning: boolean;
  timeElapsed: number;
  isDisabled: boolean;
  isDarkMode?: boolean;
  fontSizeMultiplier?: number;
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
  isDarkMode = false,
  fontSizeMultiplier = 1.0,
  onStart, 
  onPause, 
  onStop,
  onReset, 
  onLap 
}) => {
  
  if (isDisabled) {
    return (
      <View style={styles.controlContainer}>
        <Text style={[styles.disabledText, isDarkMode && styles.darkDisabledText, { fontSize: 16 * fontSizeMultiplier }]}>Select a Category to Start</Text>
      </View>
    );
  }

  const showStopButton = !isRunning && timeElapsed > 0;
  const showLapButton = isRunning && timeElapsed > 0;

  return (
    <View style={styles.controlContainer}>
      <AnimatedPressable onPress={showLapButton ? onLap : onReset}>
        <View style={[styles.button, styles.secondaryButton]}>
          <Text style={[styles.secondaryButtonText, { fontSize: 16 * fontSizeMultiplier }]}>
            {showLapButton ? 'Lap' : 'Reset'}
          </Text>
        </View>
      </AnimatedPressable>

      {/* Center Button: Start/Pause */}
      <AnimatedPressable onPress={isRunning ? onPause : onStart}>
        <View style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]}> 
          <Text style={[styles.primaryButtonText, { fontSize: 16 * fontSizeMultiplier }]}>
            {isRunning ? 'Pause' : (timeElapsed > 0 ? 'Resume' : 'Start')}
          </Text>
        </View>
      </AnimatedPressable>

      {/* Right Button:  (when paused) or placeholder */}
      {showStopButton ? (
        <AnimatedPressable onPress={onStop}>
          <View style={[styles.button, styles.stopButton]}> 
            <Text style={[styles.primaryButtonText, { fontSize: 16 * fontSizeMultiplier }]}>Save</Text>
          </View>
        </AnimatedPressable>
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
    backgroundColor: '#228B22', // iOS Green
  },
  pauseButton: {
    backgroundColor: '#FF8C00', // iOS Orange
  },
  stopButton: {
    backgroundColor: '#FF8C00', // iOS Red
  },
  secondaryButton: {
    backgroundColor: '#FF0000', // Light gray
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
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  disabledText: {
    fontSize: 18,
    color: '#999',
    padding: 20,
  },
  darkDisabledText: {
    color: '#666',
  }
});

export default TimerControls;
