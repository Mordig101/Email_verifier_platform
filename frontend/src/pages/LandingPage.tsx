import type React from "react"
import { Link as RouterLink } from "react-router-dom"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Link,
  Image,
} from "@chakra-ui/react"
import { FiClock, FiBarChart2, FiShield, FiCode } from "react-icons/fi"

const Feature = ({ icon, title, text }: { icon: React.ReactElement; title: string; text: string }) => {
  const textColor = useColorModeValue("gray.600", "gray.400")
  const bgColor = useColorModeValue("white", "gray.800")
  const brandColor = useColorModeValue("brand.500", "brand.400")

  return (
    <VStack
      align="start"
      p={6}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
    >
      <Flex w={12} h={12} align="center" justify="center" borderRadius="full" bg={brandColor} color="white" mb={4}>
        {icon}
      </Flex>
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color={textColor}>{text}</Text>
    </VStack>
  )
}

const PricingCard = ({
  title,
  price,
  features,
  cta,
  popular = false,
}: {
  title: string
  price: string
  features: string[]
  cta: string
  popular?: boolean
}) => {
  const cardBgColor = useColorModeValue("white", "gray.800")
  const borderColorValue = useColorModeValue("gray.200", "gray.700")
  const textColor = useColorModeValue("gray.500", "gray.400")

  return (
    <VStack
      p={6}
      bg={cardBgColor}
      borderRadius="lg"
      boxShadow={popular ? "xl" : "md"}
      border={popular ? "2px solid" : "1px solid"}
      borderColor={popular ? "brand.500" : borderColorValue}
      spacing={4}
      position="relative"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
    >
      {popular && (
        <Badge position="absolute" top="-2" right="-2" colorScheme="brand" borderRadius="full" px={3} py={1}>
          Most Popular
        </Badge>
      )}
      <Heading size="md">{title}</Heading>
      <Heading size="xl">{price}</Heading>
      <Text fontSize="sm" color={textColor}>
        per month
      </Text>
      <VStack align="start" spacing={2} w="full">
        {features.map((feature, index) => (
          <HStack key={index}>
            <Box w={1} h={1} borderRadius="full" bg="brand.500" />
            <Text>{feature}</Text>
          </HStack>
        ))}
      </VStack>
      <Button
        as={RouterLink}
        to="/signup"
        colorScheme={popular ? "brand" : "gray"}
        variant={popular ? "solid" : "outline"}
        w="full"
      >
        {cta}
      </Button>
    </VStack>
  )
}

const Testimonial = ({ name, role, quote }: { name: string; role: string; quote: string }) => {
  const bgColor = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.600", "gray.400")

  return (
    <VStack p={6} bg={bgColor} borderRadius="lg" boxShadow="md" spacing={4} align="start">
      <Text fontSize="lg" fontStyle="italic">
        "{quote}"
      </Text>
      <HStack>
        <Box w={10} h={10} borderRadius="full" bg="gray.300" overflow="hidden">
          <Image src={`https://i.pravatar.cc/150?u=${name}`} alt={name} />
        </Box>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold">{name}</Text>
          <Text fontSize="sm" color={textColor}>
            {role}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  )
}

