import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Cipher Vault | Cybersecurity CTF', description: 'Explore a 3D security facility. Solve cybersecurity labs, capture flags, and unlock the vault.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
