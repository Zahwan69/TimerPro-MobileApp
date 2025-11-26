import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  timeString: string;
  categoryName: string;
}
const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeString, categoryName }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.category}>{categoryName}</Text>
      <Text style={styles.time}>{timeString}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 40,
    alignItems: 'center',
  },
  category: {
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
  },
  time: {
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: 2,
    color: '#000',
  },
});

export default TimerDisplay;