import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from './AnimatedPressable';

type ButtonProps = {
  title: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(({ title, ...touchableProps }, ref) => {
  return (
    <AnimatedPressable onPress={touchableProps.onPress}>
      <View style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{title}</Text>
      </View>
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';

const styles = {
  button: 'items-center bg-indigo-500 rounded-[28px] shadow-md p-4',
  buttonText: 'text-white text-lg font-semibold text-center',
};
