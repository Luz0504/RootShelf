'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { PlaceForm } from '../../../src/components/PlaceForm';

export default function PlaceCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;

  return <PlaceForm initialPlace={null} />;
}
