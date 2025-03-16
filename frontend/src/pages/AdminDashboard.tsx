"use client"

import { useEffect, useState } from "react"
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react"
import { FiUsers, FiCheckCircle, FiXCircle, FiAlertCircle, FiSearch } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import { api } from "../services/api"
import Navbar from "../components/Navbar"

interface AdminStats {
  total_verifications: number
  valid: number
  invalid: number
  risky: number
  top_domains: [string, number][]
  top_users: [string, number][]
  total_users: number
  total_batches: number
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBgColor = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.600", "gray.400")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [statsResponse, usersResponse, logsResponse] = await Promise.all([
          api.get("/api/stats/admin"),
          api.get("/api/users"),
          api.get("/api/logs"),
        ])

        setStats(statsResponse.data)
        setUsers(usersResponse.data)
        setLogs(logsResponse.data || [])
        setError(null)
      } catch (error) {
        console.error("Error fetching admin data:", error)
        setError("Failed to load admin dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUserStatusChange = async (email: string, newRole: string) => {
    try {
      await api.put(`/api/users/${email}`, { role: newRole })

      // Update local state
      setUsers(users.map((user) => (user.email === email ? { ...user, role: newRole } : user)))
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg">Admin Dashboard</Heading>
          </Flex>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading admin dashboard data...</Text>
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
                  <StatLabel>Total Users</StatLabel>
                  <HStack>
                    <StatNumber>{stats?.total_users || 0}</StatNumber>
                    <Icon as={FiUsers} color="blue.500" />
                  </HStack>
                  <StatHelpText>Platform users</StatHelpText>
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

              <Tabs variant="enclosed">
                <TabList>
                  <Tab>User Management</Tab>
                  <Tab>System Logs</Tab>
                  <Tab>Statistics</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md">User Management</Heading>
                        <InputGroup maxW="300px">
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiSearch} color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Flex>

                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Email</Th>
                            <Th>Name</Th>
                            <Th>Role</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredUsers.map((user, index) => (
                            <Tr key={index}>
                              <Td>{user.email}</Td>
                              <Td>{user.name}</Td>
                              <Td>
                                <Badge colorScheme={user.role === "admin" ? "purple" : "blue"}>{user.role}</Badge>
                              </Td>
                              <Td>
                                <Select
                                  size="sm"
                                  value={user.role}
                                  onChange={(e) => handleUserStatusChange(user.email, e.target.value)}
                                  maxW="150px"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </Select>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                      <Heading size="md" mb={4}>
                        System Logs
                      </Heading>

                      {logs.length > 0 ? (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Timestamp</Th>
                              <Th>Event Type</Th>
                              <Th>User</Th>
                              <Th>Details</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {logs.map((log, index) => (
                              <Tr key={index}>
                                <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                                <Td>{log.event_type}</Td>
                                <Td>{log.user_email || "System"}</Td>
                                <Td>{log.details}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text textAlign="center" py={4} color={textColor}>
                          No system logs available.
                        </Text>
                      )}
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
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

                      {/* Top Users */}
                      {stats?.top_users && stats.top_users.length > 0 && (
                        <Box bg={cardBgColor} borderRadius="lg" boxShadow="md" p={6}>
                          <Heading size="md" mb={4}>
                            Most Active Users
                          </Heading>
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>User</Th>
                                <Th>Verifications</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {stats.top_users.map(([email, count], index) => (
                                <Tr key={index}>
                                  <Td>{email}</Td>
                                  <Td>{count}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      )}
                    </SimpleGrid>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default AdminDashboard

