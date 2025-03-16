"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Textarea,
  useToast,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Tooltip,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Checkbox,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react"
import { InfoIcon, DownloadIcon, CheckIcon, CloseIcon, WarningIcon, QuestionIcon } from "@chakra-ui/icons"
import { verifyEmail, verifyBatch, getVerificationStatus, getVerificationResults } from "../services/api"

// Define types
interface VerificationResult {
  email: string
  category: string
  reason: string
  provider: string
  method?: string
  details?: any
}

interface BatchTask {
  task_id: string
  status: string
  total: number
  completed: number
  progress: number
  start_time: string
  end_time?: string
  method?: string
}

interface BatchResults {
  task_id: string
  status: string
  total: number
  completed: number
  method?: string
  results: {
    [email: string]: VerificationResult
  }
}

const EmailVerifier: React.FC = () => {
  // State for single email verification
  const [email, setEmail] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  // State for batch verification
  const [batchEmails, setBatchEmails] = useState("")
  const [batchVerifying, setBatchVerifying] = useState(false)
  const [batchTask, setBatchTask] = useState<BatchTask | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResults | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // State for file upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")

  // State for verification options
  const [verificationMethod, setVerificationMethod] = useState("auto")
  const [skipWhitelisted, setSkipWhitelisted] = useState(true)
  const [checkCatchAll, setCheckCatchAll] = useState(true)

  // Modal for details
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [detailsEmail, setDetailsEmail] = useState("")
  const [detailsResult, setDetailsResult] = useState<VerificationResult | null>(null)

  const toast = useToast()

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Handle single email verification
  const handleVerify = async () => {
    if (!email) {
      toast({
        title: "Email is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      const response = await verifyEmail(email, verificationMethod)
      setResult(response.data)

      toast({
        title: "Verification complete",
        description: `Email is ${response.data.category} (using ${response.data.method || "auto"} method)`,
        status:
          response.data.category === "valid" ? "success" : response.data.category === "invalid" ? "error" : "warning",
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Verification failed",
        description: (error as any).response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setVerifying(false)
    }
  }

  // Handle batch verification
  const handleBatchVerify = async () => {
    if (!batchEmails) {
      toast({
        title: "Emails are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Parse emails
    const emails = batchEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email)

    if (emails.length === 0) {
      toast({
        title: "No valid emails found",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setBatchVerifying(true)
    setBatchTask(null)
    setBatchResults(null)

    try {
      const response = await verifyBatch(emails, verificationMethod)
      const taskId = response.data.task_id

      // Set initial task status
      setBatchTask({
        task_id: taskId,
        status: "pending",
        total: emails.length,
        completed: 0,
        progress: 0,
        start_time: new Date().toISOString(),
        method: verificationMethod,
      })

      // Start polling for status updates
      const interval = setInterval(async () => {
        try {
          const statusResponse = await getVerificationStatus(taskId)
          const status = statusResponse.data

          setBatchTask(status)

          // If completed, get results and stop polling
          if (status.status === "completed") {
            const resultsResponse = await getVerificationResults(taskId)
            setBatchResults(resultsResponse.data)

            if (pollingInterval) {
              clearInterval(pollingInterval)
              setPollingInterval(null)
            }

            setBatchVerifying(false)

            toast({
              title: "Batch verification complete",
              description: `Verified ${status.total} emails using ${status.method || "auto"} method`,
              status: "success",
              duration: 5000,
              isClosable: true,
            })
          }
        } catch (error) {
          console.error("Error polling status:", error)
        }
      }, 2000)

      setPollingInterval(interval)
    } catch (error) {
      setBatchVerifying(false)

      toast({
        title: "Batch verification failed",
        description: (error as any).response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setBatchEmails(content)
    }
    reader.readAsText(file)
  }

  // Handle showing details
  const showDetails = (email: string, result: VerificationResult) => {
    setDetailsEmail(email)
    setDetailsResult(result)
    onOpen()
  }

  // Get badge color based on category
  const getBadgeColor = (category: string) => {
    switch (category) {
      case "valid":
        return "green"
      case "invalid":
        return "red"
      case "risky":
        return "yellow"
      case "custom":
        return "purple"
      case "error":
        return "gray"
      default:
        return "blue"
    }
  }

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "valid":
        return <CheckIcon />
      case "invalid":
        return <CloseIcon />
      case "risky":
        return <WarningIcon />
      case "custom":
      case "error":
      default:
        return <QuestionIcon />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Download results as CSV
  const downloadResults = () => {
    if (!batchResults) return

    const results = batchResults.results
    const headers = ["Email", "Category", "Reason", "Provider", "Method"]

    let csv = headers.join(",") + "\n"

    Object.entries(results).forEach(([email, result]) => {
      const row = [
        email,
        result.category,
        `"${result.reason.replace(/"/g, '""')}"`,
        result.provider,
        result.method || "auto",
      ]

      csv += row.join(",") + "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `email-verification-results-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Alert status="info" mb={5}>
        <AlertIcon />
        <Box>
          <AlertTitle>Verification Methods:</AlertTitle>
          <AlertDescription>
            <Text>
              - Auto: Automatically selects the best method based on availability
              <br />- Login: Uses login simulation (verifier1) to check email validity
              <br />- SMTP: Uses SMTP bounce verification (verifier2) to check email validity
            </Text>
          </AlertDescription>
        </Box>
      </Alert>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Single Email</Tab>
          <Tab>Batch Verification</Tab>
        </TabList>

        <TabPanels>
          {/* Single Email Verification */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Verify Single Email</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email to verify"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Verification Method</FormLabel>
                    <Select value={verificationMethod} onChange={(e) => setVerificationMethod(e.target.value)}>
                      <option value="auto">Auto (Recommended)</option>
                      <option value="login">Login Simulation (verifier1)</option>
                      <option value="smtp">SMTP Verification (verifier2)</option>
                    </Select>
                  </FormControl>

                  <HStack>
                    <Checkbox isChecked={skipWhitelisted} onChange={(e) => setSkipWhitelisted(e.target.checked)}>
                      Skip Whitelisted Domains
                    </Checkbox>

                    <Checkbox isChecked={checkCatchAll} onChange={(e) => setCheckCatchAll(e.target.checked)}>
                      Check for Catch-all Domains
                    </Checkbox>
                  </HStack>

                  <Button colorScheme="blue" onClick={handleVerify} isLoading={verifying} loadingText="Verifying...">
                    Verify Email
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <Heading size="md">Verification Result</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Text fontWeight="bold">Email:</Text>
                      <Text>{result.email}</Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge colorScheme={getBadgeColor(result.category)} px={2} py={1} borderRadius="md">
                        <HStack spacing={1}>
                          {getCategoryIcon(result.category)}
                          <Text>{result.category.toUpperCase()}</Text>
                        </HStack>
                      </Badge>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Method:</Text>
                      <Text>{result.method || "auto"}</Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Reason:</Text>
                      <Text>{result.reason}</Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Provider:</Text>
                      <Text>{result.provider}</Text>
                    </HStack>

                    <Button size="sm" leftIcon={<InfoIcon />} onClick={() => showDetails(result.email, result)}>
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* Batch Verification */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Batch Email Verification</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>
                      Email Addresses
                      <Tooltip label="Enter one email per line, or separate with commas or semicolons">
                        <InfoIcon ml={2} />
                      </Tooltip>
                    </FormLabel>
                    <Textarea
                      value={batchEmails}
                      onChange={(e) => setBatchEmails(e.target.value)}
                      placeholder="Enter emails to verify (one per line, or comma/semicolon separated)"
                      minHeight="200px"
                    />
                  </FormControl>

                  <HStack>
                    <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => fileInputRef.current?.click()}>
                      Upload File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept=".txt,.csv"
                      onChange={handleFileUpload}
                    />
                    {fileName && <Text fontSize="sm">{fileName}</Text>}
                  </HStack>

                  <FormControl>
                    <FormLabel>Verification Method</FormLabel>
                    <Select value={verificationMethod} onChange={(e) => setVerificationMethod(e.target.value)}>
                      <option value="auto">Auto (Recommended)</option>
                      <option value="login">Login Simulation (verifier1)</option>
                      <option value="smtp">SMTP Verification (verifier2)</option>
                    </Select>
                  </FormControl>

                  <HStack>
                    <Checkbox isChecked={skipWhitelisted} onChange={(e) => setSkipWhitelisted(e.target.checked)}>
                      Skip Whitelisted Domains
                    </Checkbox>

                    <Checkbox isChecked={checkCatchAll} onChange={(e) => setCheckCatchAll(e.target.checked)}>
                      Check for Catch-all Domains
                    </Checkbox>
                  </HStack>

                  <Button
                    colorScheme="blue"
                    onClick={handleBatchVerify}
                    isLoading={batchVerifying}
                    loadingText="Starting Verification..."
                    isDisabled={!batchEmails}
                  >
                    Verify Emails
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {batchTask && (
              <Card mb={5}>
                <CardHeader>
                  <Heading size="md">Verification Progress</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge
                        colorScheme={
                          batchTask.status === "completed"
                            ? "green"
                            : batchTask.status === "running"
                              ? "blue"
                              : "yellow"
                        }
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {batchTask.status.toUpperCase()}
                      </Badge>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Method:</Text>
                      <Text>{batchTask.method || "auto"}</Text>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">Progress:</Text>
                      <Text>
                        {batchTask.completed} / {batchTask.total} emails
                      </Text>
                    </HStack>

                    <Progress
                      value={batchTask.progress}
                      size="sm"
                      colorScheme="blue"
                      hasStripe
                      isAnimated={batchTask.status === "running"}
                    />

                    <HStack>
                      <Text fontWeight="bold">Start Time:</Text>
                      <Text>{formatDate(batchTask.start_time)}</Text>
                    </HStack>

                    {batchTask.end_time && (
                      <HStack>
                        <Text fontWeight="bold">End Time:</Text>
                        <Text>{formatDate(batchTask.end_time)}</Text>
                      </HStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {batchResults && (
              <Card>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Verification Results</Heading>
                    <Button size="sm" leftIcon={<DownloadIcon />} onClick={downloadResults}>
                      Download CSV
                    </Button>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Tabs variant="soft-rounded" colorScheme="blue">
                      <TabList>
                        <Tab>All ({Object.keys(batchResults.results).length})</Tab>
                        <Tab>
                          Valid ({Object.values(batchResults.results).filter((r) => r.category === "valid").length})
                        </Tab>
                        <Tab>
                          Invalid ({Object.values(batchResults.results).filter((r) => r.category === "invalid").length})
                        </Tab>
                        <Tab>
                          Risky ({Object.values(batchResults.results).filter((r) => r.category === "risky").length})
                        </Tab>
                        <Tab>
                          Other (
                          {
                            Object.values(batchResults.results).filter(
                              (r) => !["valid", "invalid", "risky"].includes(r.category),
                            ).length
                          }
                          )
                        </Tab>
                      </TabList>

                      <TabPanels>
                        {/* All Results */}
                        <TabPanel>
                          <Box maxH="400px" overflowY="auto">
                            <Table variant="simple" size="sm">
                              <Thead position="sticky" top={0} bg="white">
                                <Tr>
                                  <Th>Email</Th>
                                  <Th>Status</Th>
                                  <Th>Method</Th>
                                  <Th>Provider</Th>
                                  <Th>Reason</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Object.entries(batchResults.results).map(([email, result]) => (
                                  <Tr key={email}>
                                    <Td>{email}</Td>
                                    <Td>
                                      <Badge colorScheme={getBadgeColor(result.category)}>
                                        {result.category.toUpperCase()}
                                      </Badge>
                                    </Td>
                                    <Td>{result.method || "auto"}</Td>
                                    <Td>{result.provider}</Td>
                                    <Td>
                                      {result.reason.length > 50
                                        ? `${result.reason.substring(0, 50)}...`
                                        : result.reason}
                                    </Td>
                                    <Td>
                                      <IconButton
                                        aria-label="View details"
                                        icon={<InfoIcon />}
                                        size="sm"
                                        onClick={() => showDetails(email, result)}
                                      />
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </TabPanel>

                        {/* Valid Results */}
                        <TabPanel>
                          <Box maxH="400px" overflowY="auto">
                            <Table variant="simple" size="sm">
                              <Thead position="sticky" top={0} bg="white">
                                <Tr>
                                  <Th>Email</Th>
                                  <Th>Method</Th>
                                  <Th>Provider</Th>
                                  <Th>Reason</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Object.entries(batchResults.results)
                                  .filter(([_, result]) => result.category === "valid")
                                  .map(([email, result]) => (
                                    <Tr key={email}>
                                      <Td>{email}</Td>
                                      <Td>{result.method || "auto"}</Td>
                                      <Td>{result.provider}</Td>
                                      <Td>
                                        {result.reason.length > 50
                                          ? `${result.reason.substring(0, 50)}...`
                                          : result.reason}
                                      </Td>
                                      <Td>
                                        <IconButton
                                          aria-label="View details"
                                          icon={<InfoIcon />}
                                          size="sm"
                                          onClick={() => showDetails(email, result)}
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </TabPanel>

                        {/* Invalid Results */}
                        <TabPanel>
                          <Box maxH="400px" overflowY="auto">
                            <Table variant="simple" size="sm">
                              <Thead position="sticky" top={0} bg="white">
                                <Tr>
                                  <Th>Email</Th>
                                  <Th>Method</Th>
                                  <Th>Provider</Th>
                                  <Th>Reason</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Object.entries(batchResults.results)
                                  .filter(([_, result]) => result.category === "invalid")
                                  .map(([email, result]) => (
                                    <Tr key={email}>
                                      <Td>{email}</Td>
                                      <Td>{result.method || "auto"}</Td>
                                      <Td>{result.provider}</Td>
                                      <Td>
                                        {result.reason.length > 50
                                          ? `${result.reason.substring(0, 50)}...`
                                          : result.reason}
                                      </Td>
                                      <Td>
                                        <IconButton
                                          aria-label="View details"
                                          icon={<InfoIcon />}
                                          size="sm"
                                          onClick={() => showDetails(email, result)}
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </TabPanel>

                        {/* Risky Results */}
                        <TabPanel>
                          <Box maxH="400px" overflowY="auto">
                            <Table variant="simple" size="sm">
                              <Thead position="sticky" top={0} bg="white">
                                <Tr>
                                  <Th>Email</Th>
                                  <Th>Method</Th>
                                  <Th>Provider</Th>
                                  <Th>Reason</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Object.entries(batchResults.results)
                                  .filter(([_, result]) => result.category === "risky")
                                  .map(([email, result]) => (
                                    <Tr key={email}>
                                      <Td>{email}</Td>
                                      <Td>{result.method || "auto"}</Td>
                                      <Td>{result.provider}</Td>
                                      <Td>
                                        {result.reason.length > 50
                                          ? `${result.reason.substring(0, 50)}...`
                                          : result.reason}
                                      </Td>
                                      <Td>
                                        <IconButton
                                          aria-label="View details"
                                          icon={<InfoIcon />}
                                          size="sm"
                                          onClick={() => showDetails(email, result)}
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </TabPanel>

                        {/* Other Results */}
                        <TabPanel>
                          <Box maxH="400px" overflowY="auto">
                            <Table variant="simple" size="sm">
                              <Thead position="sticky" top={0} bg="white">
                                <Tr>
                                  <Th>Email</Th>
                                  <Th>Status</Th>
                                  <Th>Method</Th>
                                  <Th>Provider</Th>
                                  <Th>Reason</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Object.entries(batchResults.results)
                                  .filter(([_, result]) => !["valid", "invalid", "risky"].includes(result.category))
                                  .map(([email, result]) => (
                                    <Tr key={email}>
                                      <Td>{email}</Td>
                                      <Td>
                                        <Badge colorScheme={getBadgeColor(result.category)}>
                                          {result.category.toUpperCase()}
                                        </Badge>
                                      </Td>
                                      <Td>{result.method || "auto"}</Td>
                                      <Td>{result.provider}</Td>
                                      <Td>
                                        {result.reason.length > 50
                                          ? `${result.reason.substring(0, 50)}...`
                                          : result.reason}
                                      </Td>
                                      <Td>
                                        <IconButton
                                          aria-label="View details"
                                          icon={<InfoIcon />}
                                          size="sm"
                                          onClick={() => showDetails(email, result)}
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verification Details: {detailsEmail}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {detailsResult && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Text fontWeight="bold" minWidth="100px">
                    Status:
                  </Text>
                  <Badge colorScheme={getBadgeColor(detailsResult.category)} px={2} py={1} borderRadius="md">
                    <HStack spacing={1}>
                      {getCategoryIcon(detailsResult.category)}
                      <Text>{detailsResult.category.toUpperCase()}</Text>
                    </HStack>
                  </Badge>
                </HStack>

                <HStack>
                  <Text fontWeight="bold" minWidth="100px">
                    Method:
                  </Text>
                  <Text>{detailsResult.method || "auto"}</Text>
                </HStack>

                <HStack>
                  <Text fontWeight="bold" minWidth="100px">
                    Reason:
                  </Text>
                  <Text>{detailsResult.reason}</Text>
                </HStack>

                <HStack>
                  <Text fontWeight="bold" minWidth="100px">
                    Provider:
                  </Text>
                  <Text>{detailsResult.provider}</Text>
                </HStack>

                <Divider />

                <Heading size="sm">Details</Heading>

                {detailsResult.details ? (
                  <Accordion allowToggle>
                    {Object.entries(detailsResult.details).map(([key, value]) => (
                      <AccordionItem key={key}>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="bold">
                              {key}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                          </pre>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Text>No additional details available</Text>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default EmailVerifier

