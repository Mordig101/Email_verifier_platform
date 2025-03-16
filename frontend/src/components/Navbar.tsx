"use client"

import type React from "react"
import { Link as RouterLink, useLocation } from "react-router-dom"
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  Avatar,
  Text,
  useColorMode,
} from "@chakra-ui/react"
import { FiMenu, FiX, FiMoon, FiSun, FiUser, FiLogOut } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"

const NavLink = ({ children, to, isActive }: { children: React.ReactNode; to: string; isActive: boolean }) => {
  const activeColor = useColorModeValue("brand.500", "brand.500")
  const inactiveColor = useColorModeValue("gray.600", "gray.200")
  const bgColor = useColorModeValue("gray.100", "gray.700")

  return (
    <Box
      as={RouterLink}
      px={2}
      py={1}
      rounded="md"
      to={to}
      fontWeight={isActive ? "bold" : "medium"}
      color={isActive ? activeColor : inactiveColor}
      _hover={{
        textDecoration: "none",
        bg: bgColor,
      }}
    >
      {children}
    </Box>
  )
}

const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const { user, logout } = useAuth()
  const location = useLocation()
  const bgColor = useColorModeValue("white", "gray.800")

  const Links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Verification", path: "/verification" },
    { name: "Statistics", path: "/statistics" },
    { name: "API", path: "/api" },
  ]

  // Add admin link if user is admin
  if (user?.role === "admin") {
    Links.push({ name: "Admin", path: "/admin" })
  }

  return (
    <Box bg={bgColor} px={4} boxShadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto">
        <IconButton
          size="md"
          icon={isOpen ? <FiX /> : <FiMenu />}
          aria-label="Open Menu"
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems="center">
          <Box fontWeight="bold" fontSize="lg" color="brand.500">
            <RouterLink to="/dashboard">Email Verifier</RouterLink>
          </Box>
          <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
            {Links.map((link) => (
              <NavLink key={link.name} to={link.path} isActive={location.pathname === link.path}>
                {link.name}
              </NavLink>
            ))}
          </HStack>
        </HStack>
        <Flex alignItems="center">
          <IconButton
            mr={4}
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          <Menu>
            <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
              <HStack>
                <Avatar size="sm" name={user?.name} src={`https://i.pravatar.cc/150?u=${user?.email}`} />
                <Text display={{ base: "none", md: "block" }}>{user?.name}</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/settings" icon={<FiUser />}>
                Account Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={logout} icon={<FiLogOut />}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Mobile menu */}
      {isOpen && (
        <Box pb={4} display={{ md: "none" }}>
          <Stack as="nav" spacing={4}>
            {Links.map((link) => (
              <NavLink key={link.name} to={link.path} isActive={location.pathname === link.path}>
                {link.name}
              </NavLink>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default Navbar

