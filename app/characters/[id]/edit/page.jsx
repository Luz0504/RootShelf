'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRootShelf } from '../../../../src/context/RootShelfContext';
import { CharacterForm } from '../../../../src/components/CharacterForm';

export default function CharacterEditPage() {
  const params = useParams();
  const router = useRouter();
  const charId = params?.id;

  const { characters, isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();
  const character = characters.find((c) => c.id === charId);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;
  if (!character) return null;

  return <CharacterForm initialCharacter={character} />;
}
