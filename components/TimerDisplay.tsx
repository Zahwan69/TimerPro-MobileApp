import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  timeString: string;
  categoryName: string;
  isDarkMode?: boolean;
  fontSizeMultiplier?: number;
}
const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeString, 
  categoryName, 
  isDarkMode = false,
  fontSizeMultiplier = 1.0 
}) => {
  const categoryColor = isDarkMode ? '#E0E0E0' : '#333';
  const timeColor = isDarkMode ? '#FAFAFA' : '#000';

  return (
    <View style={styles.container}>
      <Text style={[styles.category, { color: categoryColor, fontSize: 20 * fontSizeMultiplier }]}>
        {categoryName}
      </Text>
      <Text style={[styles.time, { color: timeColor, fontSize: 72 * fontSizeMultiplier }]}>
        {timeString}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 40,
    alignItems: 'center',
  },
  category: {
    fontWeight: '600',
    marginBottom: 10,
  },
  time: {
    fontWeight: '200',
    letterSpacing: 2,
  },
});

export default TimerDisplay;