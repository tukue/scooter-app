# Scooter App: 

## Overview

This project implements a leaderboard and caching system for a scooter-booking application using AWS services. It leverages DynamoDB, ElastiCache Redis, and Lambda functions to provide efficient data storage, caching, and real-time leaderboard functionality.

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
- `GET /leaderboard/top-riders`: Get top N riders
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


# creating application architecture diagram using draw.io 

 to install : 
 npm install -g cfn-diagram

To create the architecture diagram of a main.yaml from cloudformation yaml file.
npx cfn-diagram draw.io main.yaml






