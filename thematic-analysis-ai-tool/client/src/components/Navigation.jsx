import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Slide,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FolderIcon from '@mui/icons-material/Folder';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import ProfileButton from './ProfileButton';
import { ThemeModeContext } from '../App';

function Navigation({ activeMenuItem, handleMenuItemClick, selectedFiles, documents, activeFile, setActiveFile, handleRemoveFile, onDocumentSelect, onNavigationToggle }) {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ThemeModeContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);

  // Notify parent component when navigation state changes
  React.useEffect(() => {
    if (onNavigationToggle) {
      onNavigationToggle(isExpanded);
    }
  }, [isExpanded, onNavigationToggle]);

  // Debug log of documents received from props
  useEffect(() => {
    if (documents && Array.isArray(documents)) {
      console.log(`Navigation received ${documents.length} documents:`, documents);
    }
  }, [documents]);

  const menuItems = [
    {
      name: 'Documents',
      icon: <DescriptionOutlinedIcon />,
      description: 'Manage research documents',
      hasChildren: true
    },
    {
      name: 'Research details',
      icon: <ScienceOutlinedIcon />,
      description: 'Configure research parameters'
    },
    {
      name: 'Comments',
      icon: <CommentOutlinedIcon />,
      description: 'View document annotations'
    },
    {
      name: 'Codebook',
      icon: <BookOutlinedIcon />,
      description: 'Organize research codes'
    },
    {
      name: 'Visualizations',
      icon: <BarChartOutlinedIcon />,
      description: 'Explore thematic analysis visualizations'
    }
  ];

  // Add click handler prevention to stop event propagation
  const handleButtonClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    handleMenuItemClick(item.name);
    if (item.hasChildren) {
      setDocumentsExpanded(!documentsExpanded);
    }
  };

  // Add event-catching overlay to prevent navigation from disappearing
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    const handleDragOver = (e) => {
      // Don't prevent default as we want the Files component to handle drops
      // But set our state to show we're being dragged over
      setIsDraggingOver(true);
    };
    
    const handleDragLeave = (e) => {
      setIsDraggingOver(false);
    };
    
    const handleDrop = (e) => {
      // Don't prevent default, let the Documents component handle the drop
      // But reset our state
      setIsDraggingOver(false);
    };

    // Add capture phase event listeners for drag events on the navigation element
    const navElement = document.querySelector('.navigation-wrapper');
    if (navElement) {
      navElement.addEventListener('dragover', handleDragOver, false);
      navElement.addEventListener('dragleave', handleDragLeave, false);
      navElement.addEventListener('drop', handleDrop, false);
    }

    return () => {
      // Remove event listeners on cleanup
      if (navElement) {
        navElement.removeEventListener('dragover', handleDragOver, false);
        navElement.removeEventListener('dragleave', handleDragLeave, false);
        navElement.removeEventListener('drop', handleDrop, false);
      }
    };
  }, []);

  // Render document files in navigation - use real documents from backend
  const renderDocumentFilesList = () => {
    // Use the documents array from props if available, otherwise show empty state
    const documentsToDisplay = documents && Array.isArray(documents) && documents.length > 0
      ? documents
      : [];
    
    return (
      <List disablePadding>
        {documentsToDisplay.length > 0 ? documentsToDisplay.map((doc) => (
          <ListItem 
            key={doc.id || doc._id}
            button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();              // Set selected document ID for the parent Dashboard component
              if (onDocumentSelect) {
                // Make sure we pass the document ID first, followed by the document object
                console.log(`Navigation: Selected document with ID ${doc.id}`);
                onDocumentSelect(doc.id, doc);
              }
            }}
            sx={{ 
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:last-child': {
                borderBottom: 'none'
              },
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.04)',
                transform: 'translateX(2px)',
              },
              transition: 'all 0.2s ease',
              backgroundColor: (activeFile === doc.id) 
                ? alpha(theme.palette.primary.main, 0.15)
                : 'transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FilePresentIcon fontSize="small" sx={{ 
                color: (activeFile === doc.id)
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary 
              }} />
            </ListItemIcon>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              width: '100%',
            }}>
              <Typography 
                sx={{ 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: (activeFile === doc.id)
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                }}
              >
                {doc.name || doc.file_name || 'Untitled Document'}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }}
              >
                {new Date(doc.created_at || doc.uploadDate || doc.upload_date || new Date()).toLocaleDateString()}
              </Typography>
            </Box>
          </ListItem>
        )) : (
          <ListItem sx={{ py: 2, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No documents uploaded yet
            </Typography>
          </ListItem>
        )}
      </List>
    );
  };

  return (
    <Slide direction="right" in={true} mountOnEnter unmountOnExit>
      <Box
        className="navigation-wrapper"
        sx={{
          width: isExpanded ? 280 : 80,
          bgcolor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          transition: 'all 0.3s ease-in-out',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1200,
          boxShadow: isDraggingOver 
            ? `0 0 0 2px ${theme.palette.primary.main}, 0 0 15px ${theme.palette.primary.main}`
            : (mode === 'dark' ? '2px 0 8px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.05)'),
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.background.paper,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.grey[300],
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.grey[400],
          }
        }}
      >
        {/* Adjust spacing to prevent overlap */}
        <Box sx={{ height: '32px' }} />

        {/* Logo - Fixed position to prevent movement */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          bgcolor: theme.palette.background.paper,
          zIndex: 10,
          pb: 2
        }}>
          {isExpanded && (
            <Fade in={isExpanded} timeout={300}>
              <Typography 
                variant="h5" 
                sx={{ 
                  p: 2, 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Thematic Analysis
              </Typography>
            </Fade>
          )}

          {/* Divider */}
          <Divider sx={{ mb: 0 }} />
        </Box>

        {/* Adjusted toggle button position and added glow effect */}
        <Box sx={{ position: 'relative', zIndex: 1201 }}>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              position: 'absolute',
              right: -2,
              top: -50, // Moved the button up
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 0 10px rgba(0, 123, 255, 0.5)', // Added glow effect
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                transform: 'scale(1.1)',
                boxShadow: '0 0 15px rgba(0, 123, 255, 0.7)', // Enhanced glow on hover
              },
              zIndex: 1,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>

        {/* Theme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: isExpanded ? 'flex-start' : 'center' }}>
          <Tooltip title={isExpanded ? '' : (theme.palette.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode')}>
            <IconButton 
              onClick={toggleColorMode} 
              color="inherit" 
              sx={{ 
                mr: isExpanded ? 1 : 0,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'rotate(30deg)',
                },
              }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          {isExpanded && (
            <Fade in={isExpanded}>
              <Typography variant="body2" color="textSecondary">
                {theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Typography>
            </Fade>
          )}
        </Box>

        {/* Additional spacing buffer */}
        <Box sx={{ height: '16px' }} />        
        
        {/* Menu Items */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          width: '100%',
        }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.name}>
              <Tooltip 
                title={!isExpanded ? item.name : ''}
                placement="right"
              >
                <Button
                  variant={activeMenuItem === item.name ? 'contained' : 'text'}
                  onClick={(e) => handleButtonClick(e, item)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  sx={{
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    p: 2,
                    borderRadius: 2,
                    gap: 2,
                    color: activeMenuItem === item.name ? 'white' : theme.palette.text.primary,
                    bgcolor: activeMenuItem === item.name ? theme.palette.primary.main : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    transform: hoveredItem === item.name && !activeMenuItem === item.name ? 'translateX(4px)' : 'none',
                    '&:hover': {
                      bgcolor: activeMenuItem === item.name 
                        ? theme.palette.primary.dark 
                        : theme.palette.action.hover,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    maxWidth: '100%',
                    textOverflow: 'ellipsis',
                    '&:after': activeMenuItem === item.name ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '4px',
                      bgcolor: theme.palette.primary.dark,
                    } : {},
                  }}
                >
                  {item.icon}
                  <Collapse in={isExpanded} orientation="horizontal">
                    <Box sx={{ 
                      textAlign: 'left', 
                      minWidth: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      flexGrow: 1,
                      width: '100%',
                      overflow: 'hidden',
                    }}>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="body1" fontWeight={500} noWrap>
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            color: activeMenuItem === item.name 
                              ? 'rgba(255, 255, 255, 0.8)' 
                              : theme.palette.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          noWrap
                        >
                          {item.description}
                        </Typography>
                      </Box>
                      {item.hasChildren && isExpanded && (
                        <Box 
                          component="span"
                          sx={{
                            ml: 1,
                            padding: 0,
                            color: activeMenuItem === item.name ? 'white' : theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {documentsExpanded ? 
                            <ExpandLessIcon fontSize="small" /> : 
                            <ExpandMoreIcon fontSize="small" />
                          }
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Button>
              </Tooltip>
              
              {/* Documents section with proper Selected Files section */}
              {item.name === 'Documents' && documentsExpanded && activeMenuItem === 'Documents' && (
                <Collapse in={documentsExpanded && isExpanded} timeout="auto" unmountOnExit>
                  <Box 
                    sx={{ 
                      ml: 2,
                      mr: 1,
                      mt: 1.5, 
                      mb: 2, 
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      maxWidth: '100%',
                    }}
                  >
                    {/* Selected Files Header */}
                    <ListItem 
                      sx={{ 
                        py: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.primary.lighter || 'rgba(25, 118, 210, 0.08)',
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 36, 
                        display: 'flex',
                        justifyContent: 'center',
                      }}>
                        <FolderIcon fontSize="small" sx={{ color: theme.palette.primary.dark }} />
                      </ListItemIcon>                      <ListItemText 
                        primary="Project Documents"
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: '0.9rem',
                          color: theme.palette.primary.dark,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      />
                    </ListItem>                    {/* Files List */}
                    <Box sx={{ 
                      maxHeight: '250px', 
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      scrollbarWidth: 'thin',
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: theme.palette.background.paper,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.grey[300],
                        borderRadius: 2,
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: theme.palette.grey[400],
                      }
                    }}>
                      {renderDocumentFilesList()}
                    </Box>
                  </Box>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Profile Button at Bottom */}
        <Box sx={{ 
          mb: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          transition: 'all 0.3s ease'
        }}>
          <ProfileButton sidebarMode={!isExpanded} />
        </Box>

        {/* Footer */}
        <Fade in={isExpanded} timeout={300}>
          <Typography 
            variant="caption" 
            sx={{ 
              p: 2, 
              color: theme.palette.text.secondary,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
            }}
          >
            © 2024 Thematic Analysis Tool
          </Typography>
        </Fade>
      </Box>
    </Slide>
  );
}

export default Navigation;