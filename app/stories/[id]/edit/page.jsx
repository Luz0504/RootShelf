'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRootShelf } from '../../../../src/context/RootShelfContext';
import { StoryForm } from '../../../../src/components/StoryForm';

export default function StoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params?.id;

  const {
    stories,
    isAuthenticated,
    isMounted,
    isStoryOwner,
    setShowAuthPrompt,
  } = useRootShelf();

  const story = stories.find((s) => s.id === storyId);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        setShowAuthPrompt(true);
        router.push('/');
        return;
      }
      if (story && !isStoryOwner(story)) {
        // Protected from non-owners
        router.push(`/reader/${story.id}`);
      }
    }
  }, [isMounted, isAuthenticated, story, router, setShowAuthPrompt, isStoryOwner]);

  if (!isMounted || !isAuthenticated) return null;
  if (!story || !isStoryOwner(story)) return null;

  return <StoryForm initialStory={story} />;
}
