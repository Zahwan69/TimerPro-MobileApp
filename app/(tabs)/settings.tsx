import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView,     Button, Platform, Image, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import useTimerStore from '../../store/useTimerStore';
import * as ImagePicker from 'expo-image-picker'; 
import SettingOption from '../../components/SettingOption';
import Slider from '@react-native-community/slider';

async function requestImagePickerPermissions() {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need photo library permissions to set a background image.');
            return false;
        }
    }
    return true;
}

export default function SettingsScreen() {
    const { 
      isDarkMode, fontSizeMultiplier, backgroundImageUri, userProfile,
      setUserProfile, setDarkMode, setFontSizeMultiplier, setBackgroundImageUri 
    } = useTimerStore(state => ({
      isDarkMode: state.isDarkMode, fontSizeMultiplier: state.fontSizeMultiplier, backgroundImageUri: state.backgroundImageUri,
      userProfile: state.userProfile, setUserProfile: state.setUserProfile,
      setDarkMode: (isDark: boolean) => useTimerStore.setState({ isDarkMode: isDark }),
      setFontSizeMultiplier: (multiplier: number) => useTimerStore.setState({ fontSizeMultiplier: multiplier }),
      setBackgroundImageUri: (uri: string | null) => useTimerStore.setState({ backgroundImageUri: uri }),
    }));
    
    const [tempFontSize, setTempFontSize] = useState(fontSizeMultiplier);
    const [tempUserName, setTempUserName] = useState(userProfile.name);

    const pickImage = async () => {
        if (!await requestImagePickerPermissions()) return;
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setBackgroundImageUri(result.assets[0].uri);
        }
    };
    
    const resetImage = () => { setBackgroundImageUri(null); };
    
    const saveUserName = () => {
        if (tempUserName.trim()) {
            setUserProfile(tempUserName);
            Alert.alert("Profile Updated", `Welcome, ${tempUserName}!`);
        } else {
            Alert.alert("Input Required", "Please enter a valid name.");
        }
    };

    const containerStyle = [styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer];
    const textStyle = { color: isDarkMode ? '#FAFAFA' : '#333' };
    
    return (
        <View style={containerStyle}>
            <Stack.Screen options={{ title: 'App Settings' }} />
            
            {backgroundImageUri && (
                <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFillObject} blurRadius={3} />
            )}

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                
                <Text style={[styles.sectionHeader, textStyle]}>👤 User Profile</Text>
                <View style={[styles.settingBlock, isDarkMode ? styles.darkBlock : styles.lightBlock]}>
                    <SettingOption title="Your Name">
                        <View style={styles.nameInputContainer}>
                            <TextInput
                                style={[styles.nameInput, textStyle]}
                                value={tempUserName} onChangeText={setTempUserName} placeholder="Enter Name"
                                placeholderTextColor={isDarkMode ? '#bbb' : '#999'}
                            />
                            <Button title="Save" onPress={saveUserName} />
                        </View>
                    </SettingOption>
                    <View style={styles.currentProfile}>
                        <Text style={[textStyle, {fontSize: 14}]}>
                            Status: {userProfile.isProfileSetup ? 'Setup Complete' : 'Guest Mode'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.sectionHeader, textStyle]}>🎨 Appearance</Text>
                <View style={[styles.settingBlock, isDarkMode ? styles.darkBlock : styles.lightBlock]}>
                    
                    <SettingOption title="Dark Mode">
                        <Switch value={isDarkMode} onValueChange={setDarkMode} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"} />
                    </SettingOption>

                    <SettingOption title={`Font Size (Current: ${tempFontSize.toFixed(1)}x)`}>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={{ width: 150 }} minimumValue={0.8} maximumValue={1.5} step={0.1} value={tempFontSize}
                                onValueChange={setTempFontSize} onSlidingComplete={setFontSizeMultiplier} 
                                minimumTrackTintColor={isDarkMode ? '#81b0ff' : '#007AFF'} maximumTrackTintColor={isDarkMode ? '#444' : '#d3d3d3'}
                            />
                        </View>
                    </SettingOption>
                    
                    <SettingOption title="Custom Background">
                        <View style={styles.imageButtons}>
                            <Button title="Select Image" onPress={pickImage} />
                            {backgroundImageUri && (
                                <View style={{ marginLeft: 10 }}>
                                    <Button title="Reset" onPress={resetImage} color="#FF3B30" />
                                </View>
                            )}
                        </View>
                    </SettingOption>
                </View>

                <Text style={[{ marginTop: 30, textAlign: 'center' }, textStyle, { fontSize: 16 * fontSizeMultiplier }]}>
                    *This text shows the font size scaling.*
                </Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, },
    lightContainer: { backgroundColor: '#fff', },
    darkContainer: { backgroundColor: '#121212', },
    scrollView: { flex: 1, backgroundColor: 'transparent', },
    contentContainer: { paddingVertical: 20, },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10, paddingHorizontal: 20, },
    settingBlock: { borderRadius: 10, marginHorizontal: 15, overflow: 'hidden', },
    lightBlock: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', },
    darkBlock: { backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', },
    sliderContainer: { width: 150, },
    imageButtons: { flexDirection: 'row', alignItems: 'center', },
    nameInputContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', },
    nameInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', width: '50%', marginRight: 10, paddingVertical: 2, textAlign: 'right', fontSize: 16, },
    currentProfile: { padding: 10, paddingHorizontal: 20, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e0e0e0', }
});