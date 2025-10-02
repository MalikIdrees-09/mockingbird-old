import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Toast = ({ toast, onClose, position }) => {
  const getSeverity = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose(toast.id);
  };

  return (
    <Snackbar
      open={true}
      autoHideDuration={toast.duration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: position.includes('top') ? 'top' : 'bottom',
        horizontal: position.includes('right') ? 'right' :
                  position.includes('left') ? 'left' : 'center'
      }}
      sx={{
        position: 'fixed',
        zIndex: 9999,
        ...(position.includes('top') && {
          top: position.includes('right') || position.includes('center') ? '24px' : 'auto'
        }),
        ...(position.includes('bottom') && {
          bottom: position.includes('right') || position.includes('center') ? '24px' : 'auto'
        })
      }}
    >
      <Alert
        onClose={handleClose}
        severity={getSeverity(toast.type)}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: '300px',
          maxWidth: '500px',
          boxShadow: 3,
          '& .MuiAlert-icon': {
            fontSize: '20px'
          },
          '& .MuiAlert-message': {
            fontSize: '14px',
            fontWeight: 500
          }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => onClose(toast.id)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
