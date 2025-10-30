import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { addMessageToConversation, setTypingForConversation } from "../../state";
import { API_BASE_URL } from "../../utils/api";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const token = useSelector((s) => s.token);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(API_BASE_URL.replace(/\/$/, ""), {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("direct_message", (msg) => {
      const { conversationId, ...message } = msg;
      dispatch(addMessageToConversation({ conversationId, message }));
    });

    socket.on("typing", ({ fromUserId, conversationId, isTyping }) => {
      dispatch(setTypingForConversation({ conversationId, userId: fromUserId, isTyping }));
    });

    socket.on("read_receipt", ({ conversationId, messageIds }) => {
      // Could mark messages as read by ids if needed
    });

    socketRef.current = socket;
    setSocketInstance(socket);
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [token, dispatch]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance }}>
      {children}
    </SocketContext.Provider>
  );
}


