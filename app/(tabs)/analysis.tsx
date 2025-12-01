import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { Stack } from 'expo-router';
import useTimerStore, { TimerRecord,  } from '../../store/useTimerStore';
import RecordVisualization from '../../components/RecordVisualization';
import TransferRecordModal from '../../components/TransferRecordModal';

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export default function AnalysisScreen() {
    const records = useTimerStore(state => state.records);
    const categories = useTimerStore(state => state.categories);
    const deleteRecord = useTimerStore(state => state.deleteRecord);
    const isDarkMode = useTimerStore(state => state.isDarkMode);
    const fontSizeMultiplier = useTimerStore(state => state.fontSizeMultiplier);
    const backgroundImageUri = useTimerStore(state => state.backgroundImageUri);

    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [recordToTransfer, setRecordToTransfer] = useState<TimerRecord | null>(null);

    const groupedRecords = useMemo(() => {
        return records.reduce((acc, record) => {
            const categoryName = record.categoryName;
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(record);
            return acc;
        }, {} as Record<string, TimerRecord[]>);
    }, [records]);

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

    const renderRecordItem = (record: TimerRecord) => (
        <View key={record.id} style={[styles.recordItem, isDarkMode && styles.darkRecordItem]}>
            <View style={styles.recordDetails}>
                <Text style={[styles.recordTime, isDarkMode && styles.darkRecordTime, { fontSize: 18 * fontSizeMultiplier }]}>
                    Total Time: {formatTime(record.durationMs)}
                    {record.isPersonalBest && <Text style={styles.pbText}> (PB!)</Text>}
                </Text>
                <Text style={[styles.recordDate, isDarkMode && styles.darkRecordDate, { fontSize: 14 * fontSizeMultiplier }]}>
                    Date: {new Date(record.startTime).toLocaleDateString()}
                    {' at '}
                    {new Date(record.startTime).toLocaleTimeString()}
                </Text>
            </View>

            <RecordVisualization 
                durationMs={record.durationMs}
                lapTimes={record.laps}
                bestLapIndex={record.bestLapIndex}
            />
            
            {record.laps.length > 0 && (
                <View style={[styles.lapDetailsContainer, isDarkMode && styles.darkLapDetailsContainer]}>
                    <Text style={[styles.lapDetailsTitle, isDarkMode && styles.darkLapDetailsTitle, { fontSize: 13 * fontSizeMultiplier }]}>Laps:</Text>
                    {record.laps.map((lapTime, idx) => (
                        <Text 
                            key={`lap-${idx}`}
                            style={[
                                styles.lapDetailText,
                                isDarkMode && styles.darkLapDetailText,
                                record.bestLapIndex === idx && styles.bestLapText,
                                { fontSize: 12 * fontSizeMultiplier }
                            ]}
                        >
                            Lap {idx + 1}: {formatTime(lapTime)}{record.bestLapIndex === idx ? ' (Best Lap)' : ''}
                        </Text>
                    ))}
                </View>
            )}

            <View style={styles.recordActions}>
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
        const timerType = category?.timerType || 'asap';
        const hasGoal = category && category.goalMs !== null && category.goalMs > 0;
        const currentPB = category?.personalBestMs;
        let goalProgress: number | null = null;
        if (hasGoal && currentPB && category) {
            if (timerType === 'asap') {
                goalProgress = Math.min(100, (category.goalMs! / currentPB) * 100);
            } else {
                goalProgress = Math.min(100, (currentPB / category.goalMs!) * 100);
            }
        }

        return (
            <View style={styles.categoryGroup}>
                <View style={styles.categoryHeaderContainer}>
                    <Text style={[styles.categoryHeader, isDarkMode && styles.darkCategoryHeader, { fontSize: 20 * fontSizeMultiplier }]}>{categoryName} History ({recordsInGroup.length})</Text>
                    {category && (
                        <View style={[styles.categoryStats, isDarkMode && styles.darkCategoryStats]}>
                            {category.personalBestMs && (
                                <Text style={[styles.categoryPB, isDarkMode && styles.darkCategoryPB, { fontSize: 14 * fontSizeMultiplier }]}>
                                    PB: {formatTime(category.personalBestMs)}
                                </Text>
                            )}
                            {hasGoal && (
                                <Text style={[styles.categoryGoal, isDarkMode && styles.darkCategoryGoal, { fontSize: 14 * fontSizeMultiplier }]}>
                                    Goal: {formatTime(category.goalMs!)}
                                </Text>
                            )}
                            {hasGoal && goalProgress !== null && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
                                    </View>
                                    <Text style={[styles.progressText, isDarkMode && styles.darkProgressText, { fontSize: 12 * fontSizeMultiplier }]}>
                                        {goalProgress.toFixed(0)}% {timerType === 'asap' ? 'to goal' : 'of goal'}
                                    </Text>
                                </View>
                            )}
                            {timerType && (
                                <Text style={[styles.timerTypeText, isDarkMode && styles.darkTimerTypeText, { fontSize: 12 * fontSizeMultiplier }]}>
                                    {timerType === 'endurance' ? '🏃 Endurance' : '⚡ ASAP'}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
                {recordsInGroup
                    .slice()
                    .sort((a, b) => b.startTime - a.startTime)
                    .map(renderRecordItem)}
            </View>
        );
    };
    
    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            {backgroundImageUri && (
                <ImageBackground
                    source={{ uri: backgroundImageUri }}
                    style={StyleSheet.absoluteFillObject}
                    blurRadius={3}
                />
            )}
            <Stack.Screen options={{ title: 'Timer Analysis' }} />
            
            <View style={[styles.analysisHeader, isDarkMode && styles.darkAnalysisHeader]}>
                <Text style={[styles.pageTitle, isDarkMode && styles.darkPageTitle, { fontSize: 26 * fontSizeMultiplier }]}>Activity Log & Analysis</Text>
            </View>

            {records.length === 0 ? (
                <Text style={[styles.emptyText, isDarkMode && styles.darkEmptyText]}>No timer records found yet. Start a timer on the main screen!</Text>
            ) : (
                <FlatList
                    data={Object.keys(groupedRecords)}
                    keyExtractor={(item) => item}
                    renderItem={renderCategoryGroup}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    analysisHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    darkAnalysisHeader: {
        backgroundColor: 'rgba(30, 30, 30, 0.98)',
        borderBottomColor: '#444',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        padding: 20,
        paddingBottom: 10,
        color: '#333',
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
        color: '#FF9500',
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
        color: '#34C759',
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
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        fontSize: 16,
        color: '#999',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    darkPageTitle: {
        color: '#FAFAFA',
    },
    darkEmptyText: {
        color: '#CCC',
    },
    darkRecordItem: {
        backgroundColor: '#1E1E1E',
    },
    darkRecordTime: {
        color: '#FAFAFA',
    },
    darkRecordDate: {
        color: '#AAA',
    },
    darkLapDetailsContainer: {
        backgroundColor: '#2A2A2A',
    },
    darkLapDetailsTitle: {
        color: '#E0E0E0',
    },
    darkLapDetailText: {
        color: '#BBB',
    },
    darkCategoryHeader: {
        color: '#81B0FF',
        borderBottomColor: '#81B0FF40',
    },
    darkCategoryStats: {
        backgroundColor: '#2A2A2A',
        borderColor: '#444',
    },
    darkCategoryPB: {
        color: '#AAA',
    },
    darkCategoryGoal: {
        color: '#81B0FF',
    },
    darkProgressText: {
        color: '#AAA',
    },
    darkTimerTypeText: {
        color: '#888',
    }
});