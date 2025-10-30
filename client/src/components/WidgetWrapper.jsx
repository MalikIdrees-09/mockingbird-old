import { Box } from "@mui/material";
import { styled } from "@mui/system";

const WidgetWrapper = styled(Box)(({ theme }) => ({
  padding: "1.5rem",
  backgroundColor: theme.palette.background.paper,
  borderRadius: "16px",
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)'
    : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)'
      : '0 8px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
  [theme.breakpoints.down('sm')]: {
    padding: '1rem',
    borderRadius: '12px',
  },
}));

export default WidgetWrapper;
