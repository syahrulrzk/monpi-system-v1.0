import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create initial system status
  const systemStatus = await prisma.systemStatus.create({
    data: {
      systemHealth: 100.0,
      totalRequests: 57143,
      errorRate: 1.7,
      avgResponseTime: 103,
      serverStatus: 'Online',
      serverLatency: 24
    }
  })

  console.log('Created system status:', systemStatus)

  // Create API endpoints
  const endpoints = await Promise.all([
    prisma.apiEndpoint.create({
      data: {
        name: 'User Service',
        url: '/api/users',
        status: 'healthy',
        responseTime: 95,
        requestCount: 15234
      }
    }),
    prisma.apiEndpoint.create({
      data: {
        name: 'Auth Service',
        url: '/api/auth',
        status: 'healthy',
        responseTime: 87,
        requestCount: 8932
      }
    }),
    prisma.apiEndpoint.create({
      data: {
        name: 'Payment Service',
        url: '/api/payments',
        status: 'healthy',
        responseTime: 156,
        requestCount: 4521
      }
    }),
    prisma.apiEndpoint.create({
      data: {
        name: 'Notification Service',
        url: '/api/notifications',
        status: 'healthy',
        responseTime: 73,
        requestCount: 12345
      }
    }),
    prisma.apiEndpoint.create({
      data: {
        name: 'Analytics Service',
        url: '/api/analytics',
        status: 'healthy',
        responseTime: 203,
        requestCount: 6789
      }
    })
  ])

  console.log('Created API endpoints:', endpoints)

  // Create system logs
  const logs = await Promise.all([
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Health check passed',
        source: 'API Performance'
      }
    }),
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Health check passed',
        source: 'API Metrics'
      }
    }),
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Health check passed',
        source: 'System Health'
      }
    }),
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Health check passed',
        source: 'Database Connection'
      }
    }),
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Health check passed',
        source: 'Cache System'
      }
    })
  ])

  console.log('Created system logs:', logs)

  // Create performance metrics
  const metrics = await Promise.all([
    prisma.performanceMetric.create({
      data: {
        requests: 1200,
        responseTime: 95
      }
    }),
    prisma.performanceMetric.create({
      data: {
        requests: 800,
        responseTime: 87
      }
    }),
    prisma.performanceMetric.create({
      data: {
        requests: 2500,
        responseTime: 103
      }
    }),
    prisma.performanceMetric.create({
      data: {
        requests: 3200,
        responseTime: 115
      }
    }),
    prisma.performanceMetric.create({
      data: {
        requests: 2800,
        responseTime: 98
      }
    }),
    prisma.performanceMetric.create({
      data: {
        requests: 1800,
        responseTime: 89
      }
    })
  ])

  console.log('Created performance metrics:', metrics)

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })