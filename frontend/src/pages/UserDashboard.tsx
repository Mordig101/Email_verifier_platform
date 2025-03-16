"use client"

import { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react"
import { FiMail, FiCheckCircle, FiXCircle, FiAlertCircle, FiBarChart2 } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import { api } from "../services/api"
import Navbar from "../components/Navbar"

interface UserStats {
  total_verifications: number
  valid: number
  invalid: number
  risky: number
  top_domains: [string, number][]
}

const UserDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBgColor = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.600", "gray.400")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [statsResponse, resultsResponse] = await Promise.all([
          api.get("/api/stats/user"),
          api.get("/api/results/recent"),
        ])

        setStats(statsResponse.data)
        setRecentResults(resultsResponse.data.results || [])
        setError(null)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return <Badge colorScheme="green">Valid</Badge>
      case "INVALID":
        return <Badge colorScheme="red">Invalid</Badge>
      case "RISKY":
        return <Badge colorScheme="yellow">Risky</Badge>
      default:
        return <Badge colorScheme="gray">Unknown</Badge>
    }
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg">Welcome, {user?.name}</Heading>
            <Button as={RouterLink} to="/verification" colorScheme="brand" leftIcon={<Icon as={FiMail} />}>
              Verify Email
            </Button>
          </Flex>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading dashboard data...</Text>
            </Box>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <>
              {/* Stats Cards */}
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <Stat px={6} py={4} bg={cardBgColor} borderRadius="lg" boxShadow="md">
                  <StatLabel>Total Verifications</StatLabel>
                  <StatNumber>{stats?.total_verifications || 0}</StatNumber>
                  <StatHelpText>All time</StatHelpText>
                </Stat>

                <Stat px={6} py={4} bg={cardBgColor} borderRadius="lg" boxShadow="md">
                  <StatLabel>Valid Emails</StatLabel>
                  <HStack>
                    <StatNumber>{stats?.valid || 0}</StatNumber>
                    <Icon as={FiCheckCircle} color="green.500" />
                  </HStack>
                  <StatHelpText>
                    {stats?.total_verifications
                      ? `${Math.round((stats.valid / stats.total_verifications) * 100)}%`
                      : "0%"}
                  </StatHelpText>
                </Stat>

                <Stat px={6} py={4} bg={cardBgColor} borderRadius="lg" boxShadow="md">
                  <StatLabel>Invalid Emails</StatLabel>
                  <HStack>
                    <StatNumber>{stats?.invalid || 0}</StatNumber>
                    <Icon as={FiXCircle} color="red.500" />
                  </HStack>
                  <StatHelpText>
                    {stats?.total_verifications
                      ? `${Math.round((stats.invalid / stats.total_verifications) * 100)}%`
                      : "0%"}
                  </StatHelpText>
                </Stat>

                <Stat px={6} py={4} bg={cardBgColor} borderRadius="lg" boxShadow="md">
                  <StatLabel>Risky Emails</StatLabel>
                  <HStack>
                    <StatNumber>{stats?.risky || 0}</StatNumber>
                    <Icon as={FiAlertCircle} color="yellow.500" />
                  </HStack>
                  <StatHelpText>
                    {stats?.total_verifications
                      ? `${Math.round((stats.risky / stats.total_verifications) * 100)}%`
                      : "0%"}
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              {/* Recent Results */}
              <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Recent Verifications</Heading>
                  <Button
                    as={RouterLink}
                    to="/statistics"
                    variant="outline"
                    size="sm"
                    rightIcon={<Icon as={FiBarChart2} />}
                  >
                    View All
                  </Button>
                </Flex>

                {recentResults.length > 0 ? (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Email</Th>
                        <Th>Status</Th>
                        <Th>Provider</Th>
                        <Th>Timestamp</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recentResults.map((result, index) => (
                        <Tr key={index}>
                          <Td>{result.email}</Td>
                          <Td>{getStatusBadge(result.category)}</Td>
                          <Td>{result.provider}</Td>
                          <Td>{new Date(result.timestamp).toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text textAlign="center" py={4} color={textColor}>
                    No verification results yet. Start by verifying an email.
                  </Text>
                )}
              </Box>

              {/* Top Domains */}
              {stats?.top_domains && stats.top_domains.length > 0 && (
                <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                  <Heading size="md" mb={4}>
                    Top Domains
                  </Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Domain</Th>
                        <Th>Count</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {stats.top_domains.map(([domain, count], index) => (
                        <Tr key={index}>
                          <Td>{domain}</Td>
                          <Td>{count}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default UserDashboard

