import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';

interface RecordVisualizationProps {
    durationMs: number;
    lapTimes: number[];
    bestLapIndex?: number | null;
}

// Fixed width for the visualization bars (to ensure consistent look across records)
const BAR_WIDTH = Dimensions.get('window').width - 70; 
const BAR_HEIGHT = 15;

const RecordVisualization: React.FC<RecordVisualizationProps> = ({ durationMs, lapTimes, bestLapIndex }) => {
    if (durationMs === 0) return null;

    // Calculate cumulative time for lap markers (each lap in `lapTimes` is a lap duration)
    const cumulativeLaps = lapTimes.reduce((acc: number[], lap: number) => {
        const lastTime = acc.length > 0 ? acc[acc.length - 1] : 0;
        acc.push(lastTime + lap);
        return acc;
    }, []);

    // Function to calculate the X position percentage of a time point
    const calculatePosition = (timeMs: number) => {
        // Position is relative to the total duration
        return (timeMs / durationMs) * 100;
    };
    
    // The visualization will only show the end time/lap points, not the individual pause points.
    // If a timer was paused and resumed, the durationMs is the *net* run time.
    // If you specifically need to mark a pause, you would need to modify your TimerRecord 
    // to store individual start/stop timestamps within a single run, which is significantly more complex.
    // For this assignment, marking the END of each lap is sufficient for visualization.

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Duration Timeline (Laps Marked by Vertical Lines)</Text>
            
            {/* The Main Duration Bar */}
            <View style={[styles.durationBar, { width: BAR_WIDTH }]}>
                
                {/* Map over cumulative laps to place the lap markers */}
                {cumulativeLaps
                    .map((lapCumulativeTime, originalIndex) => {
                        // Clamp and compute position percent
                        const clamped = Math.max(0, Math.min(lapCumulativeTime, durationMs));
                        const positionPercent = calculatePosition(clamped);
                        return { positionPercent, originalIndex };
                    })
                    .filter(({ positionPercent }) => !isNaN(positionPercent) && positionPercent > 0 && positionPercent <= 100)
                    .map(({ positionPercent, originalIndex }, idx) => (
                        <View
                            key={`lap-${idx}`}
                            style={[
                                styles.lapMarker,
                                {
                                    left: `${positionPercent}%`,
                                    backgroundColor: originalIndex === bestLapIndex ? '#34C759' : (idx === 0 ? '#FF3B30' : '#000'),
                                    opacity: originalIndex === bestLapIndex ? 1 : 0.9,
                                }
                            ]}
                        />
                    ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    durationBar: {
        height: BAR_HEIGHT,
        backgroundColor: '#4CAF5050', // Light green background
        borderRadius: 4,
        position: 'relative', // Crucial for absolute positioning of markers
    },
    lapMarker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2, // Thin vertical line
        backgroundColor: '#000',
        zIndex: 10,
    },
});

export default RecordVisualization;