"use client"

import type React from "react"
import { useState } from "react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  FormErrorMessage,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react"
import { useAuth } from "../contexts/AuthContext"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const { login, defaultCredentials } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    if (!password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.error || "An error occurred during login",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setEmail(defaultCredentials.admin.email)
    setPassword(defaultCredentials.admin.password)
  }

  const fillUserCredentials = () => {
    setEmail(defaultCredentials.user.email)
    setPassword(defaultCredentials.user.password)
  }

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Container maxW="md" py={12}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} align="center">
            <Heading>Welcome Back</Heading>
            <Text color={useColorModeValue("gray.600", "gray.400")}>Sign in to your account</Text>
          </VStack>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Default Accounts</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Text fontWeight="bold">Admin:</Text>
                    <Text>
                      {defaultCredentials.admin.email} / {defaultCredentials.admin.password}
                    </Text>
                    <Button size="xs" onClick={fillAdminCredentials}>
                      Use
                    </Button>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold">User:</Text>
                    <Text>
                      {defaultCredentials.user.email} / {defaultCredentials.user.password}
                    </Text>
                    <Button size="xs" onClick={fillUserCredentials}>
                      Use
                    </Button>
                  </HStack>
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>

          <Box
            as="form"
            onSubmit={handleSubmit}
            bg={useColorModeValue("white", "gray.800")}
            p={8}
            borderRadius="lg"
            boxShadow="md"
          >
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button type="submit" colorScheme="brand" size="lg" w="full" isLoading={isLoading}>
                Sign In
              </Button>
            </VStack>
          </Box>

          <HStack justify="center">
            <Text>Don't have an account?</Text>
            <Link as={RouterLink} to="/signup" color="brand.500">
              Sign up
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}

export default LoginPage

