// Environment-specific configuration
const config = {
    // API base URL - use environment variable or fallback to the hardcoded value
    apiUrl: process.env.REACT_APP_API_URL || "http://192.168.1.235:5000",
  
    // Default credentials for testing
    defaultCredentials: {
      admin: {
        email: "admin@example.com",
        password: "admin123",
      },
      user: {
        email: "user@example.com",
        password: "user123",
      },
    },
  }
  
  export default config
  
  