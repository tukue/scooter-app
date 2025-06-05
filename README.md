# Scooter App: 

## Overview

This project implements a leaderboard and caching system for a scooter-or bicycle booking application using AWS services. It leverages DynamoDB, ElastiCache Redis, and Lambda functions to provide efficient data storage, caching, and real-time leaderboard functionality.

## Key Components

1. **DynamoDB Tables**: Fleet, Trip, User
2. **ElastiCache Redis**: For caching and leaderboards
3. **Lambda Functions**:
   - Leaderboard Function: Handles leaderboard operations
   - Cache Update Function: Syncs DynamoDB changes to ElastiCache
4. **API Gateway**: Exposes RESTful endpoints

## Core Functionality

### Leaderboard Function Endpoints
- `POST /leaderboard/update`: Update user score
- `GET /leaderboard/top-riders`: Get list of riders
- `GET /leaderboard/rank`: Get user rank and score

### Cache Update Function
- Triggered by DynamoDB Streams
- Updates Redis when Fleet or Trip tables change
- Maintains user leaderboard on trip completion

## Redis Data Structure
- Fleet data: Hashes (`fleet:{id}`)
- Trip data: Hashes (`trip:{id}`)
- Available fleets: Sorted set (`available_fleets`)
- User leaderboard: Sorted set (`user_leaderboard`)

## Setup
1. Create DynamoDB tables and ElastiCache cluster
2. Deploy Lambda functions
3. Configure API Gateway
4. Set up DynamoDB Streams
5. Link Cache Update Lambda to streams

## Architecture

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

### Service Integration

- **Network Layer**: VPC with private/public subnets across multiple AZs
- **Authentication**: Amazon Cognito for web and mobile clients
- **API Layer**: API Gateway with Cognito authorizers
- **Compute Layer**: Lambda functions for all business logic
- **Data Storage**: 
  - DynamoDB for Fleet and Trip data
  - DocumentDB for User Profiles
  - ElastiCache (Redis) for caching and leaderboards
- **Event Processing**: EventBridge for scheduled leaderboard updates

### CloudFormation Stack Structure

The infrastructure is deployed using nested CloudFormation stacks:

1. **Main Stack**: Orchestrates all nested stacks
2. **Network Stack**: VPC, subnets, security groups
3. **Database Stack**: DynamoDB tables and DocumentDB cluster
4. **Cache Stack**: ElastiCache Redis cluster
5. **Lambda Stack**: Lambda functions and execution roles
6. **API Stack**: API Gateway and Cognito resources

## Creating Architecture Diagrams

To create architecture diagrams from CloudFormation templates:

```bash
# Install cfn-diagram
npm install -g cfn-diagram

# Generate diagram from main template
npx cfn-diagram draw.io main.yaml
```


