import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.response?.data?.error || 'An error occurred during signup',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="md" py={12}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} align="center">
            <Heading>Create an Account</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Sign up to start verifying emails
            </Text>
          </VStack>
          
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg={useColorModeValue('white', 'gray.800')}
            p={8}
            borderRadius="lg"
            boxShadow="md"
          >
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                isLoading={isLoading}
              >
                Sign Up
              </Button>
            </VStack>
          </Box>
          
          <HStack justify="center">
            <Text>Already have an account?</Text>
            <Link as={RouterLink} to="/login" color="brand.500">
              Log in
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default SignupPage;
