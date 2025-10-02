import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const MasonryLayout = ({
  children,
  columns = 3,
  gap = 16,
  responsive = true,
  minColumnWidth = 280
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate responsive columns
  const calculatedColumns = useMemo(() => {
    if (!responsive) return columns;

    if (isMobile) return 1;
    if (isTablet) return 2;

    if (containerWidth > 0) {
      const maxColumns = Math.floor(containerWidth / minColumnWidth);
      return Math.min(columns, Math.max(1, maxColumns));
    }

    return columns;
  }, [columns, responsive, isMobile, isTablet, containerWidth, minColumnWidth]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Group children into columns for masonry layout
  const columnsData = useMemo(() => {
    const cols = [];
    for (let i = 0; i < calculatedColumns; i++) {
      cols.push([]);
    }

    // Distribute children across columns (simple round-robin for now)
    // In a more advanced implementation, you'd measure heights and balance columns
    React.Children.forEach(children, (child, index) => {
      const columnIndex = index % calculatedColumns;
      cols[columnIndex].push(child);
    });

    return cols;
  }, [children, calculatedColumns]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        gap: `${gap}px`,
        width: '100%',
        alignItems: 'flex-start'
      }}
    >
      {columnsData.map((columnItems, columnIndex) => (
        <Box
          key={columnIndex}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            minWidth: 0 // Prevent flex items from overflowing
          }}
        >
          {columnItems.map((item, itemIndex) => (
            <Box
              key={itemIndex}
              sx={{
                width: '100%',
                '& > *': {
                  width: '100%'
                }
              }}
            >
              {item}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default MasonryLayout;
