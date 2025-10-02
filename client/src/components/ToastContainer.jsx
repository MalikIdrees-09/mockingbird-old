import React from 'react';
import { Box } from '@mui/material';
import { useToast } from './ToastContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  // Position toasts from top to bottom, right to left
  const positions = [
    'top-right', 'top-center', 'top-left',
    'bottom-right', 'bottom-center', 'bottom-left'
  ];

  return (
    <Box>
      {toasts.map((toast, index) => {
        const position = positions[index % positions.length] || 'top-right';
        return (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            position={position}
          />
        );
      })}
    </Box>
  );
};

export default ToastContainer;
