import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert,
  Modal 
} from 'react-native';
import useTimerStore, { TimerCategory, TimerRecord } from '../../store/useTimerStore';
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
    currentLaps, 
    categories,
    records,
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
  } = useTimerStore();

  // Local state for UI
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
        const startTime = Date.now() - timeElapsed;
        interval = setInterval(() => {
            useTimerStore.setState({ timeElapsed: Date.now() - startTime });
        }, 10);
    } 

    return () => {
        if (interval !== null) {
            clearInterval(interval);
        }
    };
  }, [isRunning, timeElapsed]);

  // Handle pause - just pause, don't save
  const handlePause = () => {
    pauseTimer();
  };

  // Handle stop - stop timer and show save dialog
  const handleStop = () => {
    pauseTimer();
    if (timeElapsed > 0) {
      setSaveCategoryName('');
      setCategorySearchQuery('');
      setShowSaveDialog(true);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Handle category selection from list
  const handleSelectCategory = (categoryName: string) => {
    setSaveCategoryName(categoryName);
    setCategorySearchQuery(categoryName);
  };

  // Handle transfer record
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

  // Filter categories for transfer (exclude current category)
  const filteredTransferCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(transferSearchQuery.toLowerCase());
    const isNotCurrentCategory = recordToTransfer ? cat.id !== recordToTransfer.categoryId : true;
    return matchesSearch && isNotCurrentCategory;
  });

  // Handle save timer
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

  // Handle reset
  const handleReset = () => {
    if (!isRunning) {
      if (timeElapsed > 0) {
        // Show confirmation if there's time to lose
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
        // If timer is at 0, just reset without confirmation
        resetTimer();
        setShowSaveDialog(false);
      }
    }
  };

  // Category CRUD handlers
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

  // Get records grouped by category
  const getRecordsByCategory = (categoryId: string) => {
    return records.filter(r => r.categoryId === categoryId);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Timer' }} />
      
      {/* Timer Display */}
      <TimerDisplay 
        timeString={formatTime(timeElapsed)} 
        categoryName={currentCategory?.name || 'Timer'}
      />
      
      {/* Personal Best Display */}
      {currentCategory && currentCategory.personalBestMs && (
        <View style={styles.pbContainer}>
          <Text style={styles.pbLabel}>Personal Best:</Text>
          <Text style={styles.pbTime}>
            {formatTime(currentCategory.personalBestMs)}
          </Text>
        </View>
      )}

      {/* Timer Controls */}
      <TimerControls 
        isRunning={isRunning} 
        timeElapsed={timeElapsed}
        onStart={() => startTimer(currentCategory)} 
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset} 
        onLap={addLap}
        isDisabled={false}
      />

      {/* Save Timer Dialog */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Timer</Text>
            <Text style={styles.modalSubtitle}>
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
              {/* Searchable Category List - shows when typing */}
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
                        No categories found. Will create new category "{categorySearchQuery}"
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

      {/* Transfer Record Modal */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer Record</Text>
            {recordToTransfer && (
              <>
                <Text style={styles.modalSubtitle}>
                  Time: {formatTime(recordToTransfer.durationMs)}
                </Text>
                <Text style={styles.modalSubtitle}>
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
              {/* Searchable Category List for Transfer - shows when typing */}
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
                        No categories found matching "{transferSearchQuery}"
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

      {/* Categories and Timers List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {/* Add Category Section */}
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

        {/* Categories List */}
        {categories.map((category) => {
          const categoryRecords = getRecordsByCategory(category.id);
          const isEditing = editingCategoryId === category.id;
          
          return (
            <View key={category.id} style={styles.categoryCard}>
              {/* Category Header */}
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
                        {category.personalBestMs && (
                          <Text style={styles.categoryPB}>
                            PB: {formatTime(category.personalBestMs)}
                          </Text>
                        )}
                        <Text style={styles.recordCount}>
                          {categoryRecords.length} record{categoryRecords.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.categoryActions}>
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

              {/* Records for this category */}
              {categoryRecords.length > 0 && (
                <View style={styles.recordsContainer}>
                  {categoryRecords
                    .slice()
                    .sort((a, b) => b.startTime - a.startTime)
                    .slice(0, 5) // Show last 5 records
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
    padding: 24,
    width: '80%',
    maxWidth: 400,
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
});
