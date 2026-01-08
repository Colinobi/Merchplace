"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import styles from './AuthModal.module.css';

type AuthMode = 'login' | 'signup' | 'reset';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const {
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithWallet,
        resetPassword,
        loading,
        error,
        clearError,
    } = useAuth();

    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetSent, setResetSent] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        if (mode === 'reset') {
            try {
                await resetPassword(email);
                setResetSent(true);
            } catch {
                // Error handled in context
            }
            return;
        }

        if (mode === 'login') {
            await signInWithEmail(email, password);
        } else {
            await signUpWithEmail(email, password);
        }
    };

    const handleGoogleSignIn = async () => {
        clearError();
        await signInWithGoogle();
    };

    const handleWalletConnect = async () => {
        clearError();
        if (!connected) {
            // Open wallet selection modal
            setVisible(true);
        } else {
            // Wallet already connected, sign in
            await signInWithWallet();
        }
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        clearError();
        setResetSent(false);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {mode === 'login' && 'Welcome Back'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'reset' && 'Reset Password'}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {resetSent && (
                    <div className={styles.success}>
                        Password reset email sent! Check your inbox.
                    </div>
                )}

                {mode !== 'reset' && (
                    <>
                        {/* Social/Wallet Auth Buttons */}
                        <div className={styles.socialButtons}>
                            <button
                                className={`${styles.socialButton} ${styles.googleButton}`}
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <svg className={styles.socialIcon} viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <button
                                className={`${styles.socialButton} ${styles.walletButton}`}
                                onClick={handleWalletConnect}
                                disabled={loading}
                            >
                                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                </svg>
                                {connected ? 'Sign in with Wallet' : 'Connect Solana Wallet'}
                            </button>
                        </div>

                        <div className={styles.divider}>or</div>
                    </>
                )}

                {/* Email Form */}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {mode !== 'reset' && (
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Password</label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading && <span className={styles.loading} />}
                        {mode === 'login' && 'Sign In'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'reset' && 'Send Reset Link'}
                    </button>

                    {mode === 'login' && (
                        <div className={styles.links}>
                            <button
                                type="button"
                                className={styles.link}
                                onClick={() => switchMode('reset')}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}
                </form>

                {/* Mode Toggle */}
                <div className={styles.toggle}>
                    {mode === 'login' && (
                        <>
                            Don&apos;t have an account?
                            <button
                                className={styles.toggleButton}
                                onClick={() => switchMode('signup')}
                            >
                                Sign up
                            </button>
                        </>
                    )}
                    {mode === 'signup' && (
                        <>
                            Already have an account?
                            <button
                                className={styles.toggleButton}
                                onClick={() => switchMode('login')}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                    {mode === 'reset' && (
                        <>
                            Remember your password?
                            <button
                                className={styles.toggleButton}
                                onClick={() => switchMode('login')}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
