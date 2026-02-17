import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface AnimatedBoxProps extends BoxProps {
  delay?: number;
  animation?: 'fadeInUp' | 'fadeIn' | 'slideInRight' | 'bounceIn';
  duration?: number;
}

const AnimatedBox: React.FC<AnimatedBoxProps> = ({
  delay = 0,
  animation = 'fadeInUp',
  duration = 0.5,
  children,
  sx,
  ...props
}) => (
  <Box
    sx={{
      animation: `${animation} ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s both`,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

export default AnimatedBox;
