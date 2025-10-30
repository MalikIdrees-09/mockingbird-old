import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Block,
  Delete,
  Search,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";

const UserManagement = ({ userId }) => {
  const { palette } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: "", banReason: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const token = useSelector((state) => state.token);

  const getUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching users...");
      console.log("🔑 Token available:", !!token);
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(
        `https://mockingbird-backend.idrees.in/admin/users?page=${page}&search=${searchTerm}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(" Users data received:", data);
      
      // Ensure data has the expected structure
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(" Error fetching users:", error);
      setUsers([]); // Set empty array as fallback
      setTotalPages(1);
      setSnackbar({
        open: true,
        message: "Error fetching users: " + error.message,
        severity: "error",
      });
    }
    setLoading(false);
  }, [page, searchTerm, token]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleBanUser = async (user) => {
    try {
      const response = await fetch(`https://mockingbird-backend.idrees.in/admin/users/${user._id}/ban`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          adminId: userId,
          reason: confirmDialog.banReason || "Violation of community guidelines"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        getUsers(); // Refresh the list
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
            message: errorData.message || "Error updating user status",
            severity: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error banning user:", error);
      setSnackbar({
        open: true,
        message: "Error updating user status",
        severity: "error",
      });
    }
    setConfirmDialog({ open: false, user: null, action: "", banReason: "" });
  };

  const handleDeleteUser = async (user) => {
    try {
      const response = await fetch(`https://mockingbird-backend.idrees.in/admin/users/${user._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        getUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        // Handle specific error cases
        if (errorData.error === "SELF_DELETE_PREVENTED") {
          setSnackbar({
            open: true,
            message: "You cannot delete yourself",
            severity: "warning",
          });
        } else {
          setSnackbar({
            open: true,
            message: errorData.message || "Error deleting user",
            severity: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setSnackbar({
        open: true,
        message: error.message || "Error deleting user",
        severity: "error",
      });
    }
    setConfirmDialog({ open: false, user: null, action: "" });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const openConfirmDialog = (user, action) => {
    setConfirmDialog({ open: true, user, action, banReason: "" });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, user: null, action: "", banReason: "" });
  };

  const executeAction = () => {
    if (confirmDialog.action === "ban") {
      handleBanUser(confirmDialog.user);
    } else if (confirmDialog.action === "delete") {
      handleDeleteUser(confirmDialog.user);
    }
  };

  return (
    <WidgetWrapper>
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3,
          fontFamily: "Playfair Display, serif",
          fontWeight: 600,
          color: "secondary.main"
        }}
      >
        User Management
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: palette.neutral.medium }} />,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
            },
          }}
        />
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "12px", mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: palette.neutral.light }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (!users || users.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              (users || []).map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="500">
                        {user.firstName} {user.lastName}
                      </Typography>
                      {user.isAdmin && (
                        <Chip
                          label="Admin"
                          color="primary"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Chip
                        label="Banned"
                        color="error"
                        size="small"
                        icon={<Block />}
                      />
                    ) : (
                      <Chip
                        label="Active"
                        color="success"
                        size="small"
                        icon={<CheckCircle />}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        color={user.isBanned ? "success" : "warning"}
                        startIcon={user.isBanned ? <CheckCircle /> : <Block />}
                        onClick={() => openConfirmDialog(user, "ban")}
                        disabled={user.isAdmin || user._id === userId}
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => openConfirmDialog(user, "delete")}
                        disabled={user.isAdmin || user._id === userId}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ mr: 1, color: palette.accent.main }} />
            Confirm Action
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to {confirmDialog.action}{" "}
            {confirmDialog.user?.firstName} {confirmDialog.user?.lastName}?
          </Typography>

          {confirmDialog.action === "ban" && !confirmDialog.user?.isBanned && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for ban"
              placeholder="Please provide a specific reason for this ban..."
              value={confirmDialog.banReason}
              onChange={(e) => setConfirmDialog(prev => ({ ...prev, banReason: e.target.value }))}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 500 }}
              helperText={`${confirmDialog.banReason.length}/500 characters`}
            />
          )}

          {confirmDialog.action === "delete" && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning">
                This action cannot be undone. All user data and posts will be deleted.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button
            onClick={executeAction}
            color={confirmDialog.action === "delete" ? "error" : "warning"}
            variant="contained"
            disabled={confirmDialog.action === "ban" && !confirmDialog.user?.isBanned && !confirmDialog.banReason.trim()}
          >
            {confirmDialog.action === "ban"
              ? confirmDialog.user?.isBanned
                ? "Unban"
                : "Ban"
              : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default UserManagement;
