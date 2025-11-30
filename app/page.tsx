'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-white font-bold text-3xl">S</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">ShopAuto</h1>
        <p className="text-gray-400">Caricamento...</p>
      </div>
    </div>
  );
}
