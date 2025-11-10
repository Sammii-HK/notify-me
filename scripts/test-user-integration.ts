/**
 * Quick test script to verify User-Account integration works
 * Run with: npx tsx scripts/test-user-integration.ts
 */

import { PrismaClient } from '@prisma/client';
import { 
  syncSucculentUser,
  linkAccountToSucculentUser,
  getAccountsForSucculentUser,
  getPrimaryAccountForSucculentUser
} from '../src/lib/user-accounts';

const db = new PrismaClient();

async function testIntegration() {
  console.log('🧪 Testing User-Account Integration...\n');

  try {
    // Step 1: Check if we have any existing accounts
    const existingAccounts = await db.account.findMany({ take: 1 });
    if (existingAccounts.length === 0) {
      console.log('⚠️  No accounts found. Please create an account first.');
      console.log('   You can use: npm run seed');
      return;
    }

    const testAccount = existingAccounts[0];
    console.log(`✅ Found test account: ${testAccount.label} (${testAccount.id})\n`);

    // Step 2: Sync a test user from Succulent
    const testSucculentUserId = `test_${Date.now()}`;
    console.log('1️⃣  Syncing user from Succulent...');
    const user = await syncSucculentUser(db, testSucculentUserId, {
      email: 'test@example.com',
      name: 'Test User',
      metadata: { test: true, createdAt: new Date().toISOString() }
    });
    console.log(`   ✅ User created: ${user.id} (Succulent ID: ${user.succulentUserId})\n`);

    // Step 3: Link account to user
    console.log('2️⃣  Linking account to user...');
    const link = await linkAccountToSucculentUser(db, testSucculentUserId, testAccount.id, {
      role: 'owner',
      isPrimary: true
    });
    console.log(`   ✅ Account linked: ${link.id} (Role: ${link.role}, Primary: ${link.isPrimary})\n`);

    // Step 4: Get user's accounts
    console.log('3️⃣  Getting user\'s accounts...');
    const accounts = await getAccountsForSucculentUser(db, testSucculentUserId);
    console.log(`   ✅ Found ${accounts.length} account(s):`);
    accounts.forEach((acc: { label: string; id: string; isPrimary: boolean }) => {
      console.log(`      - ${acc.label} (${acc.id}) - ${acc.isPrimary ? 'PRIMARY' : 'secondary'}`);
    });
    console.log();

    // Step 5: Get primary account
    console.log('4️⃣  Getting primary account...');
    const primaryAccount = await getPrimaryAccountForSucculentUser(db, testSucculentUserId);
    if (primaryAccount) {
      console.log(`   ✅ Primary account: ${primaryAccount.label} (${primaryAccount.id})\n`);
    } else {
      console.log('   ⚠️  No primary account found\n');
    }

    // Step 6: Test API-like query
    console.log('5️⃣  Testing direct database queries...');
    const userWithAccounts = await db.user.findUnique({
      where: { id: user.id },
      include: {
        accountLinks: {
          include: {
            account: true
          }
        }
      }
    });
    console.log(`   ✅ User has ${userWithAccounts?.accountLinks.length || 0} linked account(s)\n`);

    // Cleanup (optional - comment out to keep test data)
    console.log('🧹 Cleaning up test data...');
    await db.userAccount.deleteMany({
      where: { userId: user.id }
    });
    await db.user.delete({
      where: { id: user.id }
    });
    console.log('   ✅ Test data cleaned up\n');

    console.log('✅ All tests passed! Integration is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run tests
testIntegration()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

