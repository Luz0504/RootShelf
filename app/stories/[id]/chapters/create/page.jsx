'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ChapterEditor } from '../../../../../src/components/ChapterEditor';

export default function CreateChapterPage() {
  const params = useParams();
  const storyId = params?.id;

  return <ChapterEditor storyId={storyId} mode="create" />;
}
