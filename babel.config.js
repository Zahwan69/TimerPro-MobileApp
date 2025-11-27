module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
        'expo-router/babel',
        // 📌 CRUCIAL FIX: Ensure this is present and configured correctly.
        // This plugin helps with module resolution, often fixing the 'import.meta' issue
        [
            'module-resolver',
            {
                alias: {
                    // Mapping is often needed for web compatibility with RN components
                    'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter': 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter',
                },
            },
        ],
    ],
  };
};