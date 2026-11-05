'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { CharacterForm } from '../../../src/components/CharacterForm';

export default function CharacterCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;

  return <CharacterForm initialCharacter={null} />;
}
