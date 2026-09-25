// index.js
// CloudNest application entry point
// Ensures all cryptographic, process, and MTProto polyfills run before Expo Router boots
import './services/telegram/polyfill';
import 'expo-router/entry';
