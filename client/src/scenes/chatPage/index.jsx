import { useEffect, useState } from "react";
import { Box, List, ListItemButton, ListItemText, Divider, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, ListItemAvatar, Avatar, CircularProgress, IconButton, useMediaQuery, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ArrowBack } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { API_BASE_URL } from "../../utils/api";
import { setActiveConversation, setConversations } from "../../state";
import ChatWindow from "../../components/Chat/ChatWindow";
import UserImage from "../../components/UserImage";
import SocketProvider from "../../components/Chat/SocketProvider";
import Navbar from "../navbar";

export default function ChatPage() {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:999px)");
  const token = useSelector(s => s.token);
  const userId = useSelector(s => s.user?._id);
  const conversations = useSelector(s => s.conversations);
  const activeConversationId = useSelector(s => s.activeConversationId);
  const [recipientId, setRecipientId] = useState(null);

  const fetchConversations = async () => {
    const res = await fetch(`https://mockingbird-backend.idrees.in/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    dispatch(setConversations(data));
    if (data.length > 0 && !activeConversationId) {
      dispatch(setActiveConversation(data[0]._id));
      const rec = data[0].participants.find(p => p !== userId);
      setRecipientId(rec || null);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token, dispatch, activeConversationId, userId]);

  const openConversation = (c) => {
    dispatch(setActiveConversation(c._id));
    const rec = c.participants.find(p => p !== userId);
    setRecipientId(rec || null);
  };

  // New conversation UI
  const [newOpen, setNewOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  const startConversation = async (recipientId) => {
    const res = await fetch(`https://mockingbird-backend.idrees.in/messages/conversations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId }),
    });
    if (res.ok) {
      setNewOpen(false);
      await fetchConversations();
    }
  };

  useEffect(() => {
    if (!newOpen || !token || !userId) return;
    setFriendsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFriends(Array.isArray(data) ? data : []);
      } catch (e) {
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    })();
  }, [newOpen, token, userId]);

  return (
    <SocketProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Navbar />
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Conversation list */}
        {(!isMobile || !activeConversationId) && (
        <Box
          sx={{
            width: isMobile ? '100%' : 320,
            borderRight: isMobile ? 0 : 1,
            borderColor: 'divider',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(6,10,18,0.92)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            pb: isMobile ? 8 : 0,
          }}
        >
          <List sx={{ py: 1 }}>
            {conversations.map(c => (
              <ListItemButton
                key={c._id}
                selected={c._id === activeConversationId}
                onClick={() => openConversation(c)}
                sx={{
                  transition: 'all 0.2s ease',
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(29, 78, 216, 0.22)' : 'rgba(30, 64, 175, 0.08)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 20px rgba(15, 23, 42, 0.45)'
                      : '0 6px 16px rgba(15, 23, 42, 0.12)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={c.friend?.picturePath ? `${API_BASE_URL.replace(/\/$/, '')}${c.friend.picturePath.startsWith('/') ? '' : '/'}${c.friend.picturePath}` : undefined}>
                    {c.friend?.name?.[0] || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={c.friend?.name || (c.participants || []).filter(p => p !== userId).join(", ") || "Conversation"} secondary={c.lastMessagePreview} />
              </ListItemButton>
            ))}
          </List>
          {conversations.length === 0 && (
            <Box sx={{ p: 2, color: 'text.secondary' }}>
              <Typography variant="body2">No conversations yet. Click "New Message" to start chatting with a friend.</Typography>
            </Box>
          )}
          {!isMobile && (
            <Box
              sx={{
                p: 1.5,
                position: 'sticky',
                bottom: 0,
                mt: 'auto',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(8,13,23,0.92)' : 'rgba(255,255,255,0.95)',
                borderTop: 1,
                borderColor: 'divider',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <Button fullWidth variant="contained" onClick={() => setNewOpen(true)}>New Message</Button>
            </Box>
          )}
        </Box>
        )}
        {/* Chat window */}
        {(!isMobile || (isMobile && activeConversationId)) && (
        <Box sx={{ flex: 1, minHeight: 0, width: isMobile ? '100%' : 'auto' }}>
          {activeConversationId && recipientId ? (
            <>
              {isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <IconButton onClick={() => dispatch(setActiveConversation(null))}>
                    <ArrowBack />
                  </IconButton>
                  <Typography sx={{ ml: 1 }} variant="subtitle1">Chat</Typography>
                </Box>
              )}
              <ChatWindow conversationId={activeConversationId} recipientId={recipientId} />
            </>
          ) : (!isMobile) ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Select a conversation to start chatting</Typography>
            </Box>
          ) : null}
        </Box>
        )}
        </Box>
        {isMobile && (!activeConversationId) && (
          <Fab color="primary" aria-label="new" onClick={() => setNewOpen(true)} sx={{ position: 'fixed', right: 16, bottom: 80, zIndex: 1300 }}>
            <AddIcon />
          </Fab>
        )}
      </Box>
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Start a new conversation</DialogTitle>
        <DialogContent>
          {friendsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search friends by name"
                size="small"
                sx={{ mb: 2 }}
              />
              {friends.length === 0 ? (
                <Typography variant="body2" color="text.secondary">You have no friends to start a conversation with yet.</Typography>
              ) : (
                <List sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {friends
                    .filter(f => {
                      const q = friendSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        (f.firstName || '').toLowerCase().includes(q) ||
                        (f.lastName || '').toLowerCase().includes(q)
                      );
                    })
                    .map(f => (
                      <ListItemButton key={f._id} onClick={() => startConversation(f._id)}>
                        <ListItemAvatar>
                          <Avatar src={f.picturePath ? `${API_BASE_URL.replace(/\/$/, '')}${f.picturePath.startsWith('/') ? '' : '/'}${f.picturePath}` : undefined}>
                            {(f.firstName || '?')[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={`${f.firstName || ''} ${f.lastName || ''}`.trim()} secondary={f.location || ''} />
                      </ListItemButton>
                    ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </SocketProvider>
  );
}


