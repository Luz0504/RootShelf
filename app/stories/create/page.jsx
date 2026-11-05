'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { StoryForm } from '../../../src/components/StoryForm';

export default function StoryCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isAuthenticated && isMounted) {
    return null;
  }

  return <StoryForm initialStory={null} />;
}
