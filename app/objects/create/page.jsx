'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { ObjectForm } from '../../../src/components/ObjectForm';

export default function ObjectCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;

  return <ObjectForm initialObject={null} />;
}
