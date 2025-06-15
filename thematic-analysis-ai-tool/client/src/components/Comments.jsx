import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  useTheme,
  alpha,
  Fade,
  Zoom,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import ChatIcon from '@mui/icons-material/Chat';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { FrostedGlassPaper, GlowButton } from './StyledComponents';

function Comments({ commentData }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Filter comments based on search query
  const filteredComments = commentData.filter(
    (comment) => 
      comment.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.selectedText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Function to format timestamp to a more readable format
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Function to truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Get random user initials for avatar
  const getUserInitials = (comment) => {
    // Use document name as a base for deterministic initials
    const name = comment.documentName || "User";
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Fade in={true} style={{ transitionDelay: '100ms' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Comments & Annotations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage all comments and annotations in your research documents
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Search comments..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: theme.shape.borderRadius * 1.5,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.05)
                    : alpha(theme.palette.common.black, 0.02),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.07)
                      : alpha(theme.palette.common.black, 0.04),
                  },
                }
              }}
              sx={{
                minWidth: '200px',
              }}
            />
            
            <Tooltip title="Sort comments">
              <IconButton
                size="small"
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.05)
                    : alpha(theme.palette.common.black, 0.02),
                }}
              >
                <SortIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter comments">
              <IconButton 
                size="small"
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.05)
                    : alpha(theme.palette.common.black, 0.02),
                }}
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Fade>
      
      {commentData.length === 0 ? (
        <Zoom in={true} style={{ transitionDelay: '300ms' }}>
          <FrostedGlassPaper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Avatar
              sx={{
                width: 70,
                height: 70,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                mb: 1,
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              No Comments Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mb: 2 }}>
              You haven't added any comments or annotations to your documents. Select text in a document and click the Comment button to add your first annotation.
            </Typography>
            <GlowButton
              variant="contained"
              startIcon={<ChatIcon />}
              size="large"
            >
              Add First Comment
            </GlowButton>
          </FrostedGlassPaper>
        </Zoom>
      ) : (
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <Grid container spacing={2}>
            {filteredComments.map((comment) => (
              <Grid item xs={12} md={6} key={comment.id}>
                <Card 
                  elevation={0}
                  sx={{
                    borderRadius: theme.shape.borderRadius * 1.5,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.7)
                      : theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.divider, 0.1)
                      : theme.palette.divider}`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
                      : `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? `0 6px 25px ${alpha(theme.palette.common.black, 0.3)}`
                        : `0 6px 25px ${alpha(theme.palette.common.black, 0.1)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {getUserInitials(comment)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {comment.documentName || "Untitled Document"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.timestamp) || "No date"}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Chip 
                        label="Comment" 
                        size="small"
                        icon={<ChatIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          height: 24,
                          '& .MuiChip-icon': { 
                            color: theme.palette.primary.main,
                          }
                        }}
                      />
                    </Box>
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: alpha(theme.palette.warning.main, 0.07),
                        color: theme.palette.mode === 'dark' 
                          ? theme.palette.warning.light
                          : theme.palette.warning.dark,
                        borderRadius: theme.shape.borderRadius,
                        position: 'relative',
                        pl: 3,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          borderTopLeftRadius: theme.shape.borderRadius,
                          borderBottomLeftRadius: theme.shape.borderRadius,
                          backgroundColor: theme.palette.warning.main,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <FormatQuoteIcon 
                          sx={{ 
                            fontSize: 16, 
                            opacity: 0.6, 
                            mt: 0.3,
                          }} 
                        />
                        <Typography variant="body2" fontStyle="italic">
                          {comment.selectedText || "No selected text"}
                        </Typography>
                      </Box>
                    </Paper>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {comment.comment || "No comment text"}
                    </Typography>
                    
                    {comment.pageContext && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Context: {truncateText(comment.pageContext, 100)}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Tooltip title="Edit comment">
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete comment">
                        <IconButton size="small" color="error">
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}
    </Box>
  );
}

export default Comments;