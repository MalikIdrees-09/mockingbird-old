import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";

export default function SwipeNavigator() {
  const isMobile = useMediaQuery("(max-width: 999px)");
  const startXRef = useRef(null);
  const startYRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isMobile || location.pathname === "/") return;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      const sx = startXRef.current;
      const sy = startYRef.current;
      startXRef.current = null;
      startYRef.current = null;
      if (sx == null || sy == null) return;

      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - sx;
      const dy = touch.clientY - sy;

      // Ignore mostly vertical swipes
      if (Math.abs(dy) > Math.abs(dx)) return;

      const threshold = 60; // px
      if (dx <= -threshold) {
        // swipe left → go to chat
        if (location.pathname !== "/chat") navigate("/chat");
      } else if (dx >= threshold) {
        // swipe right → go to settings
        if (location.pathname !== "/settings") navigate("/settings");
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, navigate, location.pathname]);

  return null;
}


