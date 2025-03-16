"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Badge,
} from "@chakra-ui/react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts"
import { api } from "../services/api"

interface MethodStats {
  method: string
  count: number
  valid: number
  invalid: number
  risky: number
  custom: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const MethodStatistics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [methodStats, setMethodStats] = useState<MethodStats[]>([])

  useEffect(() => {
    fetchMethodStats()
  }, [])

  const fetchMethodStats = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/statistics/methods")
      setMethodStats(response.data)
      setError(null)
    } catch (err) {
      setError("Failed to load method statistics")
      console.error("Error fetching method statistics:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" />
      </Flex>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    )
  }

  // If no real data, use mock data
  const data =
    methodStats.length > 0
      ? methodStats
      : [
          { method: "auto", count: 120, valid: 80, invalid: 20, risky: 15, custom: 5 },
          { method: "login", count: 85, valid: 60, invalid: 15, risky: 8, custom: 2 },
          { method: "smtp", count: 35, valid: 20, invalid: 5, risky: 7, custom: 3 },
        ]

  const totalVerifications = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Box>
      <Heading size="md" mb={4}>
        Verification Method Statistics
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Card>
          <CardHeader>
            <Heading size="sm">Method Distribution</Heading>
          </CardHeader>
          <CardBody>
            <Box height="250px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="method"
                    label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="sm">Method Success Rates</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              {data.map((item, index) => (
                <Stat key={index}>
                  <StatLabel>{item.method}</StatLabel>
                  <StatNumber>{((item.valid / item.count) * 100).toFixed(1)}%</StatNumber>
                  <Text fontSize="sm">
                    <Badge colorScheme="green">Valid: {item.valid}</Badge>{" "}
                    <Badge colorScheme="red">Invalid: {item.invalid}</Badge>
                  </Text>
                </Stat>
              ))}
            </StatGroup>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardHeader>
          <Heading size="sm">Method Details</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {data.map((item, index) => (
              <Card key={index} variant="outline">
                <CardHeader bg={COLORS[index % COLORS.length] + "20"} py={2}>
                  <Heading size="xs" textTransform="uppercase">
                    {item.method} Method
                  </Heading>
                </CardHeader>
                <CardBody>
                  <Text>
                    Total: {item.count} ({((item.count / totalVerifications) * 100).toFixed(1)}%)
                  </Text>
                  <Text>
                    <Badge colorScheme="green">Valid: {item.valid}</Badge>
                  </Text>
                  <Text>
                    <Badge colorScheme="red">Invalid: {item.invalid}</Badge>
                  </Text>
                  <Text>
                    <Badge colorScheme="yellow">Risky: {item.risky}</Badge>
                  </Text>
                  <Text>
                    <Badge colorScheme="purple">Custom: {item.custom}</Badge>
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  )
}

export default MethodStatistics

