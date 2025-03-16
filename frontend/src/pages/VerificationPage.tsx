import type React from "react"
import { Box, Heading, Container, Text, VStack, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react"
import EmailVerifier from "../components/EmailVerifier"
import StatisticsDashboard from "../components/StatisticsDashboard"
import Navbar from "../components/Navbar"

const VerificationPage: React.FC = () => {
  return (
    <Box>
      <Navbar />

      <Container maxW="container.xl" py={5}>
        <VStack spacing={5} align="stretch">
          <Box>
            <Heading as="h1" size="xl">
              Email Verification
            </Heading>
            <Text mt={2} color="gray.600">
              Verify email addresses using multiple methods to determine if they exist and are deliverable.
            </Text>
          </Box>

          <Tabs variant="line" colorScheme="blue">
            <TabList>
              <Tab>Verify</Tab>
              <Tab>Statistics</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <EmailVerifier />
              </TabPanel>

              <TabPanel>
                <StatisticsDashboard />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  )
}

export default VerificationPage

