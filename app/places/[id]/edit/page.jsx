'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRootShelf } from '../../../../src/context/RootShelfContext';
import { PlaceForm } from '../../../../src/components/PlaceForm';

export default function PlaceEditPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.id;

  const { places, isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();
  const place = places.find((p) => p.id === placeId);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;
  if (!place) return null;

  return <PlaceForm initialPlace={place} />;
}
