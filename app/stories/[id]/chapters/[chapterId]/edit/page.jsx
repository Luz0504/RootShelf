'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ChapterEditor } from '../../../../../../src/components/ChapterEditor';

export default function EditChapterPage() {
  const params = useParams();
  const storyId = params?.id;
  const chapterId = params?.chapterId;

  return <ChapterEditor storyId={storyId} chapterId={chapterId} mode="edit" />;
}
