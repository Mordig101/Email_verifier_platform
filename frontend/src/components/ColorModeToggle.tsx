import React from 'react';
import { IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = colorMode === 'light' ? FiMoon : FiSun;
  
  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color={useColorModeValue('gray.600', 'gray.300')}
      _hover={{
        bg: useColorModeValue('gray.100', 'gray.700'),
      }}
    />
  );
};

export default ColorModeToggle;
