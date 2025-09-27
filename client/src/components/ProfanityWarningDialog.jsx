import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  useTheme,
} from "@mui/material";
import { Warning, Block, RecordVoiceOver } from "@mui/icons-material";

const ProfanityWarningDialog = ({ open, onClose, message, details }) => {
  const { palette } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "1rem",
          border: `3px solid ${palette.error.main}`,
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          color: palette.error.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          fontSize: "1.8rem",
          fontWeight: 700,
          mb: 1,
        }}
      >
        <RecordVoiceOver sx={{ fontSize: "2.5rem", color: palette.error.main }} />
        🚨 WATCH YOUR MOUTH! 🚨
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center" mb={3}>
          <Block 
            sx={{ 
              fontSize: "5rem", 
              color: palette.error.main,
              mb: 2,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
                "100%": { transform: "scale(1)" },
              }
            }} 
          />
          
          <Typography 
            variant="h5" 
            color="error" 
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Content Blocked!
          </Typography>
          
          <Typography variant="body1" color="textPrimary" paragraph>
            {message}
          </Typography>
          
          <Box 
            sx={{ 
              backgroundColor: palette.error.light + "20",
              borderRadius: "12px",
              padding: "1rem",
              mt: 2,
              mb: 2,
              border: `2px solid ${palette.error.light}`,
            }}
          >
            <Typography variant="body2" color="textSecondary">
              {details}
            </Typography>
          </Box>
          
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            gap={1}
            sx={{
              backgroundColor: palette.warning.light + "20",
              borderRadius: "8px",
              padding: "0.75rem",
              mt: 2,
              border: `1px solid ${palette.warning.main}`,
            }}
          >
            <Warning sx={{ color: palette.warning.main }} />
            <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 500 }}>
              Please keep your language appropriate for our community
            </Typography>
          </Box>

          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ 
              mt: 2, 
              fontStyle: "italic",
              opacity: 0.8 
            }}
          >
            Please be careful with your language! - Idrees.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: palette.primary.main,
            color: "white",
            borderRadius: "25px",
            px: 4,
            py: 1,
            fontSize: "1rem",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            }
          }}
        >
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfanityWarningDialog;
