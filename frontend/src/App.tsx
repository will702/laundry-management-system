/**
 * App.tsx — root component.
 *
 * Migrated from App.jsx (the last .jsx file in the codebase).
 * Decomposed into:
 *   SessionGate — auth, session restore, login flow
 *   AppShell    — navigation chrome (sidebar / topbar / bottom nav) + routes
 *
 * BrowserRouter is mounted in main.tsx (unchanged).
 */
import React from 'react';
import { SessionGate } from './app/SessionGate';
import { AppShell }    from './app/AppShell';

export default function App() {
  return (
    <SessionGate>
      {({ employee, onLogout }) => (
        <AppShell employee={employee} onLogout={onLogout} />
      )}
    </SessionGate>
  );
}
