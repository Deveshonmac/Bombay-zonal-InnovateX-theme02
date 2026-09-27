/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="AirSense System Level Error">
      <ThemeProvider>
        <SettingsProvider>
          <Dashboard />
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
