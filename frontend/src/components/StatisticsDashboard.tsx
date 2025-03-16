"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Button,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Spinner,
  useToast,
  Divider,
  Progress,
} from "@chakra-ui/react"
import { getStatistics, getVerificationNames, getVerificationStatistics, getResultsSummary } from "../services/api"

interface StatisticsData {
  valid: {
    total: number
    reasons: Record<string, number>
  }
  invalid: {
    total: number
    reasons: Record<string, number>
  }
  risky: {
    total: number
    reasons: Record<string, number>
  }
  custom: {
    total: number
    reasons: Record<string, number>
  }
  domains: Record<
    string,
    {
      total: number
      valid: number
      invalid: number
      risky: number
      custom: number
    }
  >
  timestamp?: string
}

const StatisticsDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [verificationNames, setVerificationNames] = useState<string[]>([])
  const [selectedVerification, setSelectedVerification] = useState<string>("")
  const [verificationStats, setVerificationStats] = useState<StatisticsData | null>(null)
  const [resultsSummary, setResultsSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [recentResults, setRecentResults] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch global statistics
      const statsResponse = await getStatistics()
      setStatistics(statsResponse.data)

      // Fetch verification names
      const namesResponse = await getVerificationNames()
      setVerificationNames(namesResponse.data)

      // Fetch results summary
      const summaryResponse = await getResultsSummary()
      setResultsSummary(summaryResponse.data)

      // Fetch recent results (replace with actual API call when available)
      const recentResultsData = [
        { email: "test1@example.com", category: "valid", method: "smtp", provider: "google", timestamp: new Date() },
        {
          email: "test2@example.com",
          category: "invalid",
          method: "dns",
          provider: "microsoft",
          timestamp: new Date(),
        },
        { email: "test3@example.com", category: "risky", method: "auto", provider: "yahoo", timestamp: new Date() },
      ]
      setRecentResults(recentResultsData)

      setLoading(false)
    } catch (error) {
      toast({
        title: "Error fetching statistics",
        description: (error as any).response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      setLoading(false)
    }
  }

  const handleVerificationSelect = async (name: string) => {
    if (!name) {
      setVerificationStats(null)
      return
    }

    try {
      const response = await getVerificationStatistics(name)
      setVerificationStats(response.data)
      setSelectedVerification(name)
    } catch (error) {
      toast({
        title: "Error fetching verification statistics",
        description: (error as any).response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Get top reasons
  const getTopReasons = (reasons: Record<string, number>, limit = 5) => {
    return Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([reason, count]) => ({ reason, count }))
  }

  // Get top domains
  const getTopDomains = (domains: Record<string, any>, limit = 10) => {
    return Object.entries(domains)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([domain, stats]) => ({ domain, ...stats }))
  }

  // Calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "valid":
        return "green"
      case "invalid":
        return "red"
      case "risky":
        return "yellow"
      default:
        return "gray"
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" height="300px">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return (
    <Box>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Domains</Tab>
          <Tab>Verification History</Tab>
          <Tab>Recent Results</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Email Verification Summary</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5}>
                  <Stat>
                    <StatLabel>Valid Emails</StatLabel>
                    <StatNumber color="green.500">{resultsSummary.valid || 0}</StatNumber>
                    <StatHelpText>
                      {statistics &&
                        calculatePercentage(
                          resultsSummary.valid || 0,
                          Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                        ).toFixed(1)}
                      %
                    </StatHelpText>
                    <Progress
                      value={calculatePercentage(
                        resultsSummary.valid || 0,
                        Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                      )}
                      colorScheme="green"
                      size="sm"
                    />
                  </Stat>

                  <Stat>
                    <StatLabel>Invalid Emails</StatLabel>
                    <StatNumber color="red.500">{resultsSummary.invalid || 0}</StatNumber>
                    <StatHelpText>
                      {statistics &&
                        calculatePercentage(
                          resultsSummary.invalid || 0,
                          Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                        ).toFixed(1)}
                      %
                    </StatHelpText>
                    <Progress
                      value={calculatePercentage(
                        resultsSummary.invalid || 0,
                        Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                      )}
                      colorScheme="red"
                      size="sm"
                    />
                  </Stat>

                  <Stat>
                    <StatLabel>Risky Emails</StatLabel>
                    <StatNumber color="yellow.500">{resultsSummary.risky || 0}</StatNumber>
                    <StatHelpText>
                      {statistics &&
                        calculatePercentage(
                          resultsSummary.risky || 0,
                          Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                        ).toFixed(1)}
                      %
                    </StatHelpText>
                    <Progress
                      value={calculatePercentage(
                        resultsSummary.risky || 0,
                        Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                      )}
                      colorScheme="yellow"
                      size="sm"
                    />
                  </Stat>

                  <Stat>
                    <StatLabel>Custom/Other</StatLabel>
                    <StatNumber color="purple.500">{resultsSummary.custom || 0}</StatNumber>
                    <StatHelpText>
                      {statistics &&
                        calculatePercentage(
                          resultsSummary.custom || 0,
                          Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                        ).toFixed(1)}
                      %
                    </StatHelpText>
                    <Progress
                      value={calculatePercentage(
                        resultsSummary.custom || 0,
                        Object.values(resultsSummary).reduce((a, b) => a + b, 0),
                      )}
                      colorScheme="purple"
                      size="sm"
                    />
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {statistics && (
              <>
                <Card mb={5}>
                  <CardHeader>
                    <Heading size="md">Top Reasons by Category</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                      <Box>
                        <Heading size="sm" mb={3} color="green.500">
                          Valid Emails
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                          {getTopReasons(statistics.valid.reasons).map((item, index) => (
                            <HStack key={index} justify="space-between">
                              <Text fontSize="sm" noOfLines={1} title={item.reason}>
                                {item.reason.length > 30 ? `${item.reason.substring(0, 30)}...` : item.reason}
                              </Text>
                              <Badge colorScheme="green">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={3} color="red.500">
                          Invalid Emails
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                          {getTopReasons(statistics.invalid.reasons).map((item, index) => (
                            <HStack key={index} justify="space-between">
                              <Text fontSize="sm" noOfLines={1} title={item.reason}>
                                {item.reason.length > 30 ? `${item.reason.substring(0, 30)}...` : item.reason}
                              </Text>
                              <Badge colorScheme="red">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={3} color="yellow.500">
                          Risky Emails
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                          {getTopReasons(statistics.risky.reasons).map((item, index) => (
                            <HStack key={index} justify="space-between">
                              <Text fontSize="sm" noOfLines={1} title={item.reason}>
                                {item.reason.length > 30 ? `${item.reason.substring(0, 30)}...` : item.reason}
                              </Text>
                              <Badge colorScheme="yellow">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={3} color="purple.500">
                          Custom/Other
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                          {getTopReasons(statistics.custom.reasons).map((item, index) => (
                            <HStack key={index} justify="space-between">
                              <Text fontSize="sm" noOfLines={1} title={item.reason}>
                                {item.reason.length > 30 ? `${item.reason.substring(0, 30)}...` : item.reason}
                              </Text>
                              <Badge colorScheme="purple">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </>
            )}
          </TabPanel>

          {/* Domains Tab */}
          <TabPanel>
            {statistics && (
              <Card>
                <CardHeader>
                  <Heading size="md">Top Domains</Heading>
                </CardHeader>
                <CardBody>
                  <Box maxH="500px" overflowY="auto">
                    <Table variant="simple">
                      <Thead position="sticky" top={0} bg="white">
                        <Tr>
                          <Th>Domain</Th>
                          <Th isNumeric>Total</Th>
                          <Th isNumeric>Valid</Th>
                          <Th isNumeric>Invalid</Th>
                          <Th isNumeric>Risky</Th>
                          <Th isNumeric>Custom</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {getTopDomains(statistics.domains, 50).map((domain, index) => (
                          <Tr key={index}>
                            <Td>{domain.domain}</Td>
                            <Td isNumeric>{domain.total}</Td>
                            <Td isNumeric>
                              <Badge colorScheme="green">{domain.valid}</Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme="red">{domain.invalid}</Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme="yellow">{domain.risky}</Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme="purple">{domain.custom}</Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* Verification History Tab */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Verification History</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <Select
                      placeholder="Select verification"
                      value={selectedVerification}
                      onChange={(e) => handleVerificationSelect(e.target.value)}
                    >
                      {verificationNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </Select>

                    <Button colorScheme="blue" onClick={fetchData} size="md">
                      Refresh
                    </Button>
                  </HStack>

                  {verificationStats && (
                    <>
                      <Divider />

                      <Heading size="sm">
                        Verification: {selectedVerification}
                        {verificationStats.timestamp && (
                          <Text as="span" fontSize="xs" ml={2} color="gray.500">
                            ({formatDate(verificationStats.timestamp)})
                          </Text>
                        )}
                      </Heading>

                      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5}>
                        <Stat>
                          <StatLabel>Valid Emails</StatLabel>
                          <StatNumber color="green.500">{verificationStats.valid.total}</StatNumber>
                          <StatHelpText>
                            {calculatePercentage(
                              verificationStats.valid.total,
                              verificationStats.valid.total +
                                verificationStats.invalid.total +
                                verificationStats.risky.total +
                                verificationStats.custom.total,
                            ).toFixed(1)}
                            %
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Invalid Emails</StatLabel>
                          <StatNumber color="red.500">{verificationStats.invalid.total}</StatNumber>
                          <StatHelpText>
                            {calculatePercentage(
                              verificationStats.invalid.total,
                              verificationStats.valid.total +
                                verificationStats.invalid.total +
                                verificationStats.risky.total +
                                verificationStats.custom.total,
                            ).toFixed(1)}
                            %
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Risky Emails</StatLabel>
                          <StatNumber color="yellow.500">{verificationStats.risky.total}</StatNumber>
                          <StatHelpText>
                            {calculatePercentage(
                              verificationStats.risky.total,
                              verificationStats.valid.total +
                                verificationStats.invalid.total +
                                verificationStats.risky.total +
                                verificationStats.custom.total,
                            ).toFixed(1)}
                            %
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Custom/Other</StatLabel>
                          <StatNumber color="purple.500">{verificationStats.custom.total}</StatNumber>
                          <StatHelpText>
                            {calculatePercentage(
                              verificationStats.custom.total,
                              verificationStats.valid.total +
                                verificationStats.invalid.total +
                                verificationStats.risky.total +
                                verificationStats.custom.total,
                            ).toFixed(1)}
                            %
                          </StatHelpText>
                        </Stat>
                      </SimpleGrid>

                      <Heading size="sm" mt={4}>
                        Top Domains
                      </Heading>
                      <Box maxH="300px" overflowY="auto">
                        <Table variant="simple" size="sm">
                          <Thead position="sticky" top={0} bg="white">
                            <Tr>
                              <Th>Domain</Th>
                              <Th isNumeric>Total</Th>
                              <Th isNumeric>Valid</Th>
                              <Th isNumeric>Invalid</Th>
                              <Th isNumeric>Risky</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {getTopDomains(verificationStats.domains, 10).map((domain, index) => (
                              <Tr key={index}>
                                <Td>{domain.domain}</Td>
                                <Td isNumeric>{domain.total}</Td>
                                <Td isNumeric>{domain.valid}</Td>
                                <Td isNumeric>{domain.invalid}</Td>
                                <Td isNumeric>{domain.risky}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Recent Results Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Recent Results</Heading>
              </CardHeader>
              <CardBody>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Email</Th>
                        <Th>Status</Th>
                        <Th>Method</Th>
                        <Th>Provider</Th>
                        <Th>Timestamp</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recentResults.map((result, index) => (
                        <Tr key={index}>
                          <Td>{result.email}</Td>
                          <Td>
                            <Badge colorScheme={getCategoryColor(result.category)}>
                              {result.category.toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>{result.method || "auto"}</Td>
                          <Td>{result.provider}</Td>
                          <Td>{formatDate(result.timestamp)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default StatisticsDashboard

