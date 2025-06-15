import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
// import { useAuth } from '../components/AuthProvider'; // You can uncomment this if you have an AuthContext

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const { setUser } = useAuth(); // Uncomment and use if you have AuthContext

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
      console.log('Received token from OAuth callback:', token);
      // *** Here you would typically store the token (e.g., in localStorage) and manage user state ***
      localStorage.setItem('authToken', token); // Example: storing in localStorage

      // *** Redirect to the project selection page after successful social login ***
      navigate('/project-selection'); // Redirect to /project-selection

    } else {
      // Handle cases where no token is received (e.g., an error occurred during OAuth)
      console.error('OAuth callback failed: No token received');
      // *** Redirect to login page with an error message if needed ***
      navigate('/login?error=oauth_failed');
    }
  }, [location, navigate]); // Add setUser to dependencies if you uncomment useAuth

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">Processing login...</Typography>
    </Box>
  );
};

export default AuthCallback; 