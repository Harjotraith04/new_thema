import { styled, alpha, keyframes } from '@mui/material/styles';
import { Box, Paper, Card, Button, Fab, IconButton, TableRow, Avatar } from '@mui/material';

/**
 * Styled components for use across the application
 * These provide consistent styling and enhanced visual appearance
 * with proper dark mode support
 */

// An animated card that subtly lifts on hover
export const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' 
    ? `0 4px 20px ${alpha(theme.palette.common.black, 0.25)}`
    : `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? `0 6px 25px ${alpha(theme.palette.common.black, 0.35)}`
      : `0 6px 25px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

// A glassy panel with backdrop blur effect
export const GlassPanel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.7)
    : alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 1.5,
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.1)
    : alpha(theme.palette.common.black, 0.1)}`,
  padding: theme.spacing(3),
  boxShadow: theme.palette.mode === 'dark' 
    ? `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
    : `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
}));

// A glowing button with subtle animation
export const GlowButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}` 
      : `0 0 15px ${alpha(theme.palette.primary.main, 0.3)}`,
    '&:after': {
      opacity: 1,
    }
  },
  '&:active': {
    transform: 'translateY(1px)',
  }
}));

// A container with a subtle gradient background
export const GradientBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
    : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${theme.palette.background.paper} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
}));

// Define pulse animation
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(66, 153, 225, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0);
  }
`;

// Floating action button with pulse animation
export const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  zIndex: 1000,
  backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.common.white,
  animation: `${pulseAnimation} 2s infinite`,
  boxShadow: theme.shadows[8],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundPosition: 'right center',
    transform: 'translateY(-5px) scale(1.05)',
    boxShadow: theme.shadows[12],
  },
}));

// Enhanced table row with subtle hover effect
export const EnhancedTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'isSelected'
})(({ theme, isSelected }) => ({
  transition: 'all 0.2s ease',
  backgroundColor: isSelected 
    ? theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.primary.main, 0.08)
    : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.action.hover, 0.2)
      : alpha(theme.palette.action.hover, 0.1),
  },
  '& td': {
    borderBottom: `1px solid ${theme.palette.mode === 'dark'
      ? alpha(theme.palette.divider, 0.6)
      : theme.palette.divider}`,
  }
}));

// Gradient icon button for special actions
export const GradientIconButton = styled(IconButton)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.common.white,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.4)}`,
  }
}));

// Status avatar with customizable colors
export const StatusAvatar = styled(Avatar)(({ theme, status = 'default' }) => {
  const statusColors = {
    pending: theme.palette.warning.main,
    completed: theme.palette.success.main,
    error: theme.palette.error.main,
    default: theme.palette.grey[500],
    active: theme.palette.primary.main
  };
  
  return {
    width: 12,
    height: 12,
    backgroundColor: statusColors[status] || statusColors.default,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  };
});

// Card with gradient border
export const GradientBorderCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(0.5),
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '& .MuiCardContent-root': {
    borderRadius: theme.shape.borderRadius * 1.5,
    backgroundColor: theme.palette.background.paper,
  }
}));

// Frosted glass effect paper
export const FrostedGlassPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.1)
    : alpha(theme.palette.common.black, 0.05)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 8px 32px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.05)',
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 60%)`,
    opacity: 0.4,
  }
}));
