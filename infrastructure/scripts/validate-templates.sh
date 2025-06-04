#!/bin/bash

# Exit on error
set -e

TEMPLATE_DIR="../cloudformation"
TEMPLATES=("main.yaml" "api.yaml" "cache.yaml" "database.yaml" "lambda.yaml" "network.yaml")

echo "Starting CloudFormation template validation..."

# Function to validate a template
validate_template() {
    local template=$1
    echo "Validating $template..."
    
    # Validate template syntax
    aws cloudformation validate-template \
        --template-body file://${TEMPLATE_DIR}/${template} || {
        echo "❌ Validation failed for $template"
        exit 1
    }
    
    # Optional: Add cfn-lint validation if installed
    if command -v cfn-lint &> /dev/null; then
        cfn-lint ${TEMPLATE_DIR}/${template} || {
            echo "❌ cfn-lint check failed for $template"
            exit 1
        }
    else
        echo "⚠️ cfn-lint not found. Install it for additional validation: pip install cfn-lint"
    fi
    
    echo "✅ $template validation passed"
}

# Validate each template
for template in "${TEMPLATES[@]}"; do
    validate_template "$template"
done

echo "Running a CloudFormation change set dry-run..."

# Create a change set without executing it (dry-run)
aws cloudformation create-change-set \
    --stack-name scooter-app-stack \
    --template-body file://${TEMPLATE_DIR}/main.yaml \
    --change-set-name validation-test-$(date +%Y%m%d-%H%M%S) \
    --change-set-type CREATE || {
    echo "❌ Change set creation failed"
    exit 1
}

echo "✅ All validations passed successfully!"