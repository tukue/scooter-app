#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="scooter-app-stack-test"
TEMPLATE_DIR="../cloudformation"
REGION=${AWS_REGION:-"us-east-1"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to display step information
info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

cleanup() {
    info "Cleaning up test stack..."
    aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION
    success "Test stack cleaned up successfully"
}

# Run template validation first
info "Running template validation..."
./validate-templates.sh || error "Template validation failed"
success "Template validation completed"

# Create test stack
info "Creating test stack: $STACK_NAME"
aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://${TEMPLATE_DIR}/main.yaml \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region $REGION || error "Test stack creation failed"

# Wait for stack creation to complete
info "Waiting for test stack creation to complete..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION || {
    error "Test stack creation failed or timed out"
    cleanup
}

# Verify stack resources
info "Verifying stack resources..."
aws cloudformation list-stack-resources \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'StackResourceSummaries[*].[LogicalResourceId,ResourceStatus]' \
    --output table

# Check for any resources in CREATE_FAILED state
FAILED_RESOURCES=$(aws cloudformation list-stack-resources \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'StackResourceSummaries[?ResourceStatus==`CREATE_FAILED`].LogicalResourceId' \
    --output text)

if [ ! -z "$FAILED_RESOURCES" ]; then
    error "The following resources failed to create: $FAILED_RESOURCES"
    cleanup
fi

success "All resources created successfully!"

# Test stack outputs
info "Verifying stack outputs..."
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table

# Clean up test stack
cleanup

success "Stack testing completed successfully!"