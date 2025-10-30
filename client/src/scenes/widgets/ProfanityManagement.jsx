import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  useTheme,
  Alert,
  Snackbar,
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Warning,
  Visibility,
  Block,
  CheckCircle,
  Report,
  Schedule,
  TrendingUp,
  Security,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";

const ProfanityManagement = ({ userId }) => {
  const { palette } = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState("none");
  const [banReason, setBanReason] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const token = useSelector((state) => state.token);

  const getProfanityLogs = useCallback(async () => {
    try {
      const response = await fetch(
        `https://mockingbird-backend-453975176199.us-central1.run.app/profanity/logs?page=${page}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } else {
        throw new Error("Failed to fetch profanity logs");
      }
    } catch (error) {
      console.error("Error fetching profanity logs:", error);
      setSnackbar({
        open: true,
        message: "Error fetching profanity logs",
        severity: "error",
      });
    }
  }, [token, page]);

  const getProfanityStats = useCallback(async () => {
    try {
      const response = await fetch(
        `https://mockingbird-backend-453975176199.us-central1.run.app/profanity/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching profanity stats:", error);
    }
  }, [token]);

  useEffect(() => {
    getProfanityLogs();
    getProfanityStats();
  }, [getProfanityLogs, getProfanityStats]);

  const handleReview = async () => {
    try {
      const response = await fetch(
        `https://mockingbird-backend-453975176199.us-central1.run.app/profanity/logs/${selectedLog._id}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminNotes }),
        }
      );

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Log reviewed successfully",
          severity: "success",
        });
        setReviewDialog(false);
        setAdminNotes("");
        getProfanityLogs();
        getProfanityStats();
      } else {
        throw new Error("Failed to review log");
      }
    } catch (error) {
      console.error("Error reviewing log:", error);
      setSnackbar({
        open: true,
        message: "Error reviewing log",
        severity: "error",
      });
    }
  };

  const handleTakeAction = async () => {
    try {
      const response = await fetch(
        `https://mockingbird-backend-453975176199.us-central1.run.app/profanity/logs/${selectedLog._id}/action`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: selectedAction, banReason }),
        }
      );

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Action '${selectedAction}' taken successfully`,
          severity: "success",
        });
        setActionDialog(false);
        setSelectedAction("none");
        setBanReason("");
        getProfanityLogs();
        getProfanityStats();
      } else {
        const errorData = await response.json();
        // Handle specific error cases
        if (errorData.error === "SELF_BAN_PREVENTED") {
          setSnackbar({
            open: true,
            message: "You cannot ban yourself",
            severity: "warning",
          });
        } else {
          setSnackbar({
            open: true,
            message: errorData.message || "Error taking action",
            severity: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error taking action:", error);
      setSnackbar({
        open: true,
        message: "Error taking action",
        severity: "error",
      });
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return palette.success.main;
      case 'medium': return palette.warning.main;
      case 'high': return palette.error.main;
      case 'severe': return palette.error.dark;
      default: return palette.neutral.main;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <WidgetWrapper>
      <Typography variant="h4" color={palette.neutral.dark} fontWeight="500" mb="1.5rem">
        🚫 Profanity Management
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: palette.primary.light + "20" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Report sx={{ color: palette.primary.main }} />
                  <Box>
                    <Typography variant="h6">{stats.totalIncidents}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Incidents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: palette.warning.light + "20" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule sx={{ color: palette.warning.main }} />
                  <Box>
                    <Typography variant="h6">{stats.unreviewed}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: palette.error.light + "20" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp sx={{ color: palette.error.main }} />
                  <Box>
                    <Typography variant="h6">{stats.todayIncidents}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Today
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: palette.success.light + "20" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Security sx={{ color: palette.success.main }} />
                  <Box>
                    <Typography variant="h6">{stats.weekIncidents}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      This Week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Profanity Logs Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Detected Words</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {log.userName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {log.userEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {log.originalText}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {log.detectedWords.map((word, index) => (
                      <Chip
                        key={index}
                        label={word}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.severity.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: getSeverityColor(log.severity) + "20",
                      color: getSeverityColor(log.severity),
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(log.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {log.isReviewed ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Reviewed"
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<Warning />}
                      label="Pending"
                      size="small"
                      color="warning"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedLog(log);
                          setReviewDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {!log.isReviewed && (
                      <Tooltip title="Take Action">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedLog(log);
                            setActionDialog(true);
                          }}
                        >
                          <Block />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Profanity Incident</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="h6" gutterBottom>
                User: {selectedLog.userName} ({selectedLog.userEmail})
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Original Text:</strong> {selectedLog.originalText}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Detected Words:</strong> {selectedLog.detectedWords.join(', ')}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Severity:</strong> {selectedLog.severity}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Date:</strong> {formatDate(selectedLog.createdAt)}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Admin Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button onClick={handleReview} variant="contained">
            Mark as Reviewed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Take Action on User</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="body1" paragraph>
                Taking action on: <strong>{selectedLog.userName}</strong>
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  label="Action"
                >
                  <MenuItem value="none">No Action</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="temporary_ban">Temporary Ban</MenuItem>
                  <MenuItem value="permanent_ban">Permanent Ban</MenuItem>
                </Select>
              </FormControl>
              {(selectedAction === 'temporary_ban' || selectedAction === 'permanent_ban') && (
                <TextField
                  fullWidth
                  label="Ban Reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  multiline
                  rows={3}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button onClick={handleTakeAction} variant="contained" color="error">
            Take Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default ProfanityManagement;
