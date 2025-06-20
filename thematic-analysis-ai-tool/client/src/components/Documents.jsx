import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Link,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Modal,
  TextField,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  alpha,
  Fade,
  Zoom,
  Toolbar,
} from '@mui/material';
import { AnimatedCard, GlassPanel, GlowButton } from './StyledComponents';
import ThemeToggle from './ThemeToggle';
import { ThemeModeContext } from '../App';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import SaveIcon from '@mui/icons-material/Save';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Added for upload button
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'; // Added for toggle collapse
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'; // Added for toggle expand
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Added for comment button
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Added for assign code button
import { styled } from '@mui/system';
import { documentsApi, projectsApi } from '../utils/api'; // Import both the documents API and projects API

// Custom theme augmentation
const getCustomTheme = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    primary: {
      lighter: isDark ? alpha(theme.palette.primary.main, 0.2) : '#E3F2FD',
      light: isDark ? alpha(theme.palette.primary.main, 0.4) : '#90CAF9',
      main: theme.palette.primary.main,
      dark: theme.palette.primary.dark,
    },
    transitions: {
      buttonHover: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cardHover: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };
};

const DropzoneArea = styled(Box)(({ theme, isdragging }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const customColors = getCustomTheme(theme);
  
  return {
    border: '2px dashed',
    borderColor: isdragging === 'true' 
      ? theme.palette.primary.main 
      : isDarkMode ? theme.palette.grey[600] : theme.palette.grey[300],
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(4), // Reduced padding from 6 to 4
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isdragging === 'true' 
      ? (isDarkMode ? alpha(theme.palette.primary.main, 0.15) : customColors.primary.lighter)
      : (isDarkMode ? alpha(theme.palette.background.paper, 0.6) : theme.palette.grey[50]),
    transition: 'all 0.3s ease',
    width: '100%',
    minHeight: 140, // Reduced from 200 to 140
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(2),
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: isDarkMode 
        ? alpha(theme.palette.primary.main, 0.15) 
        : customColors.primary.lighter,
      boxShadow: isDarkMode 
        ? `0 0 8px ${alpha(theme.palette.primary.main, 0.4)}` 
        : 'none',
    },
  };
});

// Helper function to get the appropriate icon for each file type
const getFileIcon = (fileType, iconProps = {}) => {
  const fileExtension = (typeof fileType === 'string') 
    ? fileType.toLowerCase()
    : '';
  
  // Handle document_type values from API
  switch(fileExtension) {
    case 'pdf':
      return <PictureAsPdfIcon {...iconProps} />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <TableChartIcon {...iconProps} />;
    case 'docx':
    case 'doc':
    case 'text':
      return <ArticleIcon {...iconProps} />;
    default:
      return <InsertDriveFileIcon {...iconProps} />;
  }
};

const FileTypeIcon = ({ fileType }) => {
  const theme = useTheme();
  const iconProps = { 
    sx: { 
      fontSize: 40, 
      color: theme.palette.primary.main,
      filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 3px rgba(255,255,255,0.2))' : 'none',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'scale(1.05)'
      }
    } 
  };
  
  switch(fileType) {
    case 'pdf':
      return <PictureAsPdfIcon {...iconProps} />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <TableChartIcon {...iconProps} />;
    default:
      return <ArticleIcon {...iconProps} />;
  }
};

