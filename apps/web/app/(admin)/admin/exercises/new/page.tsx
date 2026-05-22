'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExerciseEditor } from '@/components/admin/exercise-editor';
import type { ExerciseType } from '@/lib/api';

function NewExerciseInner() {
  const params = useSearchParams();
  const rawType = params?.get('type');
  const type: ExerciseType = rawType === 'PHYSIO' ? 'PHYSIO' : 'TRAINING';
  return <ExerciseEditor mode="create" type={type} />;
}

export default function NewExercisePage() {
  return (
    <Suspense fallback={null}>
      <NewExerciseInner />
    </Suspense>
  );
}
