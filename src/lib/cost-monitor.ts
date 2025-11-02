import { PrismaClient } from '@prisma/client';
import { estimateTokens } from './generator';

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
  model: string;
}

export interface MonthlyUsage {
  accountId: string;
  accountLabel: string;
  generationsThisMonth: number;
  estimatedCostThisMonth: number;
  lastResetDate: Date;
}

// OpenAI pricing (as of 2024) - update as needed
const PRICING = {
  'gpt-4o': {
    input: 0.0025 / 1000,   // $2.50 per 1M input tokens
    output: 0.01 / 1000,    // $10.00 per 1M output tokens
  },
  'gpt-4o-mini': {
    input: 0.00015 / 1000,  // $0.15 per 1M input tokens
    output: 0.0006 / 1000,  // $0.60 per 1M output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005 / 1000,   // $0.50 per 1M input tokens
    output: 0.0015 / 1000,  // $1.50 per 1M output tokens
  }
};

/**
 * Estimate cost for a generation request
 */
export function estimateGenerationCost(
  prompt: string,
  expectedOutputLength: number = 2000,
  model: string = 'gpt-4o'
): CostEstimate {
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens('x'.repeat(expectedOutputLength)); // Rough estimate
  
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o'];
  
  const estimatedCostUSD = 
    (inputTokens * pricing.input) + 
    (outputTokens * pricing.output);

  return {
    inputTokens,
    outputTokens,
    estimatedCostUSD,
    model
  };
}

/**
 * Track generation usage for an account
 */
export async function trackGeneration(
  db: PrismaClient,
  accountId: string
) {
  const now = new Date();
  const account = await db.account.findUnique({
    where: { id: accountId }
  });

  if (!account) return;

  // Reset monthly counter if it's a new month (only if fields exist)
  const accountData = account as Record<string, unknown>;
  const lastResetDate = accountData.lastResetDate as Date | undefined;
  const monthlyGenCount = accountData.monthlyGenCount as number | undefined;
  
  if (lastResetDate && monthlyGenCount !== undefined) {
    const lastReset = new Date(lastResetDate);
    const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                       now.getFullYear() !== lastReset.getFullYear();

    // Use dynamic update to avoid schema issues
    const updateData: Record<string, unknown> = {};
    updateData.monthlyGenCount = shouldReset ? 1 : monthlyGenCount + 1;
    updateData.lastResetDate = shouldReset ? now : lastResetDate;

    await db.account.update({
      where: { id: accountId },
      data: updateData as never // Type assertion to bypass Prisma type checking
    });
  }
}

/**
 * Get monthly usage for all accounts
 */
export async function getMonthlyUsage(db: PrismaClient): Promise<MonthlyUsage[]> {
  const accounts = await db.account.findMany({
    select: {
      id: true,
      label: true,
      postsPerWeek: true
    }
  });

  return accounts.map(account => {
    const accountData = account as Record<string, unknown>;
    const monthlyGenCount = (accountData.monthlyGenCount as number) || 0;
    const lastResetDate = (accountData.lastResetDate as Date) || new Date();
    
    return {
      accountId: account.id,
      accountLabel: account.label,
      generationsThisMonth: monthlyGenCount,
      // Rough estimate: assume 4 weeks per month, average cost per generation
      estimatedCostThisMonth: monthlyGenCount * 0.50, // $0.50 per generation estimate
      lastResetDate: lastResetDate
    };
  });
}

/**
 * Check if account is approaching cost limits
 */
export async function checkCostLimits(
  db: PrismaClient,
  accountId: string,
  monthlyLimitUSD: number = 50
): Promise<{
  isApproachingLimit: boolean;
  currentUsage: number;
  percentageUsed: number;
  warning?: string;
}> {
  const usage = await getMonthlyUsage(db);
  const accountUsage = usage.find(u => u.accountId === accountId);
  
  if (!accountUsage) {
    return {
      isApproachingLimit: false,
      currentUsage: 0,
      percentageUsed: 0
    };
  }

  const percentageUsed = (accountUsage.estimatedCostThisMonth / monthlyLimitUSD) * 100;
  const isApproachingLimit = percentageUsed > 80;

  return {
    isApproachingLimit,
    currentUsage: accountUsage.estimatedCostThisMonth,
    percentageUsed,
    warning: isApproachingLimit 
      ? `Account ${accountUsage.accountLabel} has used ${percentageUsed.toFixed(1)}% of monthly budget`
      : undefined
  };
}

/**
 * Get cost optimization recommendations
 */
export function getCostOptimizationTips(): string[] {
  return [
    '💡 Use gpt-4o-mini for simpler content generation (90% cheaper than gpt-4o)',
    '💡 Reduce postsPerWeek for less active accounts',
    '💡 Optimize prompt templates to be more concise',
    '💡 Set contextTokenLimit lower (4000-6000) for basic accounts',
    '💡 Use batch generation during off-peak hours',
    '💡 Review and pause inactive accounts',
    '💡 Consider using gpt-3.5-turbo for draft generation, gpt-4o for final polish'
  ];
}


