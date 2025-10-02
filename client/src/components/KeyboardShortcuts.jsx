import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setMode } from 'state';
import { Dialog, DialogContent, DialogTitle, Typography, Box, Divider } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' || target.closest('[contenteditable]')) {
      return;
    }

    // Don't trigger shortcuts in modals/dialogs
    if (target.closest('[role="dialog"]') || target.closest('.MuiDialog-root')) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    // Global shortcuts
    switch (key) {
      case '?':
        if (!shiftKey) {
          event.preventDefault();
          setShowHelp(true);
        }
        break;

      case 'Escape':
        // Close any open modals or dialogs
        if (document.querySelector('[role="dialog"]') || document.querySelector('.MuiDialog-root')) {
          // Find and close the topmost dialog
          const dialogs = document.querySelectorAll('[role="dialog"], .MuiDialog-root');
          if (dialogs.length > 0) {
            const closeButtons = dialogs[dialogs.length - 1].querySelectorAll('button[aria-label*="close"], .MuiIconButton-root');
            if (closeButtons.length > 0) {
              closeButtons[closeButtons.length - 1].click();
            }
          }
        }
        break;

      case '/':
        if (!shiftKey) {
          event.preventDefault();
          // Focus search input if available
          const searchInput = document.querySelector('input[placeholder*="search"], input[placeholder*="Search"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        break;

      case 'd':
        if (isCtrlOrCmd) {
          event.preventDefault();
          dispatch(setMode());
        }
        break;

      default:
        break;
    }

    // Page-specific shortcuts
    if (isCtrlOrCmd) {
      switch (key) {
        case 'k':
          event.preventDefault();
          // Focus search or open search modal
          const searchInput = document.querySelector('input[placeholder*="search"], input[placeholder*="Search"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;

        default:
          break;
      }
    }

    // Navigation shortcuts (vim-style)
    if (!isCtrlOrCmd && !shiftKey && !altKey) {
      switch (key) {
        case 'g':
          // Wait for next key to determine destination
          const handleNextKey = (nextEvent) => {
            const nextKey = nextEvent.key.toLowerCase();
            nextEvent.preventDefault();
            nextEvent.stopPropagation();

            switch (nextKey) {
              case 'h':
                navigate('/home');
                break;
              case 'p':
                if (user) {
                  navigate(`/profile/${user._id}`);
                }
                break;
              case 's':
                navigate('/settings');
                break;
              case 'a':
                if (user && (user.isAdmin || user._id === "idrees")) {
                  navigate('/admin');
                }
                break;
              default:
                break;
            }

            document.removeEventListener('keydown', handleNextKey, true);
          };

          document.addEventListener('keydown', handleNextKey, true);
          event.preventDefault();
          break;

        case 'n':
          // New post shortcut (if on home page)
          if (location.pathname === '/home') {
            event.preventDefault();
            // Focus the post input or trigger new post creation
            const postInput = document.querySelector('textarea, [contenteditable], input[placeholder*="mind"]');
            if (postInput) {
              postInput.focus();
            }
          }
          break;

        case 'r':
          // Refresh/reload current page
          event.preventDefault();
          window.location.reload();
          break;

        case 'u':
          // Go up/back in navigation
          event.preventDefault();
          window.history.back();
          break;

        default:
          break;
      }
    }
  }, [navigate, location, dispatch, user]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['Ctrl+D'], description: 'Toggle dark/light mode' },
        { keys: ['Escape'], description: 'Close dialogs/modals' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['g h'], description: 'Go to Home' },
        { keys: ['g p'], description: 'Go to Profile' },
        { keys: ['g s'], description: 'Go to Settings' },
        { keys: ['g a'], description: 'Go to Admin (if admin)' },
        { keys: ['u'], description: 'Go back' },
        { keys: ['r'], description: 'Refresh page' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Ctrl+K'], description: 'Focus search' },
        { keys: ['n'], description: 'New post (on home page)' },
      ]
    }
  ];

  return (
    <>
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Keyboard Shortcuts
          </Typography>
          <CloseIcon
            onClick={() => setShowHelp(false)}
            sx={{
              cursor: 'pointer',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          {shortcuts.map((category, index) => (
            <Box key={category.category} sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem'
                }}
              >
                {category.category}
              </Typography>

              {category.items.map((shortcut, itemIndex) => (
                <Box
                  key={itemIndex}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.75,
                    px: 1,
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {shortcut.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <Box
                          sx={{
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '4px',
                            px: 1,
                            py: 0.25,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'text.secondary',
                            minWidth: '24px',
                            textAlign: 'center',
                            fontFamily: 'monospace'
                          }}
                        >
                          {key}
                        </Box>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>
                            +
                          </Typography>
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              ))}

              {index < shortcuts.length - 1 && (
                <Divider sx={{ mt: 2, mb: 1 }} />
              )}
            </Box>
          ))}

          <Box sx={{
            mt: 2,
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Tip: Shortcuts work when not typing in input fields
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcuts;
