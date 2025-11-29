import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { Button as RNButton } from 'react-native';
import useTimerStore, { TimerRecord, TimerCategory } from '../store/useTimerStore';

interface TransferModalProps {
  isVisible: boolean;
  onClose: () => void;
  record: TimerRecord;
  categories: TimerCategory[];
}

const TransferRecordModal: React.FC<TransferModalProps> = ({ 
  isVisible, 
  onClose, 
  record, 
  categories 
}) => {
  
  // Initialize selected ID to the record's current category ID
  const [selectedCategoryId, setSelectedCategoryId] = useState(record.categoryId);
  const transferRecord = useTimerStore(state => state.transferRecord);

  const handleTransfer = () => {
    const newCategory = categories.find(cat => cat.id === selectedCategoryId);
    
    if (newCategory) {
      // Execute the transfer action (which also re-calculates PBs)
      transferRecord(record.id, newCategory);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.header}>Transfer Record</Text>
          <Text style={styles.subHeader}>Record Time: {(record.durationMs / 1000).toFixed(2)}s</Text>
          <Text style={styles.subHeader}>Current Category: {record.categoryName}</Text>

          <Text style={styles.instruction}>Select new category:</Text>
          
          <ScrollView style={styles.categoryList}>
            {categories.map((category) => (
              <AnimatedPressable
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategoryId === category.id && styles.selectedItem,
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
                // disabled prop handled by style/logic: visually use selected state
              >
                <Text style={styles.categoryText}>
                  {category.name}
                  {category.id === record.categoryId && ' (Current)'}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <AnimatedPressable onPress={onClose}>
              <View style={[styles.actionButton, styles.dangerButton]}>
                <Text style={styles.actionText}>Cancel</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable onPress={handleTransfer}>
              <View style={[styles.actionButton, selectedCategoryId === record.categoryId && styles.disabledAction]}>
                <Text style={styles.actionText}>Confirm Transfer</Text>
              </View>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Basic Styling for the Modal ---
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    maxHeight: '80%',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  instruction: {
    marginTop: 15,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryList: {
    width: '100%',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  categoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#E6F0FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  }
  ,
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledAction: {
    opacity: 0.5,
  }
});

export default TransferRecordModal;