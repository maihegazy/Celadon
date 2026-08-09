/**
 * Unit tests for pure logic — the offline outboxes above all. Nothing here
 * renders a component, so plain ts-jest on node is enough; AsyncStorage is
 * replaced by the in-memory mock the library ships for exactly this.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^expo-crypto$': '<rootDir>/src/test/mocks/expo-crypto.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      // The app's tsconfig targets React Native's bundler; jest runs plain
      // CommonJS on node, so the transform gets its own settings.
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          strict: true,
          module: 'commonjs',
          moduleResolution: 'node',
          types: ['jest'],
        },
      },
    ],
  },
};
