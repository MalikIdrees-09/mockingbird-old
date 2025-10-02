import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const InfiniteScroll = ({
  children,
  hasMore = true,
  isLoading = false,
  onLoadMore,
  threshold = 100,
  endMessage = "You've reached the end!",
  loaderComponent = null,
  error = null,
  onRetry = null,
  className = '',
  style = {}
}) => {
  const sentinelRef = useRef(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleIntersection = useCallback((entries) => {
    const target = entries[0];

    if (target.isIntersecting && hasMore && !isLoading && !isFetching && !error) {
      setIsFetching(true);

      if (onLoadMore) {
        onLoadMore().finally(() => {
          setIsFetching(false);
        });
      }
    }
  }, [hasMore, isLoading, isFetching, error, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [handleIntersection, threshold]);

  const renderLoader = () => {
    if (loaderComponent) {
      return loaderComponent;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          gap: 2
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading more...
        </Typography>
      </Box>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 4,
          gap: 2
        }}
      >
        <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
          {error}
        </Typography>
        {onRetry && (
          <Button
            variant="outlined"
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        )}
      </Box>
    );
  };

  const renderEndMessage = () => {
    if (!hasMore || isLoading) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {endMessage}
        </Typography>
      </Box>
    );
  };

  return (
    <Box className={className} style={style}>
      {/* Render children */}
      {children}

      {/* Error state */}
      {error && renderError()}

      {/* Loading state */}
      {(isLoading || isFetching) && !error && renderLoader()}

      {/* End of content message */}
      {!hasMore && !isLoading && !error && renderEndMessage()}

      {/* Intersection sentinel */}
      <div
        ref={sentinelRef}
        style={{
          height: '10px',
          width: '100%',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default InfiniteScroll;
