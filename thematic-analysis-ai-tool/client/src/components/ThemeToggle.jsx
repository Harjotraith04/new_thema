import React, { useContext } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeModeContext } from '../App';

/**
 * A standalone theme toggle button component that can be used throughout the app
 */
const ThemeToggle = ({ size = "medium" }) => {  const theme = useTheme();
  // Use the theme's palette mode as a fallback if context isn't available
  const themeContext = useContext(ThemeModeContext) || { 
    toggleColorMode: () => {}, 
    mode: theme.palette.mode 
  };
  const { toggleColorMode, mode } = themeContext;

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton 
        onClick={toggleColorMode} 
        color="inherit" 
        size={size}
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            transform: 'scale(1.05)',
          }
        }}
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
