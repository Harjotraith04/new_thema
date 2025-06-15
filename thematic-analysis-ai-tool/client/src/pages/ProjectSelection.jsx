import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Alert,
  alpha,
  Avatar,
  Chip,
  Divider,
  useMediaQuery,
  Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate } from 'react-router-dom';
import { 
  GlowButton, 
  AnimatedCard, 
  FrostedGlassPaper, 
  EnhancedTableRow, 
  GradientIconButton, 
  StatusAvatar 
} from '../components/StyledComponents';
import { projectsApi } from '../utils/api';

function ProjectSelection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      
      const projectsData = await projectsApi.getProjects();
      console.log('Projects data from API:', projectsData);
      
      // If the API is returning data in a different format, adapt it
      let formattedData = projectsData;
      
      // Ensure we have an array of projects
      if (!Array.isArray(formattedData)) {
        if (formattedData && typeof formattedData === 'object') {
          formattedData = [formattedData];
        } else {
          formattedData = [];
        }
      }
      
      setProjects(formattedData);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [navigate]);

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleCreateProject = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setCreatingProject(false);
  };

  const handleNewProjectNameChange = (event) => {
    setNewProjectName(event.target.value);
  };

  const handleNewProjectDescriptionChange = (event) => {
    setNewProjectDescription(event.target.value);
  };
  const handleSaveNewProject = async () => {
    if (!newProjectName.trim()) {
      alert('Project name cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }      
      
      setCreatingProject(true);
      
      const newProject = await projectsApi.createProject({
        title: newProjectName,
        description: newProjectDescription || '',
      });
      
      console.log('Project created successfully', newProject);
      
      // Refresh project list
      fetchProjects();
      handleCloseCreateDialog();

    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project.');
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleStartAnalysisClick = (projectId) => {
    console.log('Start Analysis clicked for project:', projectId);
    navigate(`/dashboard/${projectId}`);
  };
    const handleDeleteProjectClick = async (projectId) => {
    console.log('Delete clicked for project:', projectId);
    const confirmDelete = window.confirm('Are you sure you want to delete this project?');
    if (!confirmDelete) {
      return;
    }    
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await projectsApi.deleteProject(projectId);

      // Update the projects list
      fetchProjects();
      console.log('Project deleted successfully:', projectId);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project.');
      alert('An error occurred while trying to delete the project.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': 
        return theme.palette.primary.main;
      case 'completed': 
        return theme.palette.success.main;
      case 'pending': 
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        py: { xs: 3, md: 5 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          opacity: theme.palette.mode === 'dark' ? 0.3 : 0.5,
        },
      }}
    >
      <Container maxWidth="lg">
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <Box>
            <Fade in={true} style={{ transitionDelay: '200ms' }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  mb: 1,
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                Project Selection
              </Typography>
            </Fade>
            
            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mb: 5,
                  maxWidth: '650px',
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                Select an existing thematic analysis project to continue your work, or create a new project to begin a fresh analysis.
              </Typography>
            </Fade>

            {/* Action Buttons */}
            <Fade in={true} style={{ transitionDelay: '400ms' }}>
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 4,
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                }}
              >
                <GlowButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateProject}
                  sx={{ 
                    minWidth: '180px',
                    height: '48px',
                  }}
                >
                  Create New Project
                </GlowButton>
              </Box>
            </Fade>

            {/* Error message */}
            {error && (
              <Fade in={true}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Loading indicator */}
            {loading && (
              <Fade in={true}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                  <CircularProgress />
                </Box>
              </Fade>
            )}

            {/* Projects Table */}
            {!loading && projects.length > 0 && (
              <Fade in={true} style={{ transitionDelay: '500ms' }}>
                <FrostedGlassPaper sx={{ mt: 3, overflow: 'hidden', borderRadius: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      p: 3, 
                      pb: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      fontWeight: 600
                    }}
                  >
                    Your Projects
                  </Typography>
                  
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table aria-label="projects table">
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">Project Name</TableCell>
                          {!isMobile && <TableCell>Status</TableCell>}
                          {!isMobile && <TableCell>Last Updated</TableCell>}
                          {!isMobile && <TableCell>Documents</TableCell>}
                          {!isMobile && <TableCell>Codes</TableCell>}
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projects.map((project) => (
                          <EnhancedTableRow 
                            key={project.id} 
                            hover
                            isSelected={selectedProject === project.id}
                            onClick={() => setSelectedProject(project.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>                                <Avatar 
                                  sx={{ 
                                    bgcolor: alpha(getStatusColor(project.status || 'active'), 0.1),
                                    color: getStatusColor(project.status || 'active'),
                                    fontWeight: 'bold',
                                    width: 38,
                                    height: 38,
                                  }}
                                >
                                  {project.title && project.title.length > 0 
                                    ? project.title.charAt(0).toUpperCase() 
                                    : 'P'}
                                </Avatar>
                                <Box>
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      fontWeight: 600,
                                      mb: 0.5,
                                    }}
                                  >
                                    {project.title}
                                  </Typography>                                  {isMobile ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <StatusAvatar status={project.status || 'active'} />
                                      <Typography variant="caption" color="text.secondary">
                                        {project.status 
                                          ? project.status.charAt(0).toUpperCase() + project.status.slice(1) 
                                          : 'Active'}
                                      </Typography>
                                    </Stack>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      {project.description || ''}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Chip 
                                  label={project.status 
                                    ? project.status.charAt(0).toUpperCase() + project.status.slice(1) 
                                    : 'Active'} 
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(getStatusColor(project.status || 'active'), 0.1),
                                    color: getStatusColor(project.status || 'active'),
                                    fontWeight: 500,
                                    '& .MuiChip-label': { px: 1 }
                                  }}
                                />
                              </TableCell>
                            )}
                            {!isMobile && (
                              <TableCell>
                                {formatDate(project.updated_at || project.lastUpdated)}
                              </TableCell>
                            )}
                            {!isMobile && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FolderIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                  <Typography>
                                    {project.documents ? project.documents.length : project.documentCount || 0}
                                  </Typography>
                                </Box>
                              </TableCell>
                            )}
                            {!isMobile && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography>
                                    {project.codes ? project.codes.length : project.codeCount || 0}
                                  </Typography>
                                </Box>
                              </TableCell>
                            )}

                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="Start Analysis">
                                  <IconButton
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartAnalysisClick(project.id);
                                    }}
                                    sx={{
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      },
                                    }}
                                  >
                                    <PlayArrowIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete Project">
                                  <IconButton
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProjectClick(project.id);
                                    }}
                                    sx={{
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                      },
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </EnhancedTableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </FrostedGlassPaper>
              </Fade>
            )}

            {/* Empty State */}
            {!loading && projects.length === 0 && (
              <Fade in={true} style={{ transitionDelay: '500ms' }}>
                <FrostedGlassPaper 
                  sx={{ 
                    p: 5, 
                    textAlign: 'center',
                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 70,
                      height: 70,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      mb: 2,
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    No Projects Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first thematic analysis project to get started
                  </Typography>
                  <GlowButton
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateProject}
                  >
                    Create New Project
                  </GlowButton>
                </FrostedGlassPaper>
              </Fade>
            )}
          </Box>
        </Zoom>
      </Container>

      {/* Create Project Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
              : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.8)})`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(4px)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Create New Project</DialogTitle>
        <Divider />
        <DialogContent sx={{ minWidth: { sm: '400px' }, pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={handleNewProjectNameChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Project Description (optional)"
            fullWidth
            variant="outlined"
            value={newProjectDescription}
            onChange={handleNewProjectDescriptionChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseCreateDialog}
            variant="outlined"
            sx={{
              borderRadius: theme.shape.borderRadius * 0.75,
              px: 3
            }}
          >
            Cancel
          </Button>
          <GlowButton 
            onClick={handleSaveNewProject}
            variant="contained"
            disabled={creatingProject}
            startIcon={creatingProject ? <CircularProgress size={20} /> : null}
            sx={{
              px: 3
            }}
          >
            {creatingProject ? 'Creating...' : 'Create Project'}
          </GlowButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProjectSelection;