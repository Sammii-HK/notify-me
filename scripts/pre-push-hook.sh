#!/bin/sh

# Pre-push hook: Run linting, type checking, and build before allowing push
# This prevents broken code from being deployed

echo "🔍 Running pre-push checks..."

# Run linting with auto-fix
echo "📝 Running ESLint with auto-fix..."
pnpm run lint:fix || {
  echo "❌ ESLint failed. Please fix the errors above."
  exit 1
}

# Run TypeScript type checking
echo "🔎 Running TypeScript type check..."
pnpm run type-check || {
  echo "❌ TypeScript type check failed. Please fix the errors above."
  exit 1
}

# Run build to ensure everything compiles
echo "🏗️  Running build check..."
pnpm run build || {
  echo "❌ Build failed. Please fix the errors above."
  exit 1
}

echo "✅ All pre-push checks passed!"
exit 0

