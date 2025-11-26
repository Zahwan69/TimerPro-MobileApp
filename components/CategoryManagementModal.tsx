// components/CategoryManagementModal.tsx

import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import useTimerStore, { TimerCategory } from '../store/useTimerStore';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectCategory: (category: TimerCategory) => void;
  currentSelectedCategory: TimerCategory | null;
}

const CategoryManagementModal: React.FC<ModalProps> = ({ 
  isVisible, 
  onClose, 
  onSelectCategory,
  currentSelectedCategory 
}) => {
  
  // Zustand state and actions
  const categories = useTimerStore(state => state.categories);
  const addCategory = useTimerStore(state => state.addCategory);
  const editCategory = useTimerStore(state => state.editCategory);
  const deleteCategory = useTimerStore(state => state.deleteCategory);

  // Local state for forms and editing
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // --- Handlers ---
  
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName);
      setNewCategoryName('');
    } else {
      Alert.alert("Input Required", "Please enter a name for the new category.");
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this category? All associated timer records will also be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteCategory(id) 
        }
      ]
    );
  };
  
  const startEdit = (category: TimerCategory) => {
    setEditCategoryId(category.id);
    setEditCategoryName(category.name);
    setIsEditing(true);
  };

  const finishEdit = () => {
    if (editCategoryId && editCategoryName.trim()) {
      editCategory(editCategoryId, editCategoryName);
    }
    // Reset editing state
    setIsEditing(false);
    setEditCategoryId(null);
    setEditCategoryName('');
  };

  const handleSelect = (category: TimerCategory) => {
    onSelectCategory(category);
    onClose(); // Close the modal after selection
  };
  
  // --- Render Item for the FlatList ---
  const renderCategoryItem = ({ item }: { item: TimerCategory }) => {
    const isSelected = item.id === currentSelectedCategory?.id;
    
    // Render Edit Input if currently editing this item
    if (isEditing && item.id === editCategoryId) {
      return (
        <View style={styles.editContainer}>
          <TextInput 
            style={[styles.input, styles.editInput]}
            value={editCategoryName}
            onChangeText={setEditCategoryName}
            autoFocus
            placeholder="New Category Name"
          />
          <Button title="Save" onPress={finishEdit} />
          <Button title="Cancel" onPress={() => setIsEditing(false)} color="#999" />
        </View>
      );
    }
    
    // Render Standard Item
    return (
      <View style={[styles.categoryItem, isSelected && styles.selectedItem]}>
        <TouchableOpacity 
          style={styles.selectButton} 
          onPress={() => handleSelect(item)}
        >
          <Text style={styles.categoryName}>
            {item.name} {isSelected ? ' (Active)' : ''}
          </Text>
          <Text style={styles.categoryPB}>
            PB: {item.personalBestMs ? (item.personalBestMs / 1000).toFixed(2) + 's' : 'N/A'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.actions}>
          {/* Edit Button */}
          <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          {/* Delete Button */}
          <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
          
          {/* NOTE: 'Transfer Timer' functionality (moving a record) will be handled in the Analysis screen,
             as it relates to managing existing records, not the category definition itself. */}
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContent}>
        <Text style={styles.header}>Category Management (CRUD)</Text>
        
        {/* CREATE (Add New Category) */}
        <View style={styles.addSection}>
          <TextInput
            style={styles.input}
            placeholder="Enter new category name (e.g., 100m Sprint)"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <Button title="Add Category" onPress={handleAddCategory} />
        </View>

        {/* READ/UPDATE/DELETE (Category List) */}
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No categories found. Add one above!</Text>}
        />
        
        <View style={styles.closeButtonContainer}>
          <Button title="Done & Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

// --- Basic Styling for the Modal ---
const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  addSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#E6F0FF', // Light blue background for active category
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  selectButton: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categoryPB: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionButton: {
    marginLeft: 15,
  },
  actionText: {
    color: '#007AFF',
    fontSize: 15,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFAE6', // Light yellow for editing state
  },
  editInput: {
    flex: 1,
    marginRight: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  closeButtonContainer: {
    marginBottom: 20,
  }
});

export default CategoryManagementModal;