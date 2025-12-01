import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert,
  Modal,
  ImageBackground 
} from 'react-native';
import useTimerStore, { TimerCategory, TimerRecord, TimerType } from '../../store/useTimerStore';
import TimerControls from '../../components/TimerControls';
import TimerDisplay from '../../components/TimerDisplay';
import { Stack } from 'expo-router';

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export default function TimerScreen() {
  const { 
    isRunning, 
    timeElapsed, 
    currentCategory, 
    categories,
    records,
    isDarkMode,
    fontSizeMultiplier,
    backgroundImageUri,
    startTimer, 
    pauseTimer, 
    resetTimer, 
    addLap, 
    setCurrentCategory,
    saveTimer,
    addCategory,
    editCategory,
    deleteCategory,
    deleteRecord,
    transferRecord,
    setCategoryGoal,
    setCategoryTimerType,
  } = useTimerStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveCategoryName, setSaveCategoryName] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recordToTransfer, setRecordToTransfer] = useState<TimerRecord | null>(null);
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [categoryForSettings, setCategoryForSettings] = useState<TimerCategory | null>(null);
  const [goalHours, setGoalHours] = useState('0');
  const [goalMinutes, setGoalMinutes] = useState('0');
  const [goalSeconds, setGoalSeconds] = useState('0');
  const [displayTime, setDisplayTime] = useState(0);

  const timeElapsedRef = useRef(timeElapsed);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    timeElapsedRef.current = timeElapsed;
  }, [timeElapsed]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
        if (startTimeRef.current === null) {
            startTimeRef.current = Date.now() - timeElapsedRef.current;
        }
        
        interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current!;
            timeElapsedRef.current = elapsed;
            setDisplayTime(elapsed);
        }, 30);
    } else {
        if (timeElapsedRef.current > 0) {
            useTimerStore.setState({ timeElapsed: timeElapsedRef.current });
        }
        startTimeRef.current = null;
    }

    return () => {
        if (interval !== null) {
            clearInterval(interval);
        }
    };
  }, [isRunning]);

  useEffect(() => {
    if (categoryForSettings) {
      const updatedCategory = categories.find(c => c.id === categoryForSettings.id);
      if (updatedCategory && updatedCategory !== categoryForSettings) {
        setCategoryForSettings(updatedCategory);
        if (updatedCategory.goalMs) {
          const totalSeconds = Math.floor(updatedCategory.goalMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          setGoalHours(hours.toString());
          setGoalMinutes(minutes.toString());
          setGoalSeconds(seconds.toString());
        }
      }
    }
  }, [categories, categoryForSettings]);

  const handlePause = () => {
    pauseTimer();
  };

  const handleStop = () => {
    pauseTimer();
    if (timeElapsed > 0) {
      setSaveCategoryName('');
      setCategorySearchQuery('');
      setShowSaveDialog(true);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const handleSelectCategory = (categoryName: string) => {
    setSaveCategoryName(categoryName);
    setCategorySearchQuery(categoryName);
  };

  const handleStartTransfer = (record: TimerRecord) => {
    setRecordToTransfer(record);
    setTransferSearchQuery('');
    setShowTransferModal(true);
  };

  const handleTransfer = (targetCategory: TimerCategory) => {
    if (recordToTransfer && targetCategory.id !== recordToTransfer.categoryId) {
      transferRecord(recordToTransfer.id, targetCategory);
      setShowTransferModal(false);
      setRecordToTransfer(null);
      setTransferSearchQuery('');
      Alert.alert('Success', `Record transferred to ${targetCategory.name}`);
    } else {
      Alert.alert('Error', 'Please select a different category');
    }
  };

  const filteredTransferCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(transferSearchQuery.toLowerCase());
    const isNotCurrentCategory = recordToTransfer ? cat.id !== recordToTransfer.categoryId : true;
    return matchesSearch && isNotCurrentCategory;
  });

  const handleSaveTimer = () => {
    if (saveCategoryName.trim()) {
      saveTimer(saveCategoryName.trim());
      setShowSaveDialog(false);
      setSaveCategoryName('');
      setCategorySearchQuery('');
      Alert.alert('Success', 'Timer saved!');
    } else {
      Alert.alert('Error', 'Please enter a category name');
    }
  };

  const handleReset = () => {
    if (!isRunning) {
      if (timeElapsed > 0) {
        Alert.alert(
          'Reset Timer',
          'Are you sure you want to reset? This will discard the current time.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reset', 
              style: 'destructive',
              onPress: () => {
                resetTimer();
                setShowSaveDialog(false);
              }
            }
          ]
        );
      } else {
        resetTimer();
        setShowSaveDialog(false);
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const handleStartEdit = (category: TimerCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveEdit = () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      editCategory(editingCategoryId, editingCategoryName.trim());
      setEditingCategoryId(null);
      setEditingCategoryName('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure? All records in this category will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCategory(id)
        }
      ]
    );
  };

  const getRecordsByCategory = (categoryId: string) => {
    return records.filter(r => r.categoryId === categoryId);
  };

  const handleOpenCategorySettings = (category: TimerCategory) => {
    setCategoryForSettings(category);
    if (category.goalMs) {
      const totalSeconds = Math.floor(category.goalMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setGoalHours(hours.toString());
      setGoalMinutes(minutes.toString());
      setGoalSeconds(seconds.toString());
    } else {
      setGoalHours('0');
      setGoalMinutes('0');
      setGoalSeconds('0');
    }
    setShowCategorySettings(true);
  };

  const handleSaveGoal = () => {
    if (categoryForSettings) {
      const hours = parseInt(goalHours) || 0;
      const minutes = parseInt(goalMinutes) || 0;
      const seconds = parseInt(goalSeconds) || 0;
      const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      setCategoryGoal(categoryForSettings.id, totalMs > 0 ? totalMs : null);
      const updatedCategory = categories.find(c => c.id === categoryForSettings.id);
      if (updatedCategory) {
        setCategoryForSettings(updatedCategory);
      }
      Alert.alert('Success', 'Goal updated!');
    }
  };

  const handleSetTimerType = (timerType: TimerType) => {
    if (categoryForSettings) {
      setCategoryTimerType(categoryForSettings.id, timerType);
      setTimeout(() => {
        const updatedCategory = categories.find(c => c.id === categoryForSettings.id);
        if (updatedCategory) {
          setCategoryForSettings(updatedCategory);
        }
      }, 100);
      Alert.alert('Success', `Timer type set to ${timerType === 'asap' ? 'ASAP' : 'Endurance'}`);
    }
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
      <Stack.Screen options={{ title: 'Timer' }} />
      
      <View style={[styles.timerHeader, isDarkMode && styles.darkTimerHeader]}>
        <TimerDisplay 
          timeString={formatTime(displayTime)} 
          categoryName={currentCategory?.name || 'Timer'}
          isDarkMode={isDarkMode}
          fontSizeMultiplier={fontSizeMultiplier}
        />
        
        {currentCategory && currentCategory.personalBestMs && (
          <View style={styles.pbContainer}>
            <Text style={[styles.pbLabel, isDarkMode && styles.darkPbLabel]}>Personal Best:</Text>
            <Text style={styles.pbTime}>
              {formatTime(currentCategory.personalBestMs)}
            </Text>
          </View>
        )}
      </View>

      <TimerControls 
        isRunning={isRunning} 
        timeElapsed={displayTime}
        isDarkMode={isDarkMode}
        fontSizeMultiplier={fontSizeMultiplier}
        onStart={() => startTimer(currentCategory)} 
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset} 
        onLap={addLap}
        isDisabled={false}
      />

      <Modal
        visible={showSaveDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSaveDialog(false);
          setCategorySearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>Save Timer</Text>
            <Text style={[styles.modalSubtitle, isDarkMode && styles.darkModalSubtitle]}>
              Time: {formatTime(timeElapsed)}
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Search or enter category name"
                value={categorySearchQuery}
                onChangeText={(text) => {
                  setCategorySearchQuery(text);
                  setSaveCategoryName(text);
                }}
                autoFocus
                autoComplete="off"
                autoCorrect={false}
              />
              {categorySearchQuery.length > 0 && (
                <>
                  {filteredCategories.length > 0 ? (
                    <ScrollView 
                      style={styles.categoryDropdown}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={styles.categoryDropdownItem}
                          onPress={() => handleSelectCategory(category.name)}
                        >
                          <Text style={styles.categoryDropdownText}>{category.name}</Text>
                          {category.personalBestMs && (
                            <Text style={styles.categoryDropdownPB}>
                              PB: {formatTime(category.personalBestMs)}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : categories.length > 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No categories found. Will create new category &quot;{categorySearchQuery}&quot;
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSaveDialog(false);
                  setCategorySearchQuery('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTimer}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowTransferModal(false);
          setRecordToTransfer(null);
          setTransferSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>Transfer Record</Text>
            {recordToTransfer && (
              <>
                <Text style={[styles.modalSubtitle, isDarkMode && styles.darkModalSubtitle]}>
                  Time: {formatTime(recordToTransfer.durationMs)}
                </Text>
                <Text style={[styles.modalSubtitle, isDarkMode && styles.darkModalSubtitle]}>
                  From: {recordToTransfer.categoryName}
                </Text>
              </>
            )}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Search category to transfer to"
                value={transferSearchQuery}
                onChangeText={setTransferSearchQuery}
                autoFocus
                autoComplete="off"
                autoCorrect={false}
              />
              {transferSearchQuery.length > 0 && (
                <>
                  {filteredTransferCategories.length > 0 ? (
                    <ScrollView 
                      style={styles.categoryDropdown}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredTransferCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={styles.categoryDropdownItem}
                          onPress={() => handleTransfer(category)}
                        >
                          <Text style={styles.categoryDropdownText}>{category.name}</Text>
                          {category.personalBestMs && (
                            <Text style={styles.categoryDropdownPB}>
                              PB: {formatTime(category.personalBestMs)}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No categories found matching &quot;{transferSearchQuery}&quot;
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTransferModal(false);
                  setRecordToTransfer(null);
                  setTransferSearchQuery('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategorySettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCategorySettings(false);
          setCategoryForSettings(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>Category Settings</Text>
            {categoryForSettings && (() => {
              const currentCategory = categories.find(c => c.id === categoryForSettings.id) || categoryForSettings;
              return (
                <>
                  <Text style={[styles.modalSubtitle, isDarkMode && styles.darkModalSubtitle]}>{currentCategory.name}</Text>
                  
                  <ScrollView 
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    <View style={styles.settingsSection}>
                      <Text style={styles.settingsLabel}>Timer Type</Text>
                      <View style={styles.timerTypeButtons}>
                        <TouchableOpacity
                          style={[
                            styles.timerTypeButton,
                            (currentCategory.timerType || 'asap') === 'asap' && styles.timerTypeButtonActive
                          ]}
                          onPress={() => handleSetTimerType('asap')}
                        >
                          <Text style={[
                            styles.timerTypeButtonText,
                            (currentCategory.timerType || 'asap') === 'asap' && styles.timerTypeButtonTextActive
                          ]}>
                            ⚡ ASAP (Fastest Wins)
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.timerTypeButton,
                            (currentCategory.timerType || 'asap') === 'endurance' && styles.timerTypeButtonActive
                          ]}
                          onPress={() => handleSetTimerType('endurance')}
                        >
                          <Text style={[
                            styles.timerTypeButtonText,
                            (currentCategory.timerType || 'asap') === 'endurance' && styles.timerTypeButtonTextActive
                          ]}>
                            🏃 Endurance (Longest Wins)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.settingsSection}>
                      <Text style={styles.settingsLabel}>Goal Time</Text>
                      <View style={styles.goalInputContainer}>
                        <View style={styles.goalInputGroup}>
                          <Text style={styles.goalInputLabel}>Hours</Text>
                          <TextInput
                            style={styles.goalInput}
                            value={goalHours}
                            onChangeText={setGoalHours}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.goalInputGroup}>
                          <Text style={styles.goalInputLabel}>Minutes</Text>
                          <TextInput
                            style={styles.goalInput}
                            value={goalMinutes}
                            onChangeText={setGoalMinutes}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                        </View>
                        <View style={styles.goalInputGroup}>
                          <Text style={styles.goalInputLabel}>Seconds</Text>
                          <TextInput
                            style={styles.goalInput}
                            value={goalSeconds}
                            onChangeText={setGoalSeconds}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.saveButton, { marginTop: 10 }]}
                        onPress={handleSaveGoal}
                      >
                        <Text style={styles.saveButtonText}>Set Goal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, { marginTop: 8 }]}
                        onPress={() => {
                          if (categoryForSettings) {
                            setCategoryGoal(categoryForSettings.id, null);
                            setShowCategorySettings(false);
                            setCategoryForSettings(null);
                          }
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Clear Goal</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              );
            })()}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCategorySettings(false);
                  setCategoryForSettings(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.addCategoryButton}
            onPress={() => setShowAddCategory(!showAddCategory)}
          >
            <Text style={styles.addCategoryText}>
              {showAddCategory ? '−' : '+'} Add Category
            </Text>
          </TouchableOpacity>
          
          {showAddCategory && (
            <View style={styles.addCategoryForm}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <View style={styles.addCategoryActions}>
                <TouchableOpacity 
                  style={[styles.smallButton, styles.cancelSmallButton]}
                  onPress={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.smallButton, styles.saveSmallButton]}
                  onPress={handleAddCategory}
                >
                  <Text style={[styles.smallButtonText, { color: '#fff' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {categories.map((category) => {
          const categoryRecords = getRecordsByCategory(category.id);
          const isEditing = editingCategoryId === category.id;
          
          return (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                {isEditing ? (
                  <View style={styles.editCategoryForm}>
                    <TextInput
                      style={styles.categoryInput}
                      value={editingCategoryName}
                      onChangeText={setEditingCategoryName}
                      autoFocus
                    />
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={handleSaveEdit}
                    >
                      <Text style={styles.iconButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName('');
                      }}
                    >
                      <Text style={styles.iconButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.categoryNameButton}
                      onPress={() => setCurrentCategory(category)}
                    >
                      <View style={styles.categoryNameContainer}>
                        <Text style={[
                          styles.categoryName,
                          currentCategory?.id === category.id && styles.activeCategoryName
                        ]}>
                          {category.name}
                        </Text>
                        <View style={styles.categoryInfo}>
                          {category.personalBestMs && (
                            <Text style={styles.categoryPB}>
                              PB: {formatTime(category.personalBestMs)}
                            </Text>
                          )}
                          {category.goalMs && (
                            <Text style={styles.categoryGoal}>
                              Goal: {formatTime(category.goalMs)}
                            </Text>
                          )}
                          <Text style={styles.timerTypeBadge}>
                            {category.timerType === 'endurance' ? '🏃 Endurance' : '⚡ ASAP'}
                          </Text>
                          <Text style={styles.recordCount}>
                            {categoryRecords.length} record{categoryRecords.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => handleOpenCategorySettings(category)}
                      >
                        <Text style={styles.iconButtonText}>⚙</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => handleStartEdit(category)}
                      >
                        <Text style={styles.iconButtonText}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => handleDeleteCategory(category.id)}
                      >
                        <Text style={[styles.iconButtonText, { color: '#FF3B30' }]}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {categoryRecords.length > 0 && (
                <View style={styles.recordsContainer}>
                  {categoryRecords
                    .slice()
                    .sort((a, b) => b.startTime - a.startTime)
                    .slice(0, 5)
                    .map((record) => (
                      <View key={record.id} style={styles.recordItem}>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordTime}>
                            {formatTime(record.durationMs)}
                            {record.isPersonalBest && (
                              <Text style={styles.pbBadge}> PB</Text>
                            )}
                          </Text>
                          <Text style={styles.recordDate}>
                            {new Date(record.startTime).toLocaleDateString()} {new Date(record.startTime).toLocaleTimeString()}
                          </Text>
                        </View>
                        <View style={styles.recordActions}>
                          <TouchableOpacity 
                            style={styles.transferRecordButton}
                            onPress={() => handleStartTransfer(record)}
                          >
                            <Text style={styles.transferRecordText}>↗</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteRecordButton}
                            onPress={() => {
                              Alert.alert(
                                'Delete Record',
                                'Are you sure?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  { 
                                    text: 'Delete', 
                                    style: 'destructive',
                                    onPress: () => deleteRecord(record.id)
                                  }
                                ]
                              );
                            }}
                          >
                            <Text style={styles.deleteRecordText}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  {categoryRecords.length > 5 && (
                    <Text style={styles.moreRecordsText}>
                      +{categoryRecords.length - 5} more records
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  timerHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  darkTimerHeader: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderBottomColor: '#444',
  },
  pbContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  pbLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  darkPbLabel: {
    color: '#AAA',
  },
  pbTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  addCategoryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCategoryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addCategoryForm: {
    marginTop: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  addCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelSmallButton: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  saveSmallButton: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryNameButton: {
    flex: 1,
  },
  categoryNameContainer: {
    flex: 1,
  },
  categoryInfo: {
    marginTop: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activeCategoryName: {
    color: '#007AFF',
  },
  categoryPB: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  categoryGoal: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
    fontWeight: '600',
  },
  timerTypeBadge: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  recordCount: {
    fontSize: 12,
    color: '#999',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  editCategoryForm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transferRecordButton: {
    padding: 8,
  },
  transferRecordText: {
    fontSize: 18,
    color: '#007AFF',
  },
  recordInfo: {
    flex: 1,
  },
  recordTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  pbBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '800',
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteRecordButton: {
    padding: 8,
  },
  deleteRecordText: {
    fontSize: 16,
  },
  moreRecordsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    paddingBottom: 16,
  },
  modalScrollView: {
    maxHeight: 400,
    marginVertical: 10,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoryDropdown: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    marginTop: -1,
    marginBottom: 8,
  },
  categoryDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryDropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryDropdownPB: {
    fontSize: 12,
    color: '#666',
  },
  noResultsContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  timerTypeButtons: {
    gap: 10,
  },
  timerTypeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  timerTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },
  timerTypeButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  timerTypeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  goalInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  goalInputGroup: {
    flex: 1,
  },
  goalInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  darkModalContent: {
    backgroundColor: '#1E1E1E',
  },
  darkModalTitle: {
    color: '#FAFAFA',
  },
  darkModalSubtitle: {
    color: '#CCC',
  },
});
