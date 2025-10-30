import { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, TextField, Typography, List, ListItem, ListItemText, Divider, Chip, Avatar, Menu, MenuItem, useTheme, useMediaQuery, alpha } from "@mui/material";
import { Send, AttachFile, MoreVert, Mic, Stop } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { addMessageToConversation, setMessagesForConversation } from "../../state";
import { API_BASE_URL } from "../../utils/api";
import { useSocket } from "./SocketProvider";
import AudioWaveform from "../AudioWaveform";

export default function ChatWindow({ conversationId, recipientId }) {
  const dispatch = useDispatch();
  const token = useSelector(s => s.token);
  const userId = useSelector(s => s.user?._id);
  const messages = useSelector(s => s.messagesByConversation[conversationId] || []);
  const conversation = useSelector(s => (s.conversations || []).find(c => c._id === conversationId));
  const friend = conversation?.friend;
  const { socket } = useSocket();
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:999px)');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const uiTheme = useSelector(s => s.uiTheme);
  const isDarkMode = theme.palette.mode === 'dark';
  const headerBg = uiTheme?.backgroundType
    ? (isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)')
    : alpha(theme.palette.background.paper, isDarkMode ? 0.75 : 0.92);
  const surfaceBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(28,34,47,0.08)';
  const scrollBg = uiTheme?.backgroundType
    ? (isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.65)')
    : alpha(theme.palette.background.default, isDarkMode ? 0.95 : 0.9);

  const toAbsoluteUrl = (src) => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src)) return src;
    const base = API_BASE_URL.replace(/\/$/, "");
    if (src.startsWith("/")) return `${base}${src}`;
    return `${base}/assets/${src}`;
  };

  useEffect(() => {
    if (!conversationId || !token) return;
    (async () => {
      const res = await fetch(`https://mockingbird-backend.idrees.in/messages/${conversationId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      dispatch(setMessagesForConversation({ conversationId, messages: data }));
    })();
  }, [conversationId, token, dispatch]);

  const onSend = async () => {
    if (!text.trim() && files.length === 0) return;
    const form = new FormData();
    form.append("recipientId", recipientId);
    if (text.trim()) form.append("content", text.trim());
    files.forEach(f => form.append("media", f));

    const res = await fetch(`https://mockingbird-backend.idrees.in/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (res.ok) {
      const saved = await res.json();
      dispatch(addMessageToConversation({ conversationId: saved.conversationId, message: saved }));
      setText("");
      setFiles([]);
      if (socket) socket.emit("direct_message", { toUserId: recipientId, conversationId: saved.conversationId, message: saved });
    }
  };

  const onTyping = (isTyping) => {
    if (socket) socket.emit("typing", { toUserId: recipientId, conversationId, isTyping });
  };

  const saveEdit = async (messageId) => {
    const res = await fetch(`https://mockingbird-backend.idrees.in/messages/message/${messageId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingText })
    });
    if (res.ok) {
      const updated = await res.json();
      const current = [...(messages || [])].map(m => m._id === updated._id ? updated : m);
      dispatch(setMessagesForConversation({ conversationId, messages: current }));
      setEditingId(null);
      setEditingText("");
    }
  };

  const deleteMsg = async (messageId) => {
    const res = await fetch(`https://mockingbird-backend.idrees.in/messages/message/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const current = [...(messages || [])].map(m => m._id === messageId ? { ...m, isDeleted: true, content: "", media: [], mediaTypes: [] } : m);
      dispatch(setMessagesForConversation({ conversationId, messages: current }));
      if (socket) socket.emit('message_deleted', { toUserId: recipientId, conversationId, messageId });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.5,
        borderBottom: `1px solid ${surfaceBorder}`,
        position: "sticky",
        top: 0,
        zIndex: 1,
        backgroundColor: headerBg,
        backdropFilter: 'saturate(180%) blur(18px)',
        WebkitBackdropFilter: 'saturate(180%) blur(18px)',
        boxShadow: isDarkMode
          ? '0 12px 24px rgba(5, 8, 20, 0.45)'
          : '0 12px 24px rgba(15, 23, 42, 0.12)'
      }}>
        <Avatar src={toAbsoluteUrl(friend?.picturePath)}>{friend?.name?.[0] || "?"}</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{friend?.name || recipientId}</Typography>
          <Typography variant="caption" color="text.secondary">{friend?.location || ""}</Typography>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 1.5, md: 2.5 },
          backgroundColor: scrollBg,
          backdropFilter: uiTheme?.backgroundType ? 'saturate(180%) blur(18px)' : undefined,
          WebkitBackdropFilter: uiTheme?.backgroundType ? 'saturate(180%) blur(18px)' : undefined,
          position: 'relative',
          pb: isMobile ? 10 : 3,
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1 }}>
          {messages.map(m => {
            const isMine = m.senderId === userId;
            const outgoingGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)}, ${alpha(theme.palette.primary.dark, 0.9)})`;
            const bubbleSx = isMine
              ? {
                  background: outgoingGradient,
                  color: theme.palette.primary.contrastText,
                  border: `1px solid ${alpha(theme.palette.primary.dark, 0.65)}`,
                  boxShadow: '0 12px 32px rgba(10, 21, 40, 0.35)',
                }
              : {
                  bgcolor: isDarkMode ? alpha('#111826', 0.85) : alpha('#ffffff', 0.95),
                  color: 'text.primary',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)'}`,
                  boxShadow: isDarkMode ? '0 10px 24px rgba(3,10,22,0.55)' : '0 10px 24px rgba(15,23,42,0.12)',
                };
            return (
              <ListItem
                key={m._id}
                sx={{
                  alignItems: 'flex-end',
                  gap: 1,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  px: 0,
                  '&:hover .chat-message-actions': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  }
                }}
              >
                {!isMine && <Avatar sx={{ width: 28, height: 28 }} src={toAbsoluteUrl(friend?.picturePath)}>{friend?.name?.[0] || "?"}</Avatar>}
                <Box
                  sx={{
                    maxWidth: { xs: '82%', md: '70%' },
                    p: 1.35,
                    borderRadius: 3,
                    borderTopRightRadius: isMine ? 8 : 24,
                    borderTopLeftRadius: isMine ? 24 : 8,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    ...bubbleSx,
                  }}
                >
                  {m.isDeleted ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Message deleted</Typography>
                  ) : (
                    <>
                      {m.media && m.media.length > 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: m.content ? 1 : 0 }}>
                          {m.media.map((src, idx) => {
                            const type = m.mediaTypes?.[idx] || "image";
                            const abs = toAbsoluteUrl(src);
                            if (type === 'image') {
                              return <img key={idx} src={abs} alt="media" style={{ maxWidth: "100%", borderRadius: 12 }} />;
                            }
                            if (type === 'audio') {
                              return (
                                <AudioWaveform key={idx} audioSrc={abs} />
                              );
                            }
                            if (type === 'video' || type === 'clip') {
                              return (
                                <video key={idx} controls style={{ width: '100%', borderRadius: 12 }}>
                                  <source src={abs} />
                                </video>
                              );
                            }
                            return <Chip key={idx} label={src.split('/').pop()} component="a" href={abs} clickable />;
                          })}
                        </Box>
                      )}
                      {editingId === m._id ? (
                        <TextField size="small" fullWidth value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m._id); }} />
                      ) : (
                        m.content && <Typography variant="body2">{m.content}{m.isEdited ? " (edited)" : ""}</Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          display: 'block',
                          mt: 0.5,
                          color: isMine ? alpha('#f5f8ff', 0.85) : 'text.secondary'
                        }}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </>
                  )}
                </Box>
                {isMine && !m.isDeleted && (
                  <IconButton
                    size="small"
                    className="chat-message-actions"
                    sx={{
                      opacity: 0,
                      transform: 'translateY(6px)',
                      transition: 'all 0.2s ease',
                      color: alpha('#ffffff', 0.8)
                    }}
                    onClick={(e) => { setAnchorEl(e.currentTarget); setEditingId(null); setEditingText(m.content || ""); }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                )}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                  <MenuItem onClick={() => { setEditingId(m._id); setEditingText(m.content || ""); setAnchorEl(null); }}>Edit</MenuItem>
                  <MenuItem onClick={() => { deleteMsg(m._id); setAnchorEl(null); }}>Delete</MenuItem>
                  {editingId && (
                    <MenuItem onClick={() => { saveEdit(editingId); }}>Save</MenuItem>
                  )}
                </Menu>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Divider />
      <Box sx={{
        p: 1,
        display: "flex",
        gap: 1,
        alignItems: "center",
        borderTop: `1px solid ${surfaceBorder}`,
        backgroundColor: uiTheme?.backgroundType
          ? (isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)')
          : alpha(theme.palette.background.paper, isDarkMode ? 0.78 : 0.95),
        backdropFilter: 'saturate(180%) blur(18px)',
        WebkitBackdropFilter: 'saturate(180%) blur(18px)',
      }}>
        <input ref={fileInputRef} hidden type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        <IconButton onClick={() => fileInputRef.current?.click()}>
          <AttachFile />
        </IconButton>
        {!isRecording ? (
          <IconButton onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mr = new MediaRecorder(stream);
              mediaRecorderRef.current = mr;
              const chunks = [];
              mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
              mr.onstop = async () => {
                clearInterval(recordTimerRef.current);
                setIsRecording(false);
                setRecordSeconds(0);
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
                const form = new FormData();
                form.append('recipientId', recipientId);
                form.append('media', file);
                const res = await fetch(`https://mockingbird-backend.idrees.in/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
                if (res.ok) {
                  const saved = await res.json();
                  dispatch(addMessageToConversation({ conversationId: saved.conversationId, message: saved }));
                  if (socket) socket.emit('direct_message', { toUserId: recipientId, conversationId: saved.conversationId, message: saved });
                }
                stream.getTracks().forEach(t => t.stop());
              };
              mr.start();
              setIsRecording(true);
              setRecordSeconds(0);
              recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
            } catch (err) {
              console.error('Mic permission/record error', err);
            }
          }}>
            <Mic />
          </IconButton>
        ) : (
          <IconButton color="error" onClick={() => { try { mediaRecorderRef.current?.stop(); } catch(_){} }}>
            <Stop />
          </IconButton>
        )}
        <TextField
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(true); }}
          onBlur={() => onTyping(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          fullWidth
          placeholder={isRecording ? `Recording… ${recordSeconds}s` : "Type a message"}
          size="small"
          disabled={isRecording}
          multiline={!isMobile}
          minRows={1}
          maxRows={4}
        />
        <IconButton color="primary" onClick={onSend} disabled={isRecording}>
          <Send />
        </IconButton>
      </Box>
      {files.length > 0 && (
        <Box sx={{ p: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {files.map((f, i) => (
            <Chip key={i} label={f.name} onDelete={() => setFiles(files.filter((_, idx) => idx !== i))} />
          ))}
        </Box>
      )}
    </Box>
  );
}


