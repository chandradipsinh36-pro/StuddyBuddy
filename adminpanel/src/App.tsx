import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { router } from './routes';

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid var(--color-gray-200)',
        borderTopColor: 'var(--color-primary-500)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'var(--font-family-base)',
            fontSize: 'var(--font-size-sm)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 16px',
            color: 'var(--color-gray-900)',
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </AdminAuthProvider>
  );
};
