import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Zoom,
  Fade,
  Backdrop,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Tooltip,
  alpha,
} from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CodeIcon from '@mui/icons-material/Code';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import BookmarkIcon from '@mui/icons-material/Bookmark';

import ProjectSettings from '../components/ProjectSettings';
import ResearchDetails from '../components/ResearchDetails';
import Comments from '../components/Comments';
import Codebook from '../components/Codebook';
import CodeModals from '../components/CodeModals';
import OptionsBar from '../components/OptionsBar';
import Navigation from '../components/Navigation';
import Documents from '../components/Documents';
import VisualizationDashboard from '../components/VisualizationDashboard';
import '../components/VisualizationDashboard.css';
import { FrostedGlassPaper } from '../components/StyledComponents';
import { projectsApi } from '../utils/api';

function Dashboard() {
  const theme = useTheme();
  const { projectId } = useParams();
  const [selectedAnalysis, setSelectedAnalysis] = useState('');
  const [selectedAIModel, setSelectedAIModel] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');  const [activeMenuItem, setActiveMenuItem] = useState('Documents');
  const [openSpeedDial, setOpenSpeedDial] = useState(false);
  const [projectData, setProjectData] = useState({ title: 'Project', description: '' });
  const [navigationExpanded, setNavigationExpanded] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [selection, setSelection] = useState(null);
  const [bubbleAnchor, setBubbleAnchor] = useState(null);
  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [codes, setCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [pendingCodeSelection, setPendingCodeSelection] = useState(null);
  const [createCodeDialogOpen, setCreateCodeDialogOpen] = useState(false);
  const [newCodeFields, setNewCodeFields] = useState({
    name: '',
    definition: '',
    description: '',
    category: '',
    color: ''  });
  
  // SpeedDial state
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  
  const handleSpeedDialOpen = () => setSpeedDialOpen(true);
  const handleSpeedDialClose = () => setSpeedDialOpen(false);

  // State for documents uploaded - start with empty array
  const [documents, setDocuments] = useState([]);

  // Add state for comments and code assignments
  const [commentData, setCommentData] = useState([]);
  const [codeAssignments, setCodeAssignments] = useState([]);

  // State to track selected document for processing
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  // Fetch complete project data on component mount - includes documents, segments, codes, quotes, annotations
  React.useEffect(() => {
    const fetchProjectWithContent = async () => {
      try {
        if (!projectId) {
          return;
        }
        
        console.log(`Fetching complete project data for project ${projectId}`);
        const data = await projectsApi.getProjectWithContent(projectId);
        
        // Debug: Log the complete response to see the structure
        console.log("Complete project data response:", data);
        
        // Update project data
        setProjectData({
          id: data.id,
          title: data.title,
          description: data.description || '',
          created_at: data.created_at,
          created_by: data.created_by,
          // Include any other project level data
        });

        // Update documents if they exist in the response
        if (data.documents && Array.isArray(data.documents)) {
          console.log(`Found ${data.documents.length} documents in project data`);
          console.log("Document data sample:", data.documents[0]);
          setDocuments(data.documents);
        } else {
          console.warn("No documents array found in response or it's not an array");
        }

        // Update codes if they exist in the response
        if (data.codes && Array.isArray(data.codes)) {
          console.log(`Found ${data.codes.length} codes in project data`);
          setCodes(data.codes);
        } else {
          console.warn("No codes array found in response or it's not an array");
        }

        // Set code assignments if available
        if (data.code_assignments && Array.isArray(data.code_assignments)) {
          console.log(`Found ${data.code_assignments.length} code assignments`);
          setCodeAssignments(data.code_assignments);
        }

        // Set comments/annotations if available
        if (data.annotations && Array.isArray(data.annotations)) {
          console.log(`Found ${data.annotations.length} annotations`);
          setCommentData(data.annotations);
        }
      
      } catch (err) {
        console.error('Error fetching complete project data:', err);
        console.error('Error details:', err.message);
        // Try to get a more detailed error
        if (err.stack) {
          console.error('Error stack:', err.stack);
        }
      }
    };

    fetchProjectWithContent();
  }, [projectId]);

  const handleMenuItemClick = (menuItem) => {
    setActiveMenuItem(menuItem);
  };

  const handleNavigationToggle = (isExpanded) => {
    setNavigationExpanded(isExpanded);
  };

  // Function to refresh project data after operations
  const refreshProjectData = async () => {
    try {
      console.log(`Refreshing project data for project ${projectId}`);
      const data = await projectsApi.getProjectWithContent(projectId);
      
      // Update all relevant state with fresh data
      setProjectData({
        id: data.id,
        title: data.title,
        description: data.description || '',
        created_at: data.created_at,
        created_by: data.created_by,
      });
      
      if (data.documents && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
      
      if (data.codes && Array.isArray(data.codes)) {
        setCodes(data.codes);
      }
      
      if (data.code_assignments && Array.isArray(data.code_assignments)) {
        setCodeAssignments(data.code_assignments);
      }
      
      if (data.annotations && Array.isArray(data.annotations)) {
        setCommentData(data.annotations);
      }
      
      console.log('Project data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing project data:', err);
    }
  };

  const handleBubbleCodesClick = () => {
    setPendingCodeSelection(selection);
    setCodesModalOpen(true);
  };

  const handleRemoveFile = (fileName, event) => {
    event.stopPropagation();
    const newFiles = selectedFiles.filter(f => f.name !== fileName);
    setSelectedFiles(newFiles);
    
    if (activeFile === fileName) {
      setActiveFile(newFiles.length > 0 ? newFiles[0].name : null);
    }
  };
  
  // Handle document selection from navigation
  const handleDocumentSelect = (documentId, fileObject) => {
    // Ensure we're on the Documents page
    setActiveMenuItem('Documents');
    
    console.log('Document selected:', documentId, 'with fileObject:', !!fileObject);
    
    // If file object is provided, update the document with the file object
    if (fileObject) {
      // Save this file in selectedFiles if not already there
      if (!selectedFiles.some(f => f.name === fileObject.name)) {
        console.log('Adding file to selectedFiles:', fileObject.name);
        setSelectedFiles(prevFiles => [...prevFiles, fileObject]);
      }
      
      if (documentId) {
        // Update the document with the file object
        const updatedDocs = documents.map(doc => {
          if (doc.id === documentId) {
            // Store the fileObject in document
            return {...doc, fileObject};
          }
          return doc;
        });
        setDocuments(updatedDocs);
      } else {
        // We have a file but no document ID - might be a direct file selection
        // Check if we have a document that matches this file name
        const fileName = fileObject.name;
        const matchingDoc = documents.find(doc => 
          doc.filename === fileName || doc.title === fileName
        );
        
        if (matchingDoc) {
          // Update the matching document
          const updatedDocs = documents.map(doc => {
            if (doc.id === matchingDoc.id) {
              return {...doc, fileObject};
            }
            return doc;
          });
          setDocuments(updatedDocs);
          setSelectedDocumentId(matchingDoc.id);
          return; // Exit early since we've set the document ID
        }
      }
    }
    
    // Set the selected document ID which will be picked up by Documents component
    setSelectedDocumentId(documentId);
  };

  // Speed dial actions
  const actions = [
    { icon: <NoteAddIcon />, name: 'New Document', onClick: () => setActiveMenuItem('Documents') },
    { icon: <CodeIcon />, name: 'Add Code', onClick: () => setCreateCodeDialogOpen(true) },
    { icon: <InsertChartIcon />, name: 'View Analysis', onClick: () => setActiveMenuItem('Visualizations') },
    { icon: <BookmarkIcon />, name: 'View Codes', onClick: () => setActiveMenuItem('Codebook') },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        position: 'relative',
        backgroundImage: theme.palette.mode === 'dark' 
          ? `radial-gradient(circle at 10% 10%, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 50%), 
             radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.dark, 0.1)} 0%, transparent 100%)`
          : `radial-gradient(circle at 10% 10%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 50%), 
             radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.light, 0.05)} 0%, transparent 100%)`
      }}
    >
      {/* Project Header with Settings */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,        }}
      >
        {/* Project Settings with Collaborator Management */}
        <ProjectSettings projectId={projectId} />
      </Box>      <Navigation
        activeMenuItem={activeMenuItem}
        handleMenuItemClick={handleMenuItemClick}
        selectedFiles={selectedFiles}
        documents={documents}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        handleRemoveFile={handleRemoveFile}
        onDocumentSelect={handleDocumentSelect}
        onNavigationToggle={handleNavigationToggle}
      />      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          p: { xs: 2, sm: 3 },
          gap: 3,
          marginLeft: navigationExpanded ? '280px' : '80px',
          width: navigationExpanded ? 'calc(100% - 280px)' : 'calc(100% - 80px)',
          transition: 'all 0.3s ease-in-out',
          height: '100vh',
          overflow: 'hidden', // Prevent the main container from scrolling
          position: 'fixed',
          top: 0,
          right: 0,
        }}
      >
        {/* Header Section with Zoom animation */}
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <FrostedGlassPaper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex',
              flexDirection: 'column',
              background: `linear-gradient(120deg, 
                ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)}, 
                ${alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.8 : 0.95)})`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }
            }}
          >
            <Typography 
              variant="h5" 
              fontWeight="600"
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent',
              }}
            >
              {activeMenuItem}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
              {activeMenuItem === 'Research details' && 'Configure your research parameters and AI models'}
              {activeMenuItem === 'Documents' && 'Upload and analyze your research documents'}
              {activeMenuItem === 'Comments' && 'View and manage your document annotations'}
              {activeMenuItem === 'Codebook' && 'Organize and structure your research codes'}
              {activeMenuItem === 'Visualizations' && 'Explore your thematic analysis through various visualizations'}
            </Typography>
          </FrostedGlassPaper>
        </Zoom>        {/* Main Content Area with Fade animation */}        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <FrostedGlassPaper 
            sx={{ 
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              position: 'relative',
              overflow: 'auto', // Allow internal scrolling within the content area
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              height: '100%', // Take full height of parent
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '30%',
                height: '1px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '30%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${theme.palette.secondary.main})`,
              }
            }}
          >
            {activeMenuItem === 'Research details' && (
              <ResearchDetails
                projectId={projectId}
                selectedAnalysis={selectedAnalysis}
                setSelectedAnalysis={setSelectedAnalysis}
                selectedAIModel={selectedAIModel}
                setSelectedAIModel={setSelectedAIModel}
                openaiApiKey={openaiApiKey}
                setOpenaiApiKey={setOpenaiApiKey}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                groqApiKey={groqApiKey}
                setGroqApiKey={setGroqApiKey}
                claudeApiKey={claudeApiKey}
                setClaudeApiKey={setClaudeApiKey}
              />
            )}
            
            {activeMenuItem === 'Documents' && (
              <>
                {/* Debug Panel - Remove this in production */}
                <Box 
                  sx={{ 
                    position: 'fixed',
                    top: 10, 
                    right: 10, 
                    zIndex: 9999, 
                    maxWidth: 350,
                    p: 2,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    opacity: 0.8,
                    '&:hover': { opacity: 1 },
                    maxHeight: '80vh',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Debug Info</Typography>
                  <Typography variant="caption" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                    Project ID: {projectId}<br />
                    Project Title: {projectData?.title}<br />
                    Documents Count: {documents?.length || 0}<br />
                    Codes Count: {codes?.length || 0}<br />
                    Selected Doc ID: {selectedDocumentId || 'none'}<br />
                    <Box component="span" sx={{ color: documents?.length ? 'success.main' : 'error.main' }}>
                      Documents Loaded: {documents?.length ? 'Yes' : 'No'}
                    </Box>
                  </Typography>
                  {documents && documents.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Document Names:</Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {documents.slice(0, 5).map((doc, i) => (
                          <li key={doc.id || i}>{doc.name || doc.filename || `Doc ${doc.id}`}</li>
                        ))}
                        {documents.length > 5 && <li>...and {documents.length - 5} more</li>}
                      </Box>
                    </Box>
                  )}
                </Box>
                
                <Documents
                  projectId={projectId}
                  setCodesModalOpen={setCodesModalOpen}
                  selection={selection}
                  setSelection={setSelection}
                  bubbleAnchor={bubbleAnchor}
                  setBubbleAnchor={setBubbleAnchor}
                  handleBubbleCodesClick={handleBubbleCodesClick}
                  setPendingCodeSelection={setPendingCodeSelection}
                  commentData={commentData}
                  setCommentData={setCommentData}
                  codeAssignments={codeAssignments}
                  setCodeAssignments={setCodeAssignments}
                  documents={documents}
                  setDocuments={setDocuments}
                  refreshSidebar={refreshProjectData} 
                  selectedDocumentId={selectedDocumentId}
                  setSelectedDocumentId={setSelectedDocumentId}
                  onDocumentsUpdated={(updatedDocs) => {
                    console.log("Documents updated:", updatedDocs);
                    refreshProjectData(); // Refresh all project data when documents change
                  }}
                />
              </>
            )}

            {activeMenuItem === 'Comments' && (
              <Box sx={{ height: '100%', position: 'relative' }}>
                <Comments commentData={commentData} />
              </Box>
            )}

            {activeMenuItem === 'Codebook' && (
              <Box sx={{ height: '100%', position: 'relative' }}>
                <Codebook 
                  codeAssignments={codeAssignments} 
                  projectId={projectId}
                  codes={codes}
                  setCodes={setCodes}
                  onCodesUpdated={refreshProjectData}
                />
              </Box>
            )}

            {activeMenuItem === 'Visualizations' && (
              <Box sx={{ height: '100%', position: 'relative' }}>
                <VisualizationDashboard data={codeAssignments} />
              </Box>
            )}
          </FrostedGlassPaper>
        </Fade>
      </Box>

      {/* Floating Action Button - SpeedDial */}
      <Backdrop open={speedDialOpen} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} />
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{
          position: 'fixed',
          bottom: theme.spacing(4),
          right: theme.spacing(4),
          '& .MuiFab-primary': {
            backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          }
        }}
        icon={<SpeedDialIcon />}
        onClose={handleSpeedDialClose}
        onOpen={handleSpeedDialOpen}
        open={speedDialOpen}
        FabProps={{
          sx: {
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => {
              action.onClick();
              handleSpeedDialClose();
            }}
            FabProps={{
              sx: {
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* Code Modals */}      <CodeModals
        codesModalOpen={codesModalOpen}
        setCodesModalOpen={setCodesModalOpen}
        selectedCode={selectedCode}
        setSelectedCode={setSelectedCode}
        codes={codes}
        createCodeDialogOpen={createCodeDialogOpen}
        setCreateCodeDialogOpen={setCreateCodeDialogOpen}
        newCodeFields={newCodeFields}
        setNewCodeFields={setNewCodeFields}
        setCodes={setCodes}
        pendingCodeSelection={pendingCodeSelection}
        setPendingCodeSelection={setPendingCodeSelection}
        codeAssignments={codeAssignments}
        setCodeAssignments={setCodeAssignments}
        projectId={projectId}
        onCodesUpdated={refreshProjectData}
      />
    </Box>
  );
}

export default Dashboard;