import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  FormatQuote,
  Code as CodeIcon
} from '@mui/icons-material';

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "What's on your mind...",
  maxLength = 2000,
  sx = {}
}) => {
  const editorRef = useRef(null);
  const [isActive, setIsActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false
  });

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);

      // Update active states based on current selection
      updateActiveStates();
    }
  };

  const updateActiveStates = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;

    // If it's a text node, get its parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    setIsActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      link: document.queryCommandValue('createLink') !== ''
    });
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
    updateActiveStates();
  };

  const handleKeyDown = (e) => {
    // Handle Enter key for lists
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer.parentElement;

        // If we're in a list item, handle it properly
        if (element && (element.tagName === 'LI' || element.closest('li'))) {
          e.preventDefault();

          // Check if we're at the end of a list item
          const listItem = element.tagName === 'LI' ? element : element.closest('li');
          if (listItem && range.endOffset === listItem.textContent.length) {
            // Exit the list or create new item
            execCommand('insertText', '\n');
          }
        }
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertList = (ordered = false) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    execCommand(command);
  };

  const formatText = (format) => {
    switch (format) {
      case 'bold':
        execCommand('bold');
        break;
      case 'italic':
        execCommand('italic');
        break;
      case 'underline':
        execCommand('underline');
        break;
      case 'quote':
        execCommand('formatBlock', 'blockquote');
        break;
      case 'code':
        execCommand('formatBlock', 'pre');
        break;
      default:
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    execCommand('insertText', text);
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Formatting Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px 8px 0 0',
          backgroundColor: 'background.paper'
        }}
      >
        <Tooltip title="Bold">
          <ToggleButton
            value="bold"
            selected={isActive.bold}
            onChange={() => formatText('bold')}
            size="small"
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatBold fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Italic">
          <ToggleButton
            value="italic"
            selected={isActive.italic}
            onChange={() => formatText('italic')}
            size="small"
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatItalic fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Underline">
          <ToggleButton
            value="underline"
            selected={isActive.underline}
            onChange={() => formatText('underline')}
            size="small"
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatUnderlined fontSize="small" />
          </ToggleButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => insertList(false)}
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Numbered List">
          <IconButton
            size="small"
            onClick={() => insertList(true)}
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Link">
          <IconButton
            size="small"
            onClick={insertLink}
            sx={{ minWidth: 32, height: 32 }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Quote">
          <IconButton
            size="small"
            onClick={() => formatText('quote')}
            sx={{ minWidth: 32, height: 32 }}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Code Block">
          <IconButton
            size="small"
            onClick={() => formatText('code')}
            sx={{ minWidth: 32, height: 32 }}
          >
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Editor */}
      <Box
        component="div"
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        data-placeholder={value ? '' : placeholder}
        sx={{
          minHeight: '120px',
          padding: '16px',
          border: '1px solid',
          borderColor: 'divider',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          backgroundColor: 'background.paper',
          fontSize: '1rem',
          fontFamily: 'inherit',
          lineHeight: 1.5,
          outline: 'none',
          overflowY: 'auto',
          maxHeight: '300px',
          resize: 'vertical',

          '&:focus': {
            borderColor: 'primary.main',
          },

          '&:empty:before': {
            content: 'attr(data-placeholder)',
            color: 'text.secondary',
            pointerEvents: 'none',
          },

          // List styles
          '& ul, & ol': {
            margin: '8px 0',
            paddingLeft: '24px',
          },

          '& li': {
            marginBottom: '4px',
          },

          // Link styles
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'none',
            }
          },

          // Quote styles
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            paddingLeft: '16px',
            margin: '16px 0',
            fontStyle: 'italic',
            backgroundColor: 'action.hover',
          },

          // Code styles
          '& pre': {
            backgroundColor: 'grey.100',
            padding: '12px',
            borderRadius: '4px',
            overflowX: 'auto',
            fontFamily: 'monospace',
            margin: '8px 0',
          }
        }}
      />

      {/* Character Counter */}
      {maxLength && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 0.5,
            fontSize: '0.75rem',
            color: value.length > maxLength * 0.9 ? 'error.main' : 'text.secondary'
          }}
        >
          {value.length}/{maxLength}
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;
