import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import useTimerStore, { TimerRecord,  } from '../../store/useTimerStore';
import RecordVisualization from '../../components/RecordVisualization'; // To be created next
import TransferRecordModal from '../../components/TransferRecordModal'; // To be created next

// Utility function (from index.tsx, defined in lib/utils.ts later)
const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export default function AnalysisScreen() {
    // Zustand State and Actions
    const records = useTimerStore(state => state.records);
    const categories = useTimerStore(state => state.categories);
    const deleteRecord = useTimerStore(state => state.deleteRecord);
    // Note: The action to update/transfer a record will be added to the store later.

    // Local State for Modals/Filtering
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [recordToTransfer, setRecordToTransfer] = useState<TimerRecord | null>(null);

    // --- Data Grouping/Sorting ---
    const groupedRecords = useMemo(() => {
        // Group records by category name for display
        return records.reduce((acc, record) => {
            const categoryName = record.categoryName;
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(record);
            return acc;
        }, {} as Record<string, TimerRecord[]>);
    }, [records]);

    // --- Handlers for CRUD/Transfer ---
    
    const handleDelete = (recordId: string) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this specific record?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => deleteRecord(recordId) 
                }
            ]
        );
    };

    const handleTransferStart = (record: TimerRecord) => {
        setRecordToTransfer(record);
        setIsTransferModalVisible(true);
    };
    
    // The handleTransferComplete logic will be in the TransferRecordModal

    // --- Render Components ---
    const renderRecordItem = (record: TimerRecord) => (
        <View key={record.id} style={styles.recordItem}>
            <View style={styles.recordDetails}>
                <Text style={styles.recordTime}>
                    Total Time: {formatTime(record.durationMs)}
                    {record.isPersonalBest && <Text style={styles.pbText}> (PB!)</Text>}
                </Text>
                <Text style={styles.recordDate}>
                    Date: {new Date(record.startTime).toLocaleDateString()}
                    {' at '}
                    {new Date(record.startTime).toLocaleTimeString()}
                </Text>
            </View>

            {/* 1. Visualization */}
            <RecordVisualization 
                durationMs={record.durationMs}
                lapTimes={record.laps}
                bestLapIndex={record.bestLapIndex}
            />
            
            {/* Lap details */}
            {record.laps.length > 0 && (
                <View style={styles.lapDetailsContainer}>
                    <Text style={styles.lapDetailsTitle}>Laps:</Text>
                    {record.laps.map((lapTime, idx) => (
                        <Text 
                            key={`lap-${idx}`}
                            style={[
                                styles.lapDetailText,
                                record.bestLapIndex === idx && styles.bestLapText
                            ]}
                        >
                            Lap {idx + 1}: {formatTime(lapTime)}{record.bestLapIndex === idx ? ' (Best Lap)' : ''}
                        </Text>
                    ))}
                </View>
            )}

            {/* 2. CRUD Controls */}
            <View style={styles.recordActions}>
                {/* Note: Edit functionality for time itself is complex, so we focus on Transfer/Delete */}
                <TouchableOpacity onPress={() => handleTransferStart(record)} style={styles.actionButton}>
                    <Text style={styles.actionText}>Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(record.id)} style={[styles.actionButton, styles.deleteButton]}>
                    <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCategoryGroup = ({ item: categoryName }: { item: string }) => {
        const recordsInGroup = groupedRecords[categoryName];
        if (!recordsInGroup || recordsInGroup.length === 0) return null;

        const category = categories.find(c => c.name === categoryName);
        // Default to 'asap' if timerType is not set (for backward compatibility)
        const timerType = category?.timerType || 'asap';
        const hasGoal = category && category.goalMs !== null && category.goalMs > 0;
        const currentPB = category?.personalBestMs;
        let goalProgress: number | null = null;
        if (hasGoal && currentPB && category) {
            if (timerType === 'asap') {
                // For ASAP: goal is to be faster (lower time), progress = goal / PB
                // If PB < goal, you've exceeded the goal (progress > 100%)
                goalProgress = Math.min(100, (category.goalMs! / currentPB) * 100);
            } else {
                // For Endurance: goal is to be longer (higher time), progress = PB / goal
                // If PB > goal, you've exceeded the goal (progress > 100%)
                goalProgress = Math.min(100, (currentPB / category.goalMs!) * 100);
            }
        }

        return (
            <View style={styles.categoryGroup}>
                <View style={styles.categoryHeaderContainer}>
                    <Text style={styles.categoryHeader}>{categoryName} History ({recordsInGroup.length})</Text>
                    {category && (
                        <View style={styles.categoryStats}>
                            {category.personalBestMs && (
                                <Text style={styles.categoryPB}>
                                    PB: {formatTime(category.personalBestMs)}
                                </Text>
                            )}
                            {hasGoal && (
                                <Text style={styles.categoryGoal}>
                                    Goal: {formatTime(category.goalMs!)}
                                </Text>
                            )}
                            {hasGoal && goalProgress !== null && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {goalProgress.toFixed(0)}% {timerType === 'asap' ? 'to goal' : 'of goal'}
                                    </Text>
                                </View>
                            )}
                            {timerType && (
                                <Text style={styles.timerTypeText}>
                                    {timerType === 'endurance' ? '🏃 Endurance' : '⚡ ASAP'}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
                {/* Sort records (e.g., by date descending) */}
                {recordsInGroup
                    .slice()
                    .sort((a, b) => b.startTime - a.startTime) // Newest first
                    .map(renderRecordItem)}
            </View>
        );
    };
    
    // --- Main JSX Return ---
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Timer Analysis' }} />
            
            <Text style={styles.pageTitle}>Activity Log & Analysis</Text>

            {records.length === 0 ? (
                <Text style={styles.emptyText}>No timer records found yet. Start a timer on the main screen!</Text>
            ) : (
                <FlatList
                    data={Object.keys(groupedRecords)} // Data is the array of category names
                    keyExtractor={(item) => item}
                    renderItem={renderCategoryGroup}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}

            {/* Transfer Modal */}
            {recordToTransfer && (
                <TransferRecordModal
                    isVisible={isTransferModalVisible}
                    onClose={() => setIsTransferModalVisible(false)}
                    record={recordToTransfer}
                    categories={categories}
                />
            )}
        </View>
    );
}

// --- Basic Styling ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        padding: 20,
        paddingBottom: 10,
    },
    categoryGroup: {
        marginBottom: 25,
        paddingHorizontal: 15,
    },
    categoryHeaderContainer: {
        marginBottom: 10,
    },
    categoryHeader: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        color: '#007AFF',
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF20',
        paddingBottom: 5,
    },
    categoryStats: {
        marginTop: 8,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    categoryPB: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    categoryGoal: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 4,
    },
    timerTypeText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    recordItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    recordDetails: {
        marginBottom: 10,
    },
    recordTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    pbText: {
        color: '#FF9500', // Gold/Orange for PB
        fontWeight: '800',
    },
    recordDate: {
        fontSize: 14,
        color: '#666',
    },
    lapDetailsContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
        padding: 10,
        marginVertical: 10,
    },
    lapDetailsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    lapDetailText: {
        fontSize: 12,
        color: '#666',
        marginVertical: 4,
    },
    bestLapText: {
        color: '#34C759',  // Green for best lap
        fontWeight: '600',
        fontSize: 13,
    },
    recordActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    actionButton: {
        marginLeft: 15,
    },
    actionText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
    },
    deleteButton: {
        // Optional styling for delete button wrapper
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        fontSize: 16,
        color: '#999',
    }
});