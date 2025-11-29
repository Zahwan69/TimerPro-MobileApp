import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Platform, Image, TextInput, Alert } from 'react-native';
import AnimatedPressable from '../../components/AnimatedPressable';
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
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
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
    const textStyle = { color: isDarkMode ? '#FFFFFF' : '#000000' };
    const textBgStyle = {
        backgroundColor: isDarkMode ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: isDarkMode ? '#444' : '#E6E6E6',
    };
    
    return (
        <View style={containerStyle}>
            <Stack.Screen options={{ title: 'App Settings' }} />
            
            {backgroundImageUri && (
                <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFillObject} blurRadius={3} />
            )}

            <View style={[styles.settingsHeader, isDarkMode && styles.darkSettingsHeader]}>
                <Text style={[styles.headerTitle, textStyle, textBgStyle, { fontSize: 22 * fontSizeMultiplier }]}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                
                <Text style={[styles.sectionHeader, textStyle, { fontSize: 20 * fontSizeMultiplier }, textBgStyle]}>👤 User Profile</Text>
                <View style={[styles.settingBlock, isDarkMode ? styles.darkBlock : styles.lightBlock]}>
                    <SettingOption isDarkMode={isDarkMode} fontSizeMultiplier={fontSizeMultiplier} title="Your Name">
                        <View style={styles.nameInputContainer}>
                            <TextInput
                                style={[styles.nameInput, textStyle, { fontSize: 16 * fontSizeMultiplier }]}
                                value={tempUserName} onChangeText={setTempUserName} placeholder="Enter Name"
                                placeholderTextColor={isDarkMode ? '#bbb' : '#999'}
                            />
                            <AnimatedPressable onPress={saveUserName}>
                                <View style={styles.button}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </View>
                            </AnimatedPressable>
                        </View>
                    </SettingOption>
                    <View style={styles.currentProfile}>
                        <Text style={[textStyle, {fontSize: 14 * fontSizeMultiplier}]}> 
                            Status: {userProfile.isProfileSetup ? 'Setup Complete' : 'Guest Mode'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.sectionHeader, textStyle, { fontSize: 20 * fontSizeMultiplier }, textBgStyle]}>🎨 Appearance</Text>
                <View style={[styles.settingBlock, isDarkMode ? styles.darkBlock : styles.lightBlock]}>
                    
                    <SettingOption isDarkMode={isDarkMode} fontSizeMultiplier={fontSizeMultiplier} title="Dark Mode">
                        <Switch value={isDarkMode} onValueChange={setDarkMode} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"} />
                    </SettingOption>

                    <SettingOption isDarkMode={isDarkMode} fontSizeMultiplier={fontSizeMultiplier} title={`Font Size (Current: ${tempFontSize.toFixed(1)}x)`}>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={{ width: 150 }} minimumValue={0.8} maximumValue={1.5} step={0.1} value={tempFontSize}
                                onValueChange={setTempFontSize} onSlidingComplete={setFontSizeMultiplier} 
                                minimumTrackTintColor={isDarkMode ? '#81b0ff' : '#007AFF'} maximumTrackTintColor={isDarkMode ? '#444' : '#d3d3d3'}
                            />
                        </View>
                    </SettingOption>
                    
                    <SettingOption isDarkMode={isDarkMode} fontSizeMultiplier={fontSizeMultiplier} title="Custom Background">
                        <View style={styles.imageButtons}>
                            <AnimatedPressable onPress={pickImage}>
                                <View style={styles.button}>
                                    <Text style={styles.buttonText}>Select Image</Text>
                                </View>
                            </AnimatedPressable>
                            {backgroundImageUri && (
                                <View style={{ marginLeft: 10 }}>
                                    <AnimatedPressable onPress={resetImage}>
                                        <View style={[styles.button, styles.dangerButton]}>
                                            <Text style={styles.buttonText}>Reset</Text>
                                        </View>
                                    </AnimatedPressable>
                                </View>
                            )}
                        </View>
                    </SettingOption>
                </View>

                <Text style={[{ marginTop: 30, textAlign: 'center' }, textStyle, { fontSize: 16 * fontSizeMultiplier }, textBgStyle]}> 
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
    settingsHeader: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
    darkSettingsHeader: { /* kept for parity, no extra props */ },
    headerTitle: { fontSize: 22, fontWeight: '700' },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10, paddingHorizontal: 20, },
    settingBlock: { borderRadius: 10, marginHorizontal: 15, overflow: 'hidden', },
    lightBlock: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', },
    darkBlock: { backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', },
    sliderContainer: { width: 150, },
    imageButtons: { flexDirection: 'row', alignItems: 'center', },
    nameInputContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', },
    nameInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', width: '50%', marginRight: 10, paddingVertical: 2, textAlign: 'right', fontSize: 16, },
    currentProfile: { padding: 10, paddingHorizontal: 20, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e0e0e0', }
    ,
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});