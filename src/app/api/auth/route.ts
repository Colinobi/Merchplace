import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Message that user signs to authenticate
const AUTH_MESSAGE = 'Sign this message to authenticate with Merchplace';

export async function POST(request: NextRequest) {
    try {
        const { publicKey, signature, message } = await request.json();

        // Validate inputs
        if (!publicKey || !signature || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: publicKey, signature, message' },
                { status: 400 }
            );
        }

        // Verify the message matches our expected auth message
        if (message !== AUTH_MESSAGE) {
            return NextResponse.json(
                { error: 'Invalid authentication message' },
                { status: 400 }
            );
        }

        // Verify the signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(publicKey);

        const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Signature valid! Create Firebase custom token
        // Use wallet public key as the user ID
        const customToken = await adminAuth.createCustomToken(publicKey, {
            walletAddress: publicKey,
        });

        return NextResponse.json({
            success: true,
            token: customToken,
            uid: publicKey,
        });

    } catch (error: any) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}

// Export the auth message for client use
export async function GET() {
    return NextResponse.json({
        message: AUTH_MESSAGE,
    });
}
