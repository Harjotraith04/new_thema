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
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  useTheme,
  Fade,
  Zoom,
  Collapse,
  Avatar,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CodeIcon from '@mui/icons-material/Code';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { EnhancedTableRow, GlowButton, FrostedGlassPaper } from './StyledComponents';

function Codebook({ codeAssignments }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  
  // Sample code categories for demonstration
  const codeCategories = [
    { name: 'Emotions', color: '#8B5CF6' },
    { name: 'Behaviors', color: '#10B981' },
    { name: 'Processes', color: '#3B82F6' },
    { name: 'Concepts', color: '#F59E0B' },
    { name: 'Relations', color: '#EC4899' }
  ];

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleRowClick = (id) => {
    setSelectedRow(selectedRow === id ? null : id);
  };

  // Filter assignments based on search query
  const filteredAssignments = codeAssignments.filter(
    (assignment) => 
      assignment.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to get a random color for codes that don't have a defined color
  const getRandomColor = (text) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
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
              Codebook
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and organize your thematic codes and assignments
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Search codes..."
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
            
            <Tooltip title="Filter codes">
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
      
      <Fade in={true} style={{ transitionDelay: '200ms' }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {codeCategories.map((category) => (
            <Chip
              key={category.name}
              label={category.name}
              sx={{
                borderRadius: '16px',
                backgroundColor: alpha(category.color, 0.15),
                color: category.color,
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: alpha(category.color, 0.25),
                }
              }}
            />
          ))}
        </Box>
      </Fade>
      
      {codeAssignments.length === 0 ? (
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
              <BookmarkBorderIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              No Codes Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mb: 2 }}>
              Your codebook is empty. Select text in a document and use the Codes button to assign codes, or create new codes manually.
            </Typography>
            <GlowButton
              variant="contained"
              startIcon={<CodeIcon />}
              size="large"
            >
              Create New Code
            </GlowButton>
          </FrostedGlassPaper>
        </Zoom>
      ) : (
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <FrostedGlassPaper sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Selected Text</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Context</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <React.Fragment key={assignment.id}>
                      <EnhancedTableRow 
                        hover
                        isSelected={selectedRow === assignment.id}
                        onClick={() => handleRowClick(assignment.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Chip
                            label={assignment.code}
                            size="small"
                            sx={{
                              borderRadius: '12px',
                              backgroundColor: alpha(getRandomColor(assignment.code), 0.15),
                              color: getRandomColor(assignment.code),
                              fontWeight: 500,
                              '&:hover': {
                                backgroundColor: alpha(getRandomColor(assignment.code), 0.25),
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{assignment.documentName}</TableCell>
                        <TableCell>{truncateText(assignment.selectedText, 50)}</TableCell>
                        <TableCell>{truncateText(assignment.context, 50)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error">
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </EnhancedTableRow>
                      
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0, borderBottom: 'none' }}>
                          <Collapse in={selectedRow === assignment.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.02) }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Complete Quote
                              </Typography>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  backgroundColor: theme.palette.background.paper,
                                  borderRadius: theme.shape.borderRadius * 1.5,
                                }}
                              >
                                <Typography variant="body2">
                                  "{assignment.selectedText}"
                                </Typography>
                              </Paper>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Document
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {assignment.documentName}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Created
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {assignment.timestamp}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Category
                                  </Typography>
                                  <Chip 
                                    label={codeCategories[Math.floor(Math.random() * codeCategories.length)].name}
                                    size="small"
                                    sx={{ 
                                      height: '22px',
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </FrostedGlassPaper>
        </Fade>
      )}
    </Box>
  );
}

export default Codebook;