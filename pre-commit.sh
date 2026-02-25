#!/bin/bash

# BrainBuddy Pre-Commit Validation Script
# This script runs all validation checks before committing code

set -e  # Exit on first error

echo "🔍 Running Pre-Commit Validation..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
HAS_ERRORS=0

# 1. TypeScript Type Checking
echo -e "\n${YELLOW}1️⃣  Checking TypeScript types...${NC}"
if npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt; then
    echo -e "${GREEN}✓ TypeScript type checking passed${NC}"
else
    echo -e "${RED}✗ TypeScript type checking failed${NC}"
    HAS_ERRORS=1
fi

# 2. ESLint
echo -e "\n${YELLOW}2️⃣  Running ESLint...${NC}"
if npm run lint 2>&1 | tee /tmp/eslint-output.txt; then
    echo -e "${GREEN}✓ ESLint passed${NC}"
else
    echo -e "${RED}✗ ESLint found issues${NC}"
    HAS_ERRORS=1
fi

# 3. Build Check
echo -e "\n${YELLOW}3️⃣  Checking build...${NC}"
if npm run build 2>&1 | tee /tmp/build-output.txt; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    HAS_ERRORS=1
fi

# Summary
echo -e "\n=================================="
if [ $HAS_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix errors before committing.${NC}"
    exit 1
fi
