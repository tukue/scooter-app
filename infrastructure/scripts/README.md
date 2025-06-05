# Infrastructure Deployment Scripts

This directory contains scripts for validating, testing, and deploying the CloudFormation infrastructure.

## Available Scripts

### validate-templates.sh
Validates all CloudFormation templates in the project for syntax errors and best practices.
```bash
./validate-templates.sh
```

### test-stack.sh
Creates a test stack to verify the creation of all resources, then cleans up automatically.
```bash
./test-stack.sh
```

### deploy.sh
Deploys or updates the production stack.
```bash
./deploy.sh
```

## Prerequisites

1. AWS CLI installed and configured
2. Appropriate AWS credentials with permissions to create/update/delete CloudFormation stacks
3. Optional: cfn-lint installed for additional template validation (`pip install cfn-lint`)

## Usage Order

1. First, validate templates:
   ```bash
   ./validate-templates.sh
   ```

2. Then, test the stack creation:
   ```bash
   ./test-stack.sh
   ```

3. Finally, deploy to production:
   ```bash
   ./deploy.sh
   ```

## Error Handling

- All scripts will exit immediately if any command fails
- The test stack is automatically cleaned up, even if tests fail
- Detailed error messages are provided for troubleshooting

## Stack Outputs

Both the test and deployment scripts will display the stack outputs upon successful completion.