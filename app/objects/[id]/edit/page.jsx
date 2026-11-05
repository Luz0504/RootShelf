'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRootShelf } from '../../../../src/context/RootShelfContext';
import { ObjectForm } from '../../../../src/components/ObjectForm';

export default function ObjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const objId = params?.id;

  const { objects, isAuthenticated, isMounted, setShowAuthPrompt } = useRootShelf();
  const obj = objects.find((o) => o.id === objId);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;
  if (!obj) return null;

  return <ObjectForm initialObject={obj} />;
}
