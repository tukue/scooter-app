#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="scooter-app-stack"
TEMPLATE_DIR="../cloudformation"
REGION=${AWS_REGION:-"eu-north-1"}

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

# Validate templates first
info "Running template validation..."
./validate-templates.sh || error "Template validation failed"
success "Template validation completed"

# Deploy the stack
info "Starting stack deployment..."

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION 2>&1 | grep -q 'Stack with id'; then
    # Update existing stack
    info "Updating existing stack: $STACK_NAME"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://${TEMPLATE_DIR}/main.yaml \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region $REGION || {
        if [[ $? -eq 255 && $? =~ "No updates are to be performed" ]]; then
            success "No updates needed for stack $STACK_NAME"
            exit 0
        else
            error "Stack update failed"
        fi
    }
else
    # Create new stack
    info "Creating new stack: $STACK_NAME"
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://${TEMPLATE_DIR}/main.yaml \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region $REGION || error "Stack creation failed"
fi

# Wait for stack operation to complete
info "Waiting for stack operation to complete..."
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION || \
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION || \
error "Stack operation failed or timed out"

success "Stack deployment completed successfully!"

# Display stack outputs
info "Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table