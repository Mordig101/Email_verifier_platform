"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react"
import { api } from "../services/api"
import Navbar from "../components/Navbar"
import StatisticsDashboard from "../components/StatisticsDashboard"
import MethodStatistics from "../components/MethodStatistics"

interface StatisticsData {
  totalUsers: number
  activeUsers: number
  averageSessionDuration: number
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
}

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await api.get<StatisticsData>("/api/statistics")
        setStatistics(response.data)
        setLoading(false)
      } catch (error: any) {
        setError("Failed to fetch statistics.")
        setLoading(false)
        console.error(error)
      }
    }

    fetchStatistics()
  }, [])

  // Calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  // Get top domains
  const getTopDomains = (domains: Record<string, any>, limit = 10) => {
    return Object.entries(domains)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([domain, stats]) => ({ domain, ...stats }))
  }

  // Get top reasons
  const getTopReasons = (reasons: Record<string, number>, limit = 5) => {
    return Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([reason, count]) => ({ reason, count }))
  }

  return (
    <Box>
      <Navbar />

      <Container maxW="container.xl" py={5}>
        <VStack spacing={5} align="stretch">
          <Heading as="h1" size="xl">
            Statistics Dashboard
          </Heading>

          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading statistics...</Text>
            </Box>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : statistics ? (
            <Tabs variant="enclosed">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Verification Methods</Tab>
                <Tab>Domain Analysis</Tab>
                <Tab>History</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <StatisticsDashboard />
                </TabPanel>
                <TabPanel>
                  <MethodStatistics />
                </TabPanel>
                <TabPanel>{/* Domain Analysis Content */}</TabPanel>
                <TabPanel>{/* History Content */}</TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            <StatisticsDashboard />
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default StatisticsPage

