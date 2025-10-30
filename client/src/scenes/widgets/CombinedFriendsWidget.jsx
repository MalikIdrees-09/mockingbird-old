import { useEffect, useState } from "react";
import { Box, Typography, Divider, CircularProgress, Button } from "@mui/material";
import { useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";
import Friend from "components/Friend";
import { API_BASE_URL } from "utils/api";

const CombinedFriendsWidget = ({ userId }) => {
  const token = useSelector((s) => s.token);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [friendsRes, reqRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${userId}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/users/${userId}/friend-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const friendsJson = friendsRes.ok ? await friendsRes.json() : [];
        const reqJson = reqRes.ok ? await reqRes.json() : [];
        if (!cancelled) {
          setFriends(Array.isArray(friendsJson) ? friendsJson : []);
          setRequests(Array.isArray(reqJson) ? reqJson : []);
        }
      } catch (_) {
        if (!cancelled) {
          setFriends([]);
          setRequests([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId, token]);

  return (
    <WidgetWrapper>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Friends & Requests</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {/* Friend Requests */}
          {requests.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Requests</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {requests.map(r => (
                  <Friend
                    key={`req-${r._id}`}
                    friendId={r._id}
                    name={`${r.firstName || ''} ${r.lastName || ''}`.trim()}
                    subtitle={r.bio || r.location || ''}
                    userPicturePath={r.picturePath}
                    showAddFriend={false}
                    friendStatus={'request_received'}
                  />
                ))}
              </Box>
            </Box>
          )}

          {requests.length > 0 && friends.length > 0 && <Divider sx={{ my: 1 }} />}

          {/* Friends */}
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Friends</Typography>
          {friends.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No friends yet.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {friends.map(f => (
                <Friend
                  key={`friend-${f._id}`}
                  friendId={f._id}
                  name={`${f.firstName || ''} ${f.lastName || ''}`.trim()}
                  subtitle={f.bio || f.location || ''}
                  userPicturePath={f.picturePath}
                  showAddFriend={false}
                  friendStatus={'friends'}
                />
              ))}
            </Box>
          )}
        </>
      )}
    </WidgetWrapper>
  );
};

export default CombinedFriendsWidget;



