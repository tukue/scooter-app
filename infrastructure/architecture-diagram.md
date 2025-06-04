# Scooter App Infrastructure Architecture

## Architecture Overview

The Scooter App infrastructure is built on AWS using a serverless architecture pattern with the following key components:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        Scooter App Architecture                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
                ┌───────────────────────────────────────────────────────────┐
                │                      Amazon Cognito                       │
                │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐  │
                │  │   User Pool     │  │  Web Client     │  │  Mobile   │  │
                │  └─────────────────┘  └─────────────────┘  │  Client   │  │
                └───────────────────────────────────────────────────────────┘
                                                │
                                                ▼
                ┌───────────────────────────────────────────────────────────┐
                │                    API Gateway                            │
                │  ┌─────────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
                │  │ User Profile│  │ Search  │  │ Start   │  │ End Trip │  │
                │  └─────────────┘  └─────────┘  │ Trip    │  └──────────┘  │
                │                                └─────────┘                │
                │  ┌─────────────┐                                          │
                │  │ Leaderboard │                                          │
                │  └─────────────┘                                          │
                └───────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      Lambda Functions                                          │
│                                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ GetUserProfile  │  │ SearchScooters  │  │ StartTrip       │  │ EndTrip                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                                                     │
│  │ GetLeaderboard  │  │ UpdateLeaderboard│                                                    │
│  └─────────────────┘  └─────────────────┘                                                     │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
          │                    │                     │                      │
          ▼                    ▼                     ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│                 │  │                 │  │                     │  │                     │
│  Amazon         │  │  Amazon         │  │  Amazon DynamoDB    │  │  Amazon DocumentDB  │
│  ElastiCache    │  │  EventBridge    │  │                     │  │                     │
│  (Redis)        │  │  (Scheduler)    │  │  ┌─────────────┐    │  │  ┌─────────────┐    │
│                 │  │                 │  │  │ Fleet Table │    │  │  │ User        │    │
│                 │  │                 │  │  └─────────────┘    │  │  │ Profiles    │    │
│                 │  │                 │  │  ┌─────────────┐    │  │  └─────────────┘    │
│                 │  │                 │  │  │ Trip Table  │    │  │                     │
│                 │  │                 │  │  └─────────────┘    │  │                     │
└─────────────────┘  └─────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Service Integration

### Network Layer
- **VPC**: Private network with public and private subnets across multiple availability zones
- **Security Groups**: Controlling access between services

### Authentication & Authorization
- **Amazon Cognito**: Manages user authentication for both web and mobile clients
- **API Gateway Authorizer**: Validates tokens from Cognito

### API Layer
- **Amazon API Gateway**: RESTful API endpoints secured with Cognito authorizers
- **Endpoints**:
  - `/user-profile` - GET: Retrieve user profile information
  - `/search` - GET: Search for available scooters
  - `/start-trip` - POST: Start a scooter trip
  - `/end-trip` - POST: End a scooter trip
  - `/leaderboard` - GET: Get user leaderboard

### Compute Layer
- **AWS Lambda**: Serverless functions for business logic
  - `GetUserProfile`: Retrieves user profile data
  - `SearchScooters`: Finds available scooters near user location
  - `StartTrip`: Initiates a scooter rental
  - `EndTrip`: Completes a scooter rental
  - `GetLeaderboard`: Retrieves leaderboard data
  - `UpdateLeaderboard`: Scheduled function to update leaderboard

### Data Storage
- **Amazon DynamoDB**:
  - `Fleet Table`: Stores scooter information with GSI on Status+Location
  - `Trip Table`: Records trip data with GSIs for user trips and scooter trips
- **Amazon DocumentDB**: MongoDB-compatible database for user profiles
- **Amazon ElastiCache (Redis)**: In-memory caching for:
  - User profiles
  - Scooter search results
  - Leaderboard data

### Event Processing
- **Amazon EventBridge**: Scheduled events for updating the leaderboard

## Data Flow

1. **User Authentication**:
   - Users authenticate via Cognito
   - Receive JWT tokens for API access

2. **Scooter Search**:
   - User requests nearby scooters
   - Lambda queries DynamoDB Fleet table with GSI
   - Results cached in Redis for performance

3. **Trip Management**:
   - Start Trip: Updates scooter status in Fleet table, creates record in Trip table
   - End Trip: Updates trip record, calculates cost, updates scooter status

4. **User Profiles**:
   - Stored in DocumentDB
   - Cached in Redis for faster access

5. **Leaderboard**:
   - Updated hourly via EventBridge scheduled event
   - Stored in Redis for fast retrieval

## CloudFormation Stack Structure

The infrastructure is deployed using nested CloudFormation stacks:

1. **Main Stack**: Orchestrates the deployment of all nested stacks
2. **Network Stack**: VPC, subnets, security groups
3. **Database Stack**: DynamoDB tables and DocumentDB cluster
4. **Cache Stack**: ElastiCache Redis cluster
5. **Lambda Stack**: Lambda functions and execution roles
6. **API Stack**: API Gateway and Cognito resources

This architecture provides a scalable, highly available solution for the Scooter App with separation of concerns and appropriate service integrations.