import { PrismaClient } from '@prisma/client';

/**
 * Get all accounts linked to a Succulent user
 */
export async function getAccountsForSucculentUser(
  db: PrismaClient,
  succulentUserId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (db as any).user.findUnique({
    where: { succulentUserId },
    include: {
      accountLinks: {
        where: {
          account: {
            active: true
          }
        },
        include: {
          account: true
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' }
        ]
      }
    }
  });

  if (!user) {
    return [];
  }

  return user.accountLinks.map(link => ({
    ...link.account,
    linkId: link.id,
    role: link.role,
    isPrimary: link.isPrimary
  }));
}

/**
 * Get primary account for a Succulent user
 */
export async function getPrimaryAccountForSucculentUser(
  db: PrismaClient,
  succulentUserId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (db as any).user.findUnique({
    where: { succulentUserId },
    include: {
      accountLinks: {
        where: {
          isPrimary: true,
          account: {
            active: true
          }
        },
        include: {
          account: true
        },
        take: 1
      }
    }
  });

  if (!user || user.accountLinks.length === 0) {
    return null;
  }

  const link = user.accountLinks[0];
  return {
    ...link.account,
    linkId: link.id,
    role: link.role,
    isPrimary: link.isPrimary
  };
}

/**
 * Create or update a user from Succulent profile data
 */
export async function syncSucculentUser(
  db: PrismaClient,
  succulentUserId: string,
  data: {
    email?: string;
    name?: string;
    metadata?: Record<string, unknown>;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (db as any).user.upsert({
    where: { succulentUserId },
    update: {
      succulentEmail: data.email,
      name: data.name,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      updatedAt: new Date()
    },
    create: {
      succulentUserId,
      succulentEmail: data.email,
      name: data.name,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
    }
  });
}

/**
 * Link an account to a Succulent user
 */
export async function linkAccountToSucculentUser(
  db: PrismaClient,
  succulentUserId: string,
  accountId: string,
  options?: {
    role?: string;
    isPrimary?: boolean;
  }
) {
  // Get or create user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (db as any).user.findUnique({
    where: { succulentUserId }
  });

  if (!user) {
    throw new Error(`User with succulentUserId ${succulentUserId} not found. Create user first.`);
  }

  // If setting as primary, unset other primary accounts
  if (options?.isPrimary) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).userAccount.updateMany({
      where: {
        userId: user.id,
        isPrimary: true
      },
      data: { isPrimary: false }
    });
  }

  // Create or update the link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (db as any).userAccount.upsert({
    where: {
      userId_accountId: {
        userId: user.id,
        accountId
      }
    },
    update: {
      role: options?.role,
      isPrimary: options?.isPrimary ?? false
    },
    create: {
      userId: user.id,
      accountId,
      role: options?.role || 'owner',
      isPrimary: options?.isPrimary ?? false
    },
    include: {
      account: true,
      user: true
    }
  });
}