const LandingPage = () => {
  const navBgColor = useColorModeValue("white", "gray.800")
  const heroBgColor = useColorModeValue("gray.50", "gray.900")
  const featuresTextColor = useColorModeValue("gray.600", "gray.400")
  const pricingBgColor = useColorModeValue("gray.50", "gray.900")
  const footerBgColor = useColorModeValue("gray.100", "gray.800")
  const footerTextColor = useColorModeValue("gray.600", "gray.400")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  return (
    <Box>
      {/* Navbar */}
      <Box as="nav" py={4} px={8} bg={navBgColor} boxShadow="sm">
        <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
          <Heading size="md" color="brand.500">
            Email Verifier
          </Heading>
          <HStack spacing={4}>
            <Button as={RouterLink} to="/login" variant="ghost">
              Login
            </Button>
            <Button as={RouterLink} to="/signup" colorScheme="brand">
              Sign Up
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Hero Section */}
      <Box bg={heroBgColor} py={20} px={8}>
        <Container maxW="container.xl">
          <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between" gap={10}>
            <VStack align="start" spacing={6} maxW="container.md">
              <Heading as="h1" size="2xl" bgGradient="linear(to-r, brand.400, brand.600)" bgClip="text">
                Email Verification Made Easy
              </Heading>
              <Text fontSize="xl" color={featuresTextColor}>
                Verify email addresses instantly with our powerful verification tool. Save time, reduce bounce rates,
                and improve your email campaigns.
              </Text>
              <HStack spacing={4}>
                <Button as={RouterLink} to="/signup" colorScheme="brand" size="lg" px={8}>
                  Get Started
                </Button>
                <Button as={Link} href="#features" variant="outline" size="lg" px={8}>
                  Learn More
                </Button>
              </HStack>
            </VStack>
            <Box
              w={{ base: "full", md: "50%" }}
              h={{ base: "300px", md: "400px" }}
              bg="gray.200"
              borderRadius="lg"
              overflow="hidden"
            >
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Email Verification"
                w="full"
                h="full"
                objectFit="cover"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} px={8} id="features">
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading textAlign="center">Powerful Features</Heading>
              <Text textAlign="center" color={featuresTextColor} maxW="container.md">
                Our email verification platform provides everything you need to ensure your email list is clean, valid,
                and ready for your campaigns.
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
              <Feature
                icon={<Icon as={FiClock} w={6} h={6} />}
                title="Real-Time Verification"
                text="Verify emails in real-time with instant results. No waiting, no delays."
              />
              <Feature
                icon={<Icon as={FiBarChart2} w={6} h={6} />}
                title="Detailed Reports"
                text="Get comprehensive reports with insights into email validity, risk levels, and more."
              />
              <Feature
                icon={<Icon as={FiShield} w={6} h={6} />}
                title="Secure & Reliable"
                text="Your data is protected with end-to-end encryption. We prioritize your privacy."
              />
              <Feature
                icon={<Icon as={FiCode} w={6} h={6} />}
                title="API Integration"
                text="Integrate our verification tool into your apps with our developer-friendly API."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={20} px={8} bg={pricingBgColor}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading textAlign="center">Simple, Transparent Pricing</Heading>
              <Text textAlign="center" color={featuresTextColor} maxW="container.md">
                Choose the plan that works best for you. All plans include access to our core verification features.
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              <PricingCard
                title="Free"
                price="$0"
                features={["100 verifications/month", "Basic statistics", "Email support", "Single email verification"]}
                cta="Start Free"
              />
              <PricingCard
                title="Pro"
                price="$29"
                features={[
                  "Unlimited verifications",
                  "Advanced statistics",
                  "Priority support",
                  "Bulk verification",
                  "API access",
                ]}
                cta="Go Pro"
                popular={true}
              />
              <PricingCard
                title="Enterprise"
                price="Custom"
                features={[
                  "Custom solutions",
                  "Dedicated account manager",
                  "Premium support",
                  "Custom integrations",
                  "SLA guarantee",
                ]}
                cta="Contact Us"
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box py={20} px={8}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4}>
              <Heading textAlign="center">What Our Customers Say</Heading>
              <Text textAlign="center" color={featuresTextColor} maxW="container.md">
                Don't just take our word for it. Here's what our customers have to say about our email verification
                platform.
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              <Testimonial
                name="John Smith"
                role="Marketing Manager at XYZ Corp"
                quote="This platform saved us hours of work and improved our email deliverability by 40%. Highly recommended!"
              />
              <Testimonial
                name="Sarah Johnson"
                role="Email Specialist at ABC Inc"
                quote="The bulk verification feature is a game-changer. We can now clean our entire email list in minutes instead of days."
              />
              <Testimonial
                name="Michael Brown"
                role="CTO at StartupXYZ"
                quote="The API integration was seamless. We've incorporated email verification into our signup process, reducing fake accounts by 90%."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={10} px={8} bg={footerBgColor}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
            <VStack align="start" spacing={4}>
              <Heading size="md" color="brand.500">
                Email Verifier
              </Heading>
              <Text color={footerTextColor}>Verify email addresses instantly with our powerful verification tool.</Text>
            </VStack>
            <VStack align="start" spacing={4}>
              <Heading size="sm">About Us</Heading>
              <Link>Company</Link>
              <Link>Team</Link>
              <Link>Careers</Link>
            </VStack>
            <VStack align="start" spacing={4}>
              <Heading size="sm">Contact</Heading>
              <Link>Email</Link>
              <Link>Phone</Link>
              <Link>Support</Link>
            </VStack>
            <VStack align="start" spacing={4}>
              <Heading size="sm">Legal</Heading>
              <Link>Privacy Policy</Link>
              <Link>Terms of Service</Link>
              <Link>Cookie Policy</Link>
            </VStack>
          </SimpleGrid>
          <Box pt={10} mt={10} borderTopWidth={1} borderColor={borderColor}>
            <Text textAlign="center" color={footerTextColor}>
              © 2023 Email Verification Platform. All rights reserved.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage

