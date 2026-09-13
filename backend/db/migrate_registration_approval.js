// db/migrate_registration_approval.js — Adds registration approval and email verification fields to users table
import pool from '../config/db.js';

async function runMigration() {
  console.log('🔄  Applying Registration Approval & Email Verification Migration…');
  try {
    const client = await pool.connect();

    // 1. Add new columns to users table safely
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64),
        ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
    console.log('✅  Added account_status, email_verified, and verification columns to users table.');

    // 2. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
      CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users(email_verification_token_hash);
    `);
    console.log('✅  Created indexes on account_status and verification token hash.');

    // 3. Backfill all existing users to ACTIVE & verified so existing governance remains intact
    const updateResult = await client.query(`
      UPDATE users
      SET account_status = 'ACTIVE',
          email_verified = TRUE,
          email_verified_at = COALESCE(email_verified_at, created_at, NOW())
      WHERE account_status = 'PENDING_EMAIL_VERIFICATION' OR email_verified = FALSE;
    `);
    console.log(`✅  Backfilled ${updateResult.rowCount} existing institutional users to ACTIVE & email_verified = TRUE.`);

    // 4. Verify existing users
    const check = await client.query(`
      SELECT id, email, role, account_status, email_verified, is_active FROM users ORDER BY id
    `);
    console.log('');
    console.log('📋  Current Users in Database:');
    check.rows.forEach(u => {
      console.log(`    [ID ${u.id}] ${u.email} (${u.role}) → status: ${u.account_status}, verified: ${u.email_verified}`);
    });

    client.release();
    console.log('');
    console.log('🎉  Registration Approval Migration Completed Successfully!');
  } catch (err) {
    console.error('❌  Migration Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
