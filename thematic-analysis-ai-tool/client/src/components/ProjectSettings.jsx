import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  useTheme,
  Avatar,
  alpha,
  Paper,
  InputAdornment,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import SaveIcon from '@mui/icons-material/Save';
import { projectsApi } from '../utils/api';

const ProjectSettings = ({ projectId }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [savingProjectDetails, setSavingProjectDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'collaborators'// Fetch project details including collaborators from the backend API
  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const projectData = await projectsApi.getProject(projectId);
      
      // Set project details
      setProjectTitle(projectData.title || '');
      setProjectDescription(projectData.description || '');
      
      // Extract collaborators from project data
      // Assuming the API returns the project with a collaborators array
      if (projectData.collaborators) {
        setCollaborators(projectData.collaborators);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to fetch project collaborators');
    } finally {
      setLoading(false);
    }
  };
  // Fetch project data on component mount or when dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchCollaborators();
    }
  }, [open, projectId]);

  const handleOpen = () => {
    setOpen(true);
    setActiveTab('details');
    // fetchCollaborators will be called by useEffect
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
    setCollaboratorEmail('');
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };const handleAddCollaborator = async () => {
    setError('');
    setSuccess('');
    
    if (!collaboratorEmail) {
      setError('Please enter an email address');
      return;
    }

    try {
      await projectsApi.addCollaborator(projectId, collaboratorEmail);

      // Refresh collaborators list
      await fetchCollaborators();
      
      setSuccess('Collaborator added successfully');
      setCollaboratorEmail('');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError(err.message || 'Failed to add collaborator');
    }
  };  const handleRemoveCollaborator = async (email) => {
    try {
      setError('');
      setSuccess('');

      await projectsApi.removeCollaborator(projectId, email);

      // Refresh the collaborators list
      await fetchCollaborators();
      
      setSuccess('Collaborator removed successfully');
    } catch (error) {
      setError('Failed to remove collaborator');
      console.error('Error removing collaborator:', error);
    }
  };
  const handleSaveProjectDetails = async () => {
    setError('');
    setSuccess('');
    setSavingProjectDetails(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        setSavingProjectDetails(false);
        return;
      }

      const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update project details');
      }

      setSuccess('Project details updated successfully');
    } catch (err) {
      console.error('Error updating project details:', err);
      setError(err.message || 'Failed to update project details');
    } finally {
      setSavingProjectDetails(false);
    }
  };  const handleUpdateProjectDetails = async () => {
    if (!projectTitle.trim()) {
      setError('Project title cannot be empty');
      return;
    }

    try {
      setSavingProjectDetails(true);
      setError('');
      setSuccess('');

      await projectsApi.updateProject(projectId, {
        title: projectTitle,
        description: projectDescription || '',
      });

      setSuccess('Project details updated successfully');
    } catch (err) {
      console.error('Error updating project details:', err);
      setError(err.message || 'Failed to update project details');
    } finally {
      setSavingProjectDetails(false);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.05)',
          '&:hover': {
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0,0,0,0.1)',
          }
        }}
      >
        <SettingsIcon />
      </IconButton>      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          elevation: 23, // Explicitly set elevation to a value within the theme's range
          sx: {
            borderRadius: 2,
            boxShadow: 10,
            maxWidth: 600,
            mx: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Project Settings
          </Typography>
        </DialogTitle>

        <Divider />

        {/* Tab navigation */}
        <Box sx={{ display: 'flex', px: 3, pt: 2 }}>
          <Button 
            onClick={() => handleTabChange('details')}
            variant={activeTab === 'details' ? 'contained' : 'text'}
            sx={{ 
              borderRadius: 2, 
              mr: 1,
              px: 2,
              backgroundColor: activeTab === 'details' ? '' : 'transparent',
              '&:hover': {
                backgroundColor: activeTab === 'details' 
                  ? '' 
                  : alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Project Details
          </Button>
          <Button 
            onClick={() => handleTabChange('collaborators')}
            variant={activeTab === 'collaborators' ? 'contained' : 'text'}
            sx={{ 
              borderRadius: 2,
              px: 2,
              backgroundColor: activeTab === 'collaborators' ? '' : 'transparent',
              '&:hover': {
                backgroundColor: activeTab === 'collaborators' 
                  ? '' 
                  : alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Collaborators
          </Button>
        </Box>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && activeTab === 'details' && (
            /* Project Details Section */
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="Project Title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Project Description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                variant="outlined"
                placeholder="Describe your research project..."
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateProjectDetails}
                disabled={savingProjectDetails}
                startIcon={<SaveIcon />}
                sx={{ px: 3, py: 1 }}
              >
                {savingProjectDetails ? 'Saving...' : 'Save Project Details'}
              </Button>
            </Box>
          )}

          {!loading && activeTab === 'collaborators' && (
            /* Collaborators Section */
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Invite team members to collaborate on this research project. Collaborators can view and edit project data.
              </Typography>
              
              <Paper elevation={0} sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2
              }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="Collaborator Email"
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                    placeholder="email@example.com"
                    variant="outlined"
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddCollaborator}
                    startIcon={<PersonAddIcon />}
                    sx={{ 
                      minWidth: 100,
                      height: 56,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Paper>

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                Project Collaborators
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {collaborators.length === 0 ? (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`
                    }}
                  >
                    <Typography color="text.secondary">
                      No collaborators yet. Add team members to collaborate.
                    </Typography>
                  </Paper>
                ) : (
                  <List 
                    sx={{ 
                      bgcolor: 'background.paper', 
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    {collaborators.map((collaborator, index) => (
                      <React.Fragment key={collaborator.email || collaborator.id || index}>
                        <ListItem>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: index % 2 === 0 
                                ? alpha(theme.palette.primary.main, 0.2)
                                : alpha(theme.palette.secondary.main, 0.2),
                              color: index % 2 === 0
                                ? theme.palette.primary.main
                                : theme.palette.secondary.main
                            }}
                          >
                            {(collaborator.name || collaborator.email || collaborator.username || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {collaborator.email || collaborator.username || 'Unknown user'}
                                {collaborator.owner && (
                                  <Chip 
                                    label="Owner" 
                                    size="small" 
                                    sx={{ height: 20, fontSize: '0.75rem' }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={collaborator.name || ''}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Remove collaborator">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveCollaborator(collaborator.email || collaborator.username)}
                                size="small"
                                sx={{ 
                                  color: theme.palette.error.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.1)
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < collaborators.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Box>          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>      </Dialog>
    </>
  );
};

export default ProjectSettings;