function Documents({ 
  projectId, 
  setCodesModalOpen, 
  selection, 
  setSelection, 
  bubbleAnchor, 
  setBubbleAnchor,
  handleBubbleCodesClick,
  setPendingCodeSelection,  
  commentData,
  setCommentData,
  codeAssignments,
  setCodeAssignments,
  documents = [],
  setDocuments, // Parent component's documents state setter
  refreshSidebar, // New prop to trigger sidebar refresh when documents change
  selectedDocumentId, // New prop to handle document selection from navigation
  setSelectedDocumentId, // New prop to clear selection after processing
  onDocumentsUpdated = null // Callback for when documents are updated
}) {
  const theme = useTheme();
  const { themeMode } = useContext(ThemeModeContext);
  const customTheme = useMemo(() => getCustomTheme(theme), [theme]);
  // State to control panel expansion (true = expanded, false = collapsed)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  // Enhanced button style - used throughout component
  const enhancedButtonStyle = {
    transition: customTheme.transitions.buttonHover,
    borderRadius: theme.shape.borderRadius * 1.2,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 2px 8px ${alpha(theme.palette.common.black, 0.25)}`
      : `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 4px 12px ${alpha(theme.palette.common.black, 0.35)}`
        : `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
    },
    '&:active': {
      transform: 'translateY(1px)',
    }
  };
  
  // State variables
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileData, setFileData] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [showBubble, setShowBubble] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [tempSelection, setTempSelection] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  // Added state for fetched documents
  const [projectDocuments, setProjectDocuments] = useState(documents || []);
  const [isLoading, setIsLoading] = useState(false);
  
  // Added state for active document details
  const [activeDocument, setActiveDocument] = useState(null);
  const [documentSegments, setDocumentSegments] = useState([]);
  const [loadingDocument, setLoadingDocument] = useState(false);
  // Debug - log document props when they change
  useEffect(() => {
    console.log(`Received ${documents ? documents.length : 0} documents from parent component:`, documents);
    
    // Update from parent documents prop if it exists and is an array
    if (documents && Array.isArray(documents)) {
      setProjectDocuments(documents);
    } else {
      console.warn("Documents prop is not valid:", documents);
    }
  }, [documents]);
  
  // Handle selected document ID from navigation
  useEffect(() => {
    if (selectedDocumentId && documents && Array.isArray(documents)) {
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      if (selectedDoc) {
        console.log("Processing selected document from navigation:", selectedDoc);
        handleDocumentSelect(selectedDoc);
        // Clear the selected document ID after processing
        if (setSelectedDocumentId) {
          setSelectedDocumentId(null);
        }
      } else {
        console.warn(`Document with id ${selectedDocumentId} not found in documents array`);
      }
    }
  }, [selectedDocumentId, documents, setSelectedDocumentId]);
  
  // Fetch documents only if needed (no documents from props)
  useEffect(() => {
    if (projectId && (!documents || documents.length === 0)) {
      console.log("No documents from props, fetching directly...");
      fetchProjectDocuments();
    }
  }, [projectId, documents]);
    // Fetch documents function using the comprehensive project endpoint
  const fetchProjectDocuments = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      console.log(`Fetching project ${projectId} with all document data from API`);
      const projectData = await projectsApi.getProjectWithContent(projectId);
      console.log("API returned comprehensive project data:", projectData);
      
      if (projectData && projectData.documents && Array.isArray(projectData.documents)) {
        console.log(`Setting ${projectData.documents.length} documents to state`);
        setProjectDocuments(projectData.documents);
        
        // Update parent component state if provided
        if (setDocuments) {
          setDocuments(projectData.documents);
        }
        
        // Call callback if provided (safely check if it exists and is a function)
        if (typeof onDocumentsUpdated === 'function') {
          onDocumentsUpdated(projectData.documents);
        }
      } else {
        console.warn("Project data didn't include documents array:", projectData);
        setProjectDocuments([]);
      }
      
      // Refresh sidebar if callback provided
      if (typeof refreshSidebar === 'function') {
        refreshSidebar();
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setUploadError("Failed to fetch project data");
    } finally {
      setIsLoading(false);
    }
  };  // Handle document selection
  const handleDocumentSelect = (doc) => {
    console.log("Selected document:", doc);
    setActiveFile(doc.id);
    setActiveDocument(doc);
    setLoadingDocument(true);
    
    // Debug logging to help troubleshoot
    console.log("Complete document object:", doc);
    
    // With comprehensive project API, the document should already have segments
    if (doc.segments && Array.isArray(doc.segments)) {
      console.log(`Document has ${doc.segments.length} segments:`, doc.segments);
      setDocumentSegments(doc.segments);
      setLoadingDocument(false);
    } else {
      console.warn("Document doesn't have segments array:", doc);
      setDocumentSegments([]);
      setLoadingDocument(false);
      
      // If we somehow ended up with a document without segments, refetch the whole project
      // to ensure we have the most up-to-date data with all segments
      fetchProjectDocuments();
    }
  };
  
  // Handle file change when using the browse option
  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  // File change handler - just for UI
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  // Drag and drop handlers - just for UI
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  // File selection
  const handleFileSelect = (fileName) => {
    setActiveFile(fileName);
  };
  
  // File removal
  const handleRemoveFile = (fileName) => {
    setSelectedFiles(selectedFiles.filter(file => file.name !== fileName));
    if (activeFile === fileName) {
      setActiveFile(selectedFiles[0]?.name || null);
    }
  };
  
  // Handle single document upload
  const handleSingleUpload = async (file, name = null, description = null) => {
    if (!projectId) {
      throw new Error("Project ID is required for uploading documents");
    }
    
    try {
      console.log(`Uploading single document: ${file.name} to project ${projectId}`);
      const result = await documentsApi.uploadDocument(projectId, file, name, description);
      console.log('Single upload response:', result);
      return result;
    } catch (error) {
      console.error('Error uploading single document:', error);
      throw error;
    }
  };
  
  // Handle bulk upload
  const handleBulkUpload = async (files) => {
    if (!projectId) {
      throw new Error("Project ID is required for uploading documents");
    }

    try {
      console.log(`Uploading ${files.length} files to project ${projectId}`);
      const result = await documentsApi.bulkUploadDocuments(projectId, files);
      console.log('Bulk upload response:', result);
      return result;
    } catch (error) {
      console.error('Error bulk uploading documents:', error);
      throw error;
    }
  };
    // Handle upload of all selected files
  const handleUpload = async () => {
    if (!projectId) {
      setUploadError("No project selected. Please select a project first.");
      return;
    }

    if (selectedFiles.length === 0) {
      setUploadError("No files selected for upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      let result;
      
      if (selectedFiles.length === 1) {
        // Use single upload for one file
        console.log(`Uploading single file: ${selectedFiles[0].name} to project ${projectId}`);
        result = await handleSingleUpload(selectedFiles[0]);
      } else {
        // Use bulk upload for multiple files
        console.log(`Bulk uploading ${selectedFiles.length} files to project ${projectId}`);
        result = await handleBulkUpload(selectedFiles);
      }
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      setActiveFile(null);
      setUploadSuccess(true);
      
      // Refresh project data to get the updated documents with segments
      await fetchProjectDocuments();
      
    } catch (error) {
      console.error('Error during upload:', error);
      setUploadError(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };
    // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    if (!projectId || !documentId) {
      console.error("Project ID and Document ID are required for deletion");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log(`Deleting document ${documentId} from project ${projectId}`);
      await documentsApi.deleteDocument(documentId);
      
      // If the deleted document was the active one, clear active document
      if (activeFile === documentId) {
        setActiveFile(null);
        setActiveDocument(null);
        setDocumentSegments([]);
      }
      
      // Fetch fresh project data to ensure we have the most up-to-date document list
      // This will update all states via the fetchProjectDocuments function
      await fetchProjectDocuments();
      
      console.log("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      setFileError("Failed to delete document: " + (error.message || "Unknown error"));
    }  };
  
  // State for text selection toolbar
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });
  
  // Get surrounding context for the selection
  const getSelectionContext = useCallback((selection) => {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Try to get the containing paragraph or element
    const paragraph = container.parentElement || container;
    return paragraph.textContent || '';
  }, []);
  
  // Handle text selection in document segments
  const handleTextSelection = useCallback((e) => {
    // Don't process text selection if clicking inside the toolbar
    if (e && e.target && e.target.closest('.selection-toolbar')) {
      return;
    }

    const selection = window.getSelection();
    
    if (selection.toString().trim().length > 0) {
      // Get selection range
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Get the active document
      if (activeDocument) {
        // Calculate position for the floating toolbar
        setSelectionPosition({
          top: rect.top - 50, // Position above the selection
          left: rect.left + (rect.width / 2) - 75, // Center horizontally
        });
        
        // Set selection data
        const selectionData = {
          text: selection.toString(),
          documentId: activeDocument.id,
          documentName: activeDocument.name,
          context: getSelectionContext(selection),
          timestamp: new Date().toISOString()
        };
        
        setSelection(selectionData);
        setShowSelectionToolbar(true);
        
        // Save to parent component's state
        if (setSelection) {
          setSelection(selectionData);
        }
      }
    } else {
      // Don't hide toolbar when clicking on it
      if (e && e.target && !e.target.closest('.selection-toolbar')) {
        setShowSelectionToolbar(false);
      }
    }
  }, [activeDocument, setSelection, getSelectionContext]);
  
  // Handle Add Comment button click
  const handleAddComment = () => {
    if (selection) {
      setCommentModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };
  
  // Handle Assign Code button click
  const handleAssignCode = () => {
    if (selection) {
      setPendingCodeSelection(selection);
      setCodesModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };
  
  // Handle saving a new comment
  const handleSaveComment = () => {
    if (selection && newComment) {
      const comment = {
        id: Date.now(), // Temporary ID until saved to backend
        documentId: selection.documentId,
        documentName: selection.documentName,
        selectedText: selection.text,
        comment: newComment,
        timestamp: new Date().toISOString(),
        pageContext: selection.context || ''
      };
      
      // Add to comments array
      setCommentData(prev => [...prev, comment]);
      
      // Close modal and reset
      setCommentModalOpen(false);
      setNewComment('');
      setSelection(null);
    }
  };  // Attach and remove mouse up event handler for text selection
  useEffect(() => {
    if (activeDocument) {
      document.addEventListener('mouseup', handleTextSelection);
      
      return () => {
        document.removeEventListener('mouseup', handleTextSelection);
      };
    }
  }, [activeDocument, handleTextSelection]);
  
  // Click outside to close the selection toolbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle if toolbar is visible
      if (showSelectionToolbar) {
        // Clear selection on document click (but not on toolbar itself)
        const toolbar = document.querySelector('.selection-toolbar');
        if (toolbar && !toolbar.contains(event.target)) {
          setShowSelectionToolbar(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };  }, [showSelectionToolbar]);
  
  // Floating toolbar component for text selection actions
  const FloatingSelectionToolbar = () => {
    if (!showSelectionToolbar) return null;
    
    return (      <Paper
        className="selection-toolbar"
        elevation={5}
        sx={{
          position: 'fixed',
          top: `${selectionPosition.top}px`,
          left: `${selectionPosition.left}px`,
          zIndex: 1000,
          borderRadius: theme.shape.borderRadius * 1.5,
          boxShadow: theme.palette.mode === 'dark'
            ? `0 8px 20px ${alpha(theme.palette.common.black, 0.4)}`
            : `0 8px 20px ${alpha(theme.palette.common.black, 0.2)}`,
          transform: 'translate(-50%, -100%)',
          p: 0.7,
          display: 'flex',
          gap: 1,
        }}
      >
        <Tooltip title="Add Comment">
          <Button
            variant="contained"
            color="primary"
            startIcon={<ChatBubbleOutlineIcon />}
            onClick={handleAddComment}
            size="small"
            sx={{
              borderRadius: theme.shape.borderRadius * 1.5,
              fontWeight: 600,
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5
            }}
          >
            Add Comment
          </Button>
        </Tooltip>
        <Tooltip title="Assign Code">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LocalOfferIcon />}
            onClick={handleAssignCode}
            size="small"
            sx={{
              borderRadius: theme.shape.borderRadius * 1.5,
              fontWeight: 600,
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5
            }}
          >
            Assign Code
          </Button>
        </Tooltip>
      </Paper>
    );
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' }, 
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Left panel - file upload and document list - with animation */}
      <Box sx={{
        width: { 
          xs: '100%',
          sm: isPanelExpanded ? 280 : 50 // Width changes based on expansion state
        },
        height: { xs: 'auto', sm: '100%' },
        borderRight: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease', // Smooth transition when expanding/collapsing
        position: 'relative'
      }}>
        {/* Header with Toggle Button */}
        <Box sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {isPanelExpanded ? (
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', mb: 0 }}>
              Documents
            </Typography>
          ) : null}
          <IconButton 
            onClick={() => setIsPanelExpanded(prev => !prev)}
            size="small"
            sx={{ 
              ml: 'auto',
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.1),
              }
            }}
            aria-label={isPanelExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isPanelExpanded ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </Box>
        
        {/* Only show content when expanded */}
        {isPanelExpanded && (
          <>
            {/* Upload section */}
            <Box sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}>
              <DropzoneArea 
                isdragging={isDragging.toString()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input').click()}
                sx={{ mb: 2 }}
              >
                <CloudUploadIcon 
                  color="primary" 
                  sx={{ 
                    fontSize: 40, 
                    mb: 1,
                    filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 8px rgba(64,195,255,0.4))' : 'none'
                  }} 
                />
                <Typography variant="body1" component="div">
                  Drag & Drop Files
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  or click to browse
                </Typography>
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Supports text, PDF, DOCX, CSV files
                </Typography>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleSelectFiles}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.txt"
                />
              </DropzoneArea>

              {uploadError && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 1, mb: 2 }} 
                  onClose={() => setUploadError(null)}
                >
                  {uploadError}
                </Alert>
              )}

              {fileError && (
                <Alert 
                  severity="warning" 
                  sx={{ mt: 1, mb: 2 }} 
                  onClose={() => setFileError(null)}
                >
                  {fileError}
                </Alert>
              )}              {selectedFiles.length > 0 && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
                  sx={{
                    ...enhancedButtonStyle,
                    py: 1,
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  {uploading 
                    ? `Uploading ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}...` 
                    : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                  }
                </Button>
              )}
            </Box>
          
            {/* File list section */}
            <Box sx={{
              flexGrow: 1,
              overflowY: 'auto',
              px: 1,
              py: 1.5,
            }}>
              {/* Selected files section */}
              {selectedFiles.length > 0 && (
                <>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      px: 2, 
                      pt: 1, 
                      pb: 1, 
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: 0.5
                    }}
                  >
                    Selected Files
                  </Typography>
                  
                  {selectedFiles.map((file) => {
                    const fileName = file.name;
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    const isActive = activeFile === fileName;
                    
                    return (
                      <ListItem
                        key={fileName}
                        disablePadding
                        sx={{
                          mb: 0.5,
                          borderRadius: theme.shape.borderRadius,
                          backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                            : 'transparent',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleFileSelect(fileName)}
                          dense
                          sx={{
                            borderRadius: theme.shape.borderRadius,
                            py: 1,
                            '&:hover': {
                              backgroundColor: isActive
                                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                                : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {getFileIcon(fileExtension, { 
                              fontSize: 'small',
                              color: isActive ? 'primary' : 'inherit',
                            })}
                          </ListItemIcon>
                          <ListItemText 
                            primary={fileName}
                            primaryTypographyProps={{
                              noWrap: true,
                              sx: {
                                fontWeight: isActive ? 500 : 400,
                                fontSize: '0.9rem',
                                color: isActive 
                                  ? theme.palette.primary.main
                                  : theme.palette.text.primary
                              }
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(fileName);
                            }}
                            sx={{
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.grey[400] 
                                : theme.palette.grey[700],
                              '&:hover': {
                                color: theme.palette.error.main,
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                  
                  <Divider sx={{ my: 2 }} />
                </>
              )}
              
              {/* Uploaded Documents Section */}
              {projectDocuments.length > 0 && (
                <>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      px: 2, 
                      pt: 1, 
                      pb: 1, 
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: 0.5
                    }}
                  >
                    Uploaded Documents
                  </Typography>
                  
                  {projectDocuments.map((document) => {
                    const isActive = activeDocument && activeDocument.id === document.id;
                    return (
                      <ListItem
                        key={document.id}
                        disablePadding
                        sx={{
                          mb: 0.5,
                          borderRadius: theme.shape.borderRadius,
                          backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                            : 'transparent',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleDocumentSelect(document)}
                          dense
                          sx={{
                            borderRadius: theme.shape.borderRadius,
                            py: 1,
                            '&:hover': {
                              backgroundColor: isActive
                                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)
                                : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {getFileIcon(document.document_type, { 
                              fontSize: 'small',
                              color: isActive ? 'primary' : 'inherit',
                            })}
                          </ListItemIcon>
                          <ListItemText 
                            primary={document.name}
                            primaryTypographyProps={{
                              noWrap: true,
                              sx: {
                                fontWeight: isActive ? 500 : 400,
                                fontSize: '0.9rem',
                                color: isActive 
                                  ? theme.palette.primary.main
                                  : theme.palette.text.primary
                              }
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(document.id);
                            }}
                            sx={{
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.grey[400] 
                                : theme.palette.grey[700],
                              '&:hover': {
                                color: theme.palette.error.main,
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </>
              )}
              
              {projectDocuments.length === 0 && !uploading && (
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  color: theme.palette.text.secondary,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <ArticleIcon sx={{ fontSize: 40, opacity: 0.4, mb: 2 }} />
                  <Typography variant="body2">
                    No documents uploaded yet
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    Upload documents to get started
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
        {!isPanelExpanded && (
          <Box sx={{ 
            position: 'relative',
            height: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            pt: 2 
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                transform: 'rotate(-90deg)', 
                whiteSpace: 'nowrap', 
                position: 'absolute', 
                top: '50%', 
                left: -40, 
                color: theme.palette.text.secondary 
              }}
            >
              Documents
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Right panel - document content */}
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.default, 0.4) 
          : theme.palette.grey[50],
      }}>
        {/* Empty state */}
        {!activeFile && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            p: 3,
            textAlign: 'center'
          }}>
            <BookOutlinedIcon sx={{ fontSize: 60, color: theme.palette.action.disabled, mb: 2 }} />
            <Typography variant="h6" gutterBottom>No document selected</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 500, mb: 3 }}>
              Upload files using the panel on the left, or select a document to view its content here.
            </Typography>
          </Box>
        )}
        
        {/* Active file display */}
        {activeFile && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header with file name */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {activeDocument ? (
                  <>
                    {getFileIcon(activeDocument.document_type, { fontSize: 'medium' })}
                    <Box>
                      <Typography variant="h6">{activeDocument.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {activeDocument.file_size 
                          ? `${(activeDocument.file_size / 1024).toFixed(1)} KB` 
                          : ''}
                        {activeDocument.document_type && ` • ${activeDocument.document_type.toUpperCase()}`}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1">Loading document...</Typography>
                )}
              </Box>
              
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<AnalyticsIcon />}
                  sx={{
                    mr: 1,
                    ...enhancedButtonStyle
                  }}
                >
                  Analyze
                </Button>
              </Box>
            </Box>
              {/* Document Content - Segments */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                overflow: 'auto',
                p: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.4) 
                    : alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '4px',
                },
              }}
            >
              {loadingDocument ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={40} />
                  <Typography variant="body1" sx={{ ml: 2 }}>Loading document segments...</Typography>
                </Box>
              ) : activeDocument && documentSegments.length > 0 ? (
                <Paper 
                  elevation={0}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.4) 
                      : alpha(theme.palette.background.paper, 0.7),
                    borderRadius: 2,
                    p: 3,
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Document Segments
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Showing {documentSegments.length} segments from document "{activeDocument.name}"
                    </Typography>
                  </Box>
                  
                  {/* Display document segments */}
                  {documentSegments.map((segment, index) => (
                    <Box 
                      key={segment.id || index}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        mb: 2,
                        position: 'relative',
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.background.paper, 0.2) 
                            : alpha(theme.palette.background.paper, 0.7),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {segment.segment_type && (
                          <Chip 
                            size="small" 
                            label={`Line ${segment.line_number || index + 1}`}
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              height: 22, 
                              mr: 2,
                              fontSize: '0.7rem',
                              borderRadius: '4px',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.primary.main, 0.1) 
                                : alpha(theme.palette.primary.main, 0.05),
                            }}
                          />
                        )}
                        {segment.is_coded && (
                          <Chip 
                            size="small" 
                            label="Coded"
                            color="secondary"
                            variant="outlined"
                            sx={{ 
                              height: 22, 
                              fontSize: '0.7rem',
                              borderRadius: '4px',
                            }}
                          />
                        )}
                      </Box>                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontFamily: "'Roboto Mono', monospace",
                          fontSize: '0.95rem',
                          lineHeight: 1.6,
                          color: theme.palette.mode === 'dark' 
                            ? theme.palette.text.primary 
                            : theme.palette.text.primary,
                          userSelect: 'text', // Ensure text is selectable
                          cursor: 'text', // Show text cursor
                        }}                        onMouseUp={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
                          handleTextSelection(e);
                        }}
                      >
                        {segment.content}
                      </Typography>
                      {segment.code_names && segment.code_names.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {segment.code_names.map((code, i) => (
                            <Chip 
                              key={i} 
                              label={code}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Paper>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.7
                }}>
                  <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary" align="center">
                    No content available for this document.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Floating toolbar for text selection */}
      <FloatingSelectionToolbar />
      
      {/* Comment Modal */}
      <Dialog open={commentModalOpen} onClose={() => setCommentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Selected Text:
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.07),
              color: theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
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
            <Typography fontStyle="italic">
              {selection?.text}
            </Typography>
          </Paper>
          <Typography variant="subtitle1" gutterBottom>
            Your Comment:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment or annotation here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveComment} variant="contained" color="primary">
            Save Comment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Error snackbar */}
      <Snackbar 
        open={fileError ? true : false}
        autoHideDuration={6000} 
        onClose={() => setFileError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setFileError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {fileError}
        </Alert>
      </Snackbar>
      
      {/* Upload success snackbar */}
      <Snackbar 
        open={uploadSuccess}
        autoHideDuration={6000} 
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setUploadSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          Files uploaded successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Documents;