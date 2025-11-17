# 🚀 API Monitoring Dashboard

A modern, responsive API monitoring dashboard built with Next.js 15, TypeScript, and PostgreSQL. This application provides real-time monitoring of API endpoints with beautiful visualizations and comprehensive system health tracking.

## ✨ Features

### 📊 Dashboard Overview
- **Real-time Monitoring**: Live system status updates every 30 seconds
- **Health Metrics**: System health, total requests, error rate, and average response time
- **Server Status**: Live server connectivity and latency monitoring
- **Responsive Design**: Mobile-first approach that works on all devices

### 🔍 API Endpoints Monitoring
- **Endpoint Status**: Real-time health status for all API endpoints
- **Performance Tracking**: Response time and request count monitoring
- **Manual Health Checks**: Individual endpoint check functionality
- **Status Indicators**: Visual badges for healthy, warning, and error states

### 📈 Performance Analytics
- **Requests Over Time**: Visual representation of API request patterns
- **Response Time Trends**: Track performance trends and identify bottlenecks
- **Historical Data**: 24-hour performance metrics with automatic data collection

### 📋 System Logs
- **Real-time Logs**: Live system log streaming with filtering capabilities
- **Log Levels**: INFO, WARN, and ERROR message categorization
- **Source Tracking**: Identify which system component generated each log
- **Timestamp Tracking**: Precise timing for all system events

## 🛠️ Technology Stack

### Core Framework
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - High-quality UI components

### Database & Backend
- **🗄️ PostgreSQL** - Robust relational database
- **🔮 Prisma** - Next-generation ORM
- **🌐 REST API** - Clean API endpoints for data fetching

### UI & Visualization
- **📊 Progress Charts** - Visual data representation
- **🎯 Lucide React** - Beautiful icon library
- **📱 Responsive Design** - Mobile-first approach
- **🌙 Dark Mode Support** - Theme-aware components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Setup Instructions

1. **Install Dependencies**
```bash
npm install
```

2. **Database Setup**
```bash
# Run the SQLite setup script
./setup-sqlite.sh

# Or manually run the steps:
npm run db:generate
npm run db:push
npm run db:seed
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Access Application**
Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   └── dashboard/           # Dashboard API endpoints
│   │       ├── status/          # System status API
│   │       ├── endpoints/       # API endpoints API
│   │       ├── logs/           # System logs API
│   │       └── metrics/        # Performance metrics API
│   ├── page.tsx                # Main dashboard page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/                  # React components
│   └── ui/                     # shadcn/ui components
├── hooks/                      # Custom React hooks
└── lib/                        # Utilities and configurations
    ├── db.ts                   # Database connection
    ├── utils.ts                # Utility functions
    └── socket.ts               # WebSocket setup
prisma/
├── schema.prisma               # Database schema
└── seed.ts                    # Database seed script
```

## 🗄️ Database Schema

### SystemStatus
- Tracks overall system health metrics
- Stores performance indicators and server status

### ApiEndpoint
- Monitors individual API endpoints
- Tracks response times and request counts

### SystemLog
- Stores system logs and health check information
- Categorizes logs by level and source

### PerformanceMetric
- Tracks historical performance data
- Enables trend analysis and reporting

## 🔌 API Endpoints

### System Status
- `GET /api/dashboard/status` - Get current system status
- `POST /api/dashboard/status` - Update system status

### API Endpoints
- `GET /api/dashboard/endpoints` - Get all API endpoints
- `POST /api/dashboard/endpoints` - Create new endpoint

### System Logs
- `GET /api/dashboard/logs` - Get system logs with pagination
- `POST /api/dashboard/logs` - Create new log entry

### Performance Metrics
- `GET /api/dashboard/metrics` - Get performance metrics
- `POST /api/dashboard/metrics` - Create new metric

## 🎨 Usage Examples

### Monitoring System Health
The dashboard automatically displays:
- System health percentage with visual progress bar
- Total request count with hourly change indicators
- Error rate with warning thresholds
- Average response time with performance indicators

### Checking API Endpoints
Each endpoint shows:
- Current status (Healthy/Warning/Error)
- Last check timestamp
- Response time in milliseconds
- Total request count
- Manual check button for immediate verification

### Viewing Performance Trends
The charts section provides:
- Request volume over time with progress bars
- Response time trends with performance indicators
- 24-hour historical data visualization
- Easy-to-read time-based formatting

### Managing System Logs
The logs section offers:
- Real-time log streaming
- Color-coded log levels
- Source component identification
- Scrollable interface with timestamps

## 🚀 Production Deployment

### Environment Variables
```env
# SQLite uses file-based storage, no DATABASE_URL needed
API_BASE_URL="http://localhost:3000"
NODE_ENV="production"
```

### Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] WebSocket real-time updates
- [ ] Email notifications for alerts
- [ ] User authentication and roles
- [ ] Customizable dashboard layouts
- [ ] Export functionality for reports
- [ ] Integration with external monitoring tools
- [ ] Mobile application companion
- [ ] Advanced analytics and insights

---

Built with ❤️ for modern API monitoring needs. Powered by Next.js and SQLite 🚀
