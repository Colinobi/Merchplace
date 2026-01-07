import { NextResponse } from "next/server";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

// Fake USDC on Devnet (You can replace this with mainnet USDC later)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export async function POST(req: Request) {
    try {
        const { buyer, seller, amount } = await req.json();

        if (!buyer || !seller || !amount) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const buyerKey = new PublicKey(buyer);
        const sellerKey = new PublicKey(seller);
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");

        // Get Associated Token Accounts (ATA)
        const buyerATA = await getAssociatedTokenAddress(USDC_MINT, buyerKey);
        const sellerATA = await getAssociatedTokenAddress(USDC_MINT, sellerKey);

        const transaction = new Transaction();

        // Check if seller has an ATA, if not, create one (buyer pays for rent)
        const sellerAccountInfo = await connection.getAccountInfo(sellerATA);
        if (!sellerAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    buyerKey, // Payer
                    sellerATA,
                    sellerKey, // Owner
                    USDC_MINT
                )
            );
        }

        // Add Transfer Instruction (Amount * 10^6 for USDC decimals)
        transaction.add(
            createTransferInstruction(
                buyerATA,
                sellerATA,
                buyerKey,
                Math.floor(amount * 1_000_000)
            )
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = buyerKey;

        // Serialize and encode
        const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        const base64 = serializedTransaction.toString("base64");

        return NextResponse.json({ transaction: base64 });

    } catch (error) {
        console.error("Tx Error:", error);
        return NextResponse.json({ error: "Failed to build transaction" }, { status: 500 });
    }
}
