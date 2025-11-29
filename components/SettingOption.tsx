// components/SettingOption.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingOptionProps {
    title: string;
    children: React.ReactNode;
    isDarkMode?: boolean;
    fontSizeMultiplier?: number;
}

const SettingOption: React.FC<SettingOptionProps> = ({ title, children, isDarkMode = false, fontSizeMultiplier = 1.0 }) => (
    <View style={[styles.optionContainer, isDarkMode && styles.darkOptionContainer]}>
        <Text style={[styles.titleText, isDarkMode && styles.darkTitleText, { fontSize: 16 * fontSizeMultiplier }]}>{title}</Text>
        <View style={styles.control}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    optionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#efefef',
        paddingHorizontal: 20,
    },
    darkOptionContainer: {
        borderBottomColor: '#444',
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        color: '#000',
    },
    darkTitleText: {
        color: '#FFFFFF',
    },
    control: {
        flex: 1,
        alignItems: 'flex-end',
    }
});

export default SettingOption;