#!/bin/bash

# Counter for updated files
updated_files=0

# Find all YAML and JS files in the repository, excluding node_modules and .git directories
find . -type d \( -name node_modules -o -name .git \) -prune -o \( -name "*.yaml" -o -name "*.yml" -o -name "*.js" \) -print0 | while IFS= read -r -d '' file; do
    # Check if the file contains nodejs14.x and update to nodejs20.x
    if grep -q "nodejs14.x" "$file"; then
        echo "Updating $file"
        sed -i 's/nodejs14\.x/nodejs20.x/g' "$file"
        ((updated_files++))
    fi
    
    # For JS files, also update any Node.js version specifications
    if [[ "$file" == *.js ]]; then
        # Update Node.js version in engines field of package.json
        if sed -i 's/"node": "14\.x"/"node": "20.x"/g' "$file"; then
            echo "Updated Node.js version in $file"
            ((updated_files++))
        fi
        # Update any hardcoded version checks
        if sed -i 's/process\.version\.startsWith("v14")/process.version.startsWith("v20")/g' "$file"; then
            echo "Updated version check in $file"
            ((updated_files++))
        fi
    fi
done

echo "Update complete. $updated_files files were modified."
echo "Please review the changes and test your application."
