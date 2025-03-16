"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react"
import { AddIcon } from "@chakra-ui/icons"
import { api } from "../services/api"

interface Setting {
  value: string
  enabled: boolean
}

interface Settings {
  [key: string]: Setting
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({})
  const [blacklistedDomains, setBlacklistedDomains] = useState<string[]>([])
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>([])
  const [proxies, setProxies] = useState<string[]>([])
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([])
  const [newDomain, setNewDomain] = useState("")
  const [newProxy, setNewProxy] = useState("")
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  // SMTP Account Modal
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [newSmtpAccount, setNewSmtpAccount] = useState({
    smtp_server: "",
    smtp_port: "",
    imap_server: "",
    imap_port: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    fetchSettings()
    fetchDomains()
    fetchProxies()
    fetchSmtpAccounts()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/settings")
      setSettings(response.data)
      setLoading(false)
    } catch (error) {
      toast({
        title: "Error fetching settings",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const fetchDomains = async () => {
    try {
      const blacklistResponse = await api.get("/api/domains/blacklist")
      setBlacklistedDomains(blacklistResponse.data)

      const whitelistResponse = await api.get("/api/domains/whitelist")
      setWhitelistedDomains(whitelistResponse.data)
    } catch (error) {
      toast({
        title: "Error fetching domains",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const fetchProxies = async () => {
    try {
      const response = await api.get("/api/settings/proxies")
      setProxies(response.data)
    } catch (error) {
      toast({
        title: "Error fetching proxies",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const fetchSmtpAccounts = async () => {
    try {
      const response = await api.get("/api/settings/smtp")
      setSmtpAccounts(response.data)
    } catch (error) {
      toast({
        title: "Error fetching SMTP accounts",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSettingChange = (feature: string, field: "value" | "enabled", value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [field]: value,
      },
    }))
  }

  const saveSettings = async () => {
    try {
      await api.post("/api/settings", settings)
      toast({
        title: "Settings saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Error saving settings",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const addDomain = async (type: "blacklist" | "whitelist") => {
    if (!newDomain) {
      toast({
        title: "Domain is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await api.post(`/api/domains/${type}`, { domain: newDomain })
      toast({
        title: `Domain added to ${type}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      setNewDomain("")
      fetchDomains()
    } catch (error) {
      toast({
        title: `Error adding domain to ${type}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const addProxy = async () => {
    if (!newProxy) {
      toast({
        title: "Proxy is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await api.post("/api/settings/proxies", { proxy: newProxy })
      toast({
        title: "Proxy added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      setNewProxy("")
      fetchProxies()
    } catch (error) {
      toast({
        title: "Error adding proxy",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSmtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSmtpAccount((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addSmtpAccount = async () => {
    // Validate all fields are filled
    for (const [key, value] of Object.entries(newSmtpAccount)) {
      if (!value) {
        toast({
          title: `${key.replace("_", " ")} is required`,
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }

    try {
      await api.post("/api/settings/smtp", newSmtpAccount)
      toast({
        title: "SMTP account added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      setNewSmtpAccount({
        smtp_server: "",
        smtp_port: "",
        imap_server: "",
        imap_port: "",
        email: "",
        password: "",
      })
      onClose()
      fetchSmtpAccounts()
    } catch (error) {
      toast({
        title: "Error adding SMTP account",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (loading) {
    return <Box p={5}>Loading settings...</Box>
  }

  return (
    <Box p={5}>
      <Heading mb={5}>Settings</Heading>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>General</Tab>
          <Tab>Browser</Tab>
          <Tab>Domains</Tab>
          <Tab>Proxies</Tab>
          <Tab>SMTP Accounts</Tab>
          <Tab>Rate Limiting</Tab>
        </TabList>

        <TabPanels>
          {/* General Settings */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">General Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <HStack>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="microsoft_api" mb="0">
                        Microsoft API
                      </FormLabel>
                      <Switch
                        id="microsoft_api"
                        isChecked={settings.microsoft_api?.enabled}
                        onChange={(e) => handleSettingChange("microsoft_api", "enabled", e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="catch_all_detection" mb="0">
                        Catch-all Detection
                      </FormLabel>
                      <Switch
                        id="catch_all_detection"
                        isChecked={settings.catch_all_detection?.enabled}
                        onChange={(e) => handleSettingChange("catch_all_detection", "enabled", e.target.checked)}
                      />
                    </FormControl>
                  </HStack>

                  <HStack>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="user_agent_rotation" mb="0">
                        User Agent Rotation
                      </FormLabel>
                      <Switch
                        id="user_agent_rotation"
                        isChecked={settings.user_agent_rotation?.enabled}
                        onChange={(e) => handleSettingChange("user_agent_rotation", "enabled", e.target.checked)}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="verification_loop_enabled" mb="0">
                        Verification Loop
                      </FormLabel>
                      <Switch
                        id="verification_loop_enabled"
                        isChecked={settings.verification_loop_enabled?.enabled}
                        onChange={(e) => handleSettingChange("verification_loop_enabled", "enabled", e.target.checked)}
                      />
                    </FormControl>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Multi-terminal Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="multi_terminal_enabled" mb="0">
                      Multi-terminal Enabled
                    </FormLabel>
                    <Switch
                      id="multi_terminal_enabled"
                      isChecked={settings.multi_terminal_enabled?.enabled}
                      onChange={(e) => handleSettingChange("multi_terminal_enabled", "enabled", e.target.checked)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="terminal_count">Terminal Count</FormLabel>
                    <Input
                      id="terminal_count"
                      type="number"
                      value={settings.terminal_count?.value || "2"}
                      onChange={(e) => handleSettingChange("terminal_count", "value", e.target.value)}
                      isDisabled={!settings.multi_terminal_enabled?.enabled}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="real_multiple_terminals" mb="0">
                      Real Multiple Terminals
                    </FormLabel>
                    <Switch
                      id="real_multiple_terminals"
                      isChecked={settings.real_multiple_terminals?.enabled}
                      onChange={(e) => handleSettingChange("real_multiple_terminals", "enabled", e.target.checked)}
                      isDisabled={!settings.multi_terminal_enabled?.enabled}
                    />
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Screenshot Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel htmlFor="screenshot_mode">Screenshot Mode</FormLabel>
                    <Select
                      id="screenshot_mode"
                      value={settings.screenshot_mode?.value || "problems"}
                      onChange={(e) => handleSettingChange("screenshot_mode", "value", e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="problems">Problems Only</option>
                      <option value="steps">Key Steps</option>
                      <option value="all">All Steps</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="screenshot_location">Screenshot Location</FormLabel>
                    <Input
                      id="screenshot_location"
                      value={settings.screenshot_location?.value || "./screenshots"}
                      onChange={(e) => handleSettingChange("screenshot_location", "value", e.target.value)}
                    />
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            <Button colorScheme="blue" onClick={saveSettings}>
              Save Settings
            </Button>
          </TabPanel>

          {/* Browser Settings */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Browser Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel htmlFor="browsers">Browsers (comma-separated)</FormLabel>
                    <Input
                      id="browsers"
                      value={settings.browsers?.value || "chrome,edge,firefox"}
                      onChange={(e) => handleSettingChange("browsers", "value", e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="browser_wait_time">Browser Wait Time (seconds)</FormLabel>
                    <Input
                      id="browser_wait_time"
                      type="number"
                      value={settings.browser_wait_time?.value || "3"}
                      onChange={(e) => handleSettingChange("browser_wait_time", "value", e.target.value)}
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="browser_headless" mb="0">
                      Headless Mode
                    </FormLabel>
                    <Switch
                      id="browser_headless"
                      isChecked={settings.browser_headless?.enabled}
                      onChange={(e) => handleSettingChange("browser_headless", "enabled", e.target.checked)}
                    />
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            <Button colorScheme="blue" onClick={saveSettings}>
              Save Settings
            </Button>
          </TabPanel>

          {/* Domains */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Blacklisted Domains</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <Input
                      placeholder="Enter domain to blacklist"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                    <Button leftIcon={<AddIcon />} colorScheme="red" onClick={() => addDomain("blacklist")}>
                      Add
                    </Button>
                  </HStack>

                  <Box maxH="300px" overflowY="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Domain</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {blacklistedDomains.map((domain, index) => (
                          <Tr key={index}>
                            <Td>{domain}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Whitelisted Domains</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <Input
                      placeholder="Enter domain to whitelist"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                    />
                    <Button leftIcon={<AddIcon />} colorScheme="green" onClick={() => addDomain("whitelist")}>
                      Add
                    </Button>
                  </HStack>

                  <Box maxH="300px" overflowY="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Domain</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {whitelistedDomains.map((domain, index) => (
                          <Tr key={index}>
                            <Td>{domain}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Proxies */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Proxy Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="proxy_enabled" mb="0">
                      Enable Proxies
                    </FormLabel>
                    <Switch
                      id="proxy_enabled"
                      isChecked={settings.proxy_enabled?.enabled}
                      onChange={(e) => handleSettingChange("proxy_enabled", "enabled", e.target.checked)}
                    />
                  </FormControl>

                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Input
                        placeholder="Enter proxy (host:port)"
                        value={newProxy}
                        onChange={(e) => setNewProxy(e.target.value)}
                        isDisabled={!settings.proxy_enabled?.enabled}
                      />
                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={addProxy}
                        isDisabled={!settings.proxy_enabled?.enabled}
                      >
                        Add
                      </Button>
                    </HStack>

                    <Box maxH="300px" overflowY="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Proxy</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {proxies.map((proxy, index) => (
                            <Tr key={index}>
                              <Td>{proxy}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                </Stack>
              </CardBody>
            </Card>

            <Button colorScheme="blue" onClick={saveSettings}>
              Save Settings
            </Button>
          </TabPanel>

          {/* SMTP Accounts */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">SMTP Accounts</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
                    Add SMTP Account
                  </Button>

                  <Box maxH="300px" overflowY="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Email</Th>
                          <Th>SMTP Server</Th>
                          <Th>SMTP Port</Th>
                          <Th>IMAP Server</Th>
                          <Th>IMAP Port</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {smtpAccounts.map((account, index) => (
                          <Tr key={index}>
                            <Td>{account.email}</Td>
                            <Td>{account.smtp_server}</Td>
                            <Td>{account.smtp_port}</Td>
                            <Td>{account.imap_server}</Td>
                            <Td>{account.imap_port}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Rate Limiting Settings */}
          <TabPanel>
            <Card mb={5}>
              <CardHeader>
                <Heading size="md">Rate Limiting Settings</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="rate_limit_enabled" mb="0">
                      Enable Rate Limiting
                    </FormLabel>
                    <Switch
                      id="rate_limit_enabled"
                      isChecked={settings.rate_limit_enabled?.enabled}
                      onChange={(e) => handleSettingChange("rate_limit_enabled", "enabled", e.target.checked)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="rate_limit_max_requests">Maximum Requests per Time Window</FormLabel>
                    <Input
                      id="rate_limit_max_requests"
                      type="number"
                      value={settings.rate_limit_max_requests?.value || "10"}
                      onChange={(e) => handleSettingChange("rate_limit_max_requests", "value", e.target.value)}
                      isDisabled={!settings.rate_limit_enabled?.enabled}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="rate_limit_time_window">Time Window (seconds)</FormLabel>
                    <Input
                      id="rate_limit_time_window"
                      type="number"
                      value={settings.rate_limit_time_window?.value || "60"}
                      onChange={(e) => handleSettingChange("rate_limit_time_window", "value", e.target.value)}
                      isDisabled={!settings.rate_limit_enabled?.enabled}
                    />
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            <Button colorScheme="blue" onClick={saveSettings}>
              Save Settings
            </Button>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* SMTP Account Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add SMTP Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input name="email" value={newSmtpAccount.email} onChange={handleSmtpInputChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={newSmtpAccount.password}
                  onChange={handleSmtpInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>SMTP Server</FormLabel>
                <Input name="smtp_server" value={newSmtpAccount.smtp_server} onChange={handleSmtpInputChange} />
              </FormControl>

              <FormControl>
                <FormLabel>SMTP Port</FormLabel>
                <Input
                  name="smtp_port"
                  type="number"
                  value={newSmtpAccount.smtp_port}
                  onChange={handleSmtpInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>IMAP Server</FormLabel>
                <Input name="imap_server" value={newSmtpAccount.imap_server} onChange={handleSmtpInputChange} />
              </FormControl>

              <FormControl>
                <FormLabel>IMAP Port</FormLabel>
                <Input
                  name="imap_port"
                  type="number"
                  value={newSmtpAccount.imap_port}
                  onChange={handleSmtpInputChange}
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={addSmtpAccount}>
              Add Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default SettingsPage

