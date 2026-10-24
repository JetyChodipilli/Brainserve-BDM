// src/app/api/auth/mfa-enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/security/rbac';
import { query } from '@/server/db/pool';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { recordAuditLog } from '@/server/services/auditService';

/**
 * POST /api/auth/mfa-enroll
 * Enrolls the authenticated user in MFA by generating a secret,
 * saving it to users.mfa_secret, and returning the QR code data URL.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { user } = auth;
    const secret = speakeasy.generateSecret({
      name: `Brainserve BDM (${user.email})`,
      issuer: 'Brainserve',
      length: 20,
    });

    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store in database
    await query(`UPDATE users SET mfa_secret = $1, updated_at = NOW() WHERE id = $2`, [
      secret.base32,
      user.id,
    ]);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'MFA_ENROLLED',
      entityName: 'users',
      entityId: user.id,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (err: any) {
    console.error('MFA enroll error:', err);
    return NextResponse.json({ error: 'Internal server error during MFA enrollment.' }, { status: 500 });
  }
}
