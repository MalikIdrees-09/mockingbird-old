import React, { useState, useEffect } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useScrollTrigger,
  Zoom,
  Box
} from '@mui/material';
import {
  KeyboardArrowUp as ScrollTopIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  BookmarkBorder as BookmarksIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingActionButtons = ({
  onNewPost,
  showScrollTop = true,
  showSpeedDial = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Show scroll to top button when user scrolls down
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const speedDialActions = [
    {
      icon: <EditIcon />,
      name: 'New Post',
      onClick: () => onNewPost && onNewPost()
    },
    {
      icon: <HomeIcon />,
      name: 'Home',
      onClick: () => navigate('/home')
    },
    {
      icon: <SearchIcon />,
      name: 'Search',
      onClick: () => navigate('/search')
    },
    {
      icon: <ProfileIcon />,
      name: 'Profile',
      onClick: () => {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (user._id) {
          navigate(`/profile/${user._id}`);
        }
      }
    },
    {
      icon: <SettingsIcon />,
      name: 'Settings',
      onClick: () => navigate('/settings')
    }
  ];

  // Don't show on certain pages
  const hiddenPages = ['/login', '/reset-password', '/'];
  if (hiddenPages.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Zoom in={showScrollButton}>
          <Fab
            color="primary"
            size="small"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              transition: 'transform 0.2s ease'
            }}
          >
            <ScrollTopIcon />
          </Fab>
        </Zoom>
      )}

      {/* Main Speed Dial */}
      {showSpeedDial && (
        <SpeedDial
          ariaLabel="Navigation speed dial"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            '& .MuiSpeedDial-fab': {
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }}
          icon={<SpeedDialIcon />}
          direction="up"
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              sx={{
                '& .MuiSpeedDialAction-staticTooltipLabel': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: 'background.paper',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            />
          ))}
        </SpeedDial>
      )}
    </>
  );
};

export default FloatingActionButtons;
