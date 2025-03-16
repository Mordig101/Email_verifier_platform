import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Code,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useClipboard,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const ApiPage = () => {
  const { user } = useAuth();
  const apiKey = 'sk_test_' + Math.random().toString(36).substring(2, 15);
  const { hasCopied, onCopy } = useClipboard(apiKey);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const codeBgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">API Documentation</Heading>

          <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
            <VStack align="start" spacing={4}>
              <Heading size="md">Your API Key</Heading>
              <Alert status="warning">
                <AlertIcon />
                <AlertTitle>Keep your API key secure!</AlertTitle>
                <AlertDescription>
                  Do not share your API key in publicly accessible areas such as GitHub, client-side code, etc.
                </AlertDescription>
              </Alert>

              <HStack w="full" bg={codeBgColor} p={4} borderRadius="md">
                <Code flex="1" fontSize="md" colorScheme="brand">
                  {apiKey}
                </Code>
                <Button onClick={onCopy} size="sm" leftIcon={<Icon as={hasCopied ? FiCheck : FiCopy} />}>
                  {hasCopied ? 'Copied' : 'Copy'}
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Tabs variant="enclosed">
            <TabList>
              <Tab>Getting Started</Tab>
              <Tab>Endpoints</Tab>
              <Tab>Examples</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                  <VStack align="start" spacing={4}>
                    <Heading size="md">Getting Started with the API</Heading>
                    <Text>
                      Our API allows you to verify email addresses programmatically. You can integrate email verification
                      into your applications, forms, or any other system that requires email validation.
                    </Text>

                    <Heading size="sm">Authentication</Heading>
                    <Text>
                      All API requests require authentication. You need to include your API key in the header of each
                      request:
                    </Text>
                    <Box w="full" bg={codeBgColor} p={4} borderRadius="md">
                      <Code display="block" whiteSpace="pre" fontSize="sm">
                        {`Authorization: Bearer ${apiKey}`}
                      </Code>
                    </Box>

                    <Heading size="sm">Base URL</Heading>
                    <Text>All API requests should be made to:</Text>
                    <Box w="full" bg={codeBgColor} p={4} borderRadius="md">
                      <Code display="block" whiteSpace="pre" fontSize="sm">
                        https://api.emailverifier.com/v1
                      </Code>
                    </Box>
                  </VStack>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                  <VStack align="start" spacing={6}>
                    <Heading size="md">API Endpoints</Heading>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">Verify a Single Email</Heading>
                      <Text>Verify a single email address.</Text>
                      <Table variant="simple" size="sm">
                        <Tbody>
                          <Tr>
                            <Th>Endpoint</Th>
                            <Td>
                              <Code>POST /verify</Code>
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Request Body</Th>
                            <Td>
                              <Code>{`{ "email": "example@domain.com", "verifier": "verifier1" }`}</Code>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </VStack>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">Verify Multiple Emails</Heading>
                      <Text>Verify multiple email addresses in a single request.</Text>
                      <Table variant="simple" size="sm">
                        <Tbody>
                          <Tr>
                            <Th>Endpoint</Th>
                            <Td>
                              <Code>POST /verify-bulk</Code>
                            </Td>
                          </Tr>
                          <Tr>
                            <Th>Request Body</Th>
                            <Td>
                              <Code>{`{ "emails": ["email1@domain.com", "email2@domain.com"], "verifier": "verifier1" }`}</Code>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </VStack>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">Get Batch Results</Heading>
                      <Text>Get the results of a bulk verification batch.</Text>
                      <Table variant="simple" size="sm">
                        <Tbody>
                          <Tr>
                            <Th>Endpoint</Th>
                            <Td>
                              <Code>GET /results/{'{batch_id}'}</Code>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </VStack>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">Get User Statistics</Heading>
                      <Text>Get statistics about your email verifications.</Text>
                      <Table variant="simple" size="sm">
                        <Tbody>
                          <Tr>
                            <Th>Endpoint</Th>
                            <Td>
                              <Code>GET /stats</Code>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </VStack>
                  </VStack>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                  <VStack align="start" spacing={6}>
                    <Heading size="md">API Examples</Heading>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">cURL</Heading>
                      <Box w="full" bg={codeBgColor} p={4} borderRadius="md">
                        <Code display="block" whiteSpace="pre" fontSize="sm">
                          {`curl -X POST https://api.emailverifier.com/v1/verify \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "example@domain.com", "verifier": "verifier1"}'`}
                        </Code>
                      </Box>
                    </VStack>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">JavaScript (Node.js)</Heading>
                      <Box w="full" bg={codeBgColor} p={4} borderRadius="md">
                        <Code display="block" whiteSpace="pre" fontSize="sm">
                          {`const axios = require('axios');

const verifyEmail = async (email) => {
  try {
    const response = await axios.post('https://api.emailverifier.com/v1/verify', {
      email,
      verifier: 'verifier1'
    }, {
      headers: {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

verifyEmail('example@domain.com')
  .then(result => console.log(result))
  .catch(error => console.error(error));`}
                        </Code>
                      </Box>
                    </VStack>

                    <VStack align="start" spacing={4} w="full">
                      <Heading size="sm">Python</Heading>
                      <Box w="full" bg={codeBgColor} p={4} borderRadius="md">
                        <Code display="block" whiteSpace="pre" fontSize="sm">
                          {`import requests

def verify_email(email):
    url = 'https://api.emailverifier.com/v1/verify'
    headers = {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
    }
    data = {
        'email': email,
        'verifier': 'verifier1'
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()

result = verify_email('example@domain.com')
print(result)`}
                        </Code>
                      </Box>
                    </VStack>
                  </VStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

export default ApiPage;
