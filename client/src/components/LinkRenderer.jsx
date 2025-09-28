import React from 'react';
import { Link, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Custom link component for ReactMarkdown
export const MarkdownLink = ({ href, children, ...props }) => {
  const theme = useTheme();
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      }}
      {...props}
    >
      {children}
    </Link>
  );
};

// Component for rendering text with clickable links (non-markdown)
const LinkRenderer = ({ text, variant = 'body1', sx = {} }) => {
  const theme = useTheme();

  // URL regex pattern - matches http, https, www, and common TLDs
  const urlRegex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

  // Split text by URLs and render links
  const parts = text.split(urlRegex);

  return (
    <Typography variant={variant} sx={sx}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // This part is a URL - render as link
          return (
            <Link
              key={index}
              href={part.startsWith('http') ? part : `https://${part}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {part}
            </Link>
          );
        } else {
          // This part is plain text - render as span
          return <span key={index}>{part}</span>;
        }
      })}
    </Typography>
  );
};

export default LinkRenderer;
