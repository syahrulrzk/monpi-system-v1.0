# API Monitoring Configuration

This document explains how to configure the API endpoints that are monitored by the system.

## Configuration Files

### Endpoints Configuration
The API endpoints to monitor are defined in [config/endpoints.json](file:///home/linux/monpi-system-v1.0/config/endpoints.json). You can modify this file to change which endpoints are monitored.

Example format:
```json
[
  {
    "id": "1",
    "name": "User Service",
    "url": "/api/users",
    "auth": {
      "required": false
    }
  },
  {
    "id": "2",
    "name": "Payment Service",
    "url": "/api/payments",
    "auth": {
      "required": true,
      "type": "bearer",
      "token": "${PAYMENT_API_TOKEN}"
    }
  },
  {
    "id": "3",
    "name": "Analytics Service",
    "url": "/api/analytics",
    "auth": {
      "required": true,
      "type": "api-key",
      "key": "${ANALYTICS_API_KEY}",
      "header": "x-api-key"
    }
  }
]
```

### Environment Variables
API calls are configured through environment variables in the [.env](file:///home/linux/monpi-system-v1.0/.env) file:

```env
API_BASE_URL="http://localhost:3000"

# Authentication Tokens
PAYMENT_API_TOKEN="your_payment_api_token_here"
ANALYTICS_API_KEY="your_analytics_api_key_here"
```

## How to Modify Monitored Endpoints

1. Edit [config/endpoints.json](file:///home/linux/monpi-system-v1.0/config/endpoints.json) to add, remove, or modify endpoints
2. Each endpoint requires:
   - `id`: A unique identifier
   - `name`: A descriptive name for the service
   - `url`: The API endpoint path to monitor
   - `auth`: Authentication configuration (optional)
     - `required`: Set to `true` if the endpoint requires authentication
     - `type`: Authentication type (`bearer`, `api-key`, `basic`, or `oauth2`)
     - `token`: The bearer/oauth2 token (for `bearer` or `oauth2` auth types)
     - `key`: The API key (for `api-key` auth type)
     - `header`: The header name for API key (defaults to `x-api-key`)
     - `username`: Username for basic auth
     - `password`: Password for basic auth
     
     For security, use environment variable references like `${VAR_NAME}` instead of actual values.
3. Restart the development server for changes to take effect:
   ```bash
   npm run dev
   ```

## How to Change the Base URL

1. Edit the [.env](file:///home/linux/monpi-system-v1.0/.env) file
2. Modify the `API_BASE_URL` value to point to your API server
3. Restart the development server for changes to take effect

Example for a different server:
```env
API_BASE_URL="http://192.168.1.100:8080"
```