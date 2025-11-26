// components/SettingOption.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingOptionProps {
    title: string;
    children: React.ReactNode;
}

const SettingOption: React.FC<SettingOptionProps> = ({ title, children }) => (
    <View style={styles.optionContainer}>
        <Text style={styles.titleText}>{title}</Text>
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
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    control: {
        flex: 1,
        alignItems: 'flex-end',
    }
});

export default SettingOption;