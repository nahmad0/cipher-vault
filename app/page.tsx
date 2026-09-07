'use client';
import dynamic from 'next/dynamic';
const Game = dynamic(() => import('../components/game/Game'), { ssr: false, loading: () => <main className="boot">INITIALIZING CIPHER VAULT…</main> });
export default function Home() { return <Game />; }
