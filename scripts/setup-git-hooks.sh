#!/bin/bash

# Setup script to install git hooks
# Run this after cloning the repo: bash scripts/setup-git-hooks.sh

echo "🔧 Setting up git hooks..."

# Copy pre-push hook
cp scripts/pre-push-hook.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed!"
echo ""
echo "The pre-push hook will now:"
echo "  - Run ESLint with auto-fix"
echo "  - Run TypeScript type checking"
echo "  - Run build to ensure everything compiles"
echo ""
echo "This prevents broken code from being pushed to the repository."

