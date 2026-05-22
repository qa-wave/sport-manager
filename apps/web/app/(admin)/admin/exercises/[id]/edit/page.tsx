'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, type ExerciseDto } from '@/lib/api';
import { ExerciseEditor } from '@/components/admin/exercise-editor';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => apiFetch<ExerciseDto>(`/exercises/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Cvik nenalezen.</p>;
  }

  return <ExerciseEditor mode="edit" type={data.type} initial={data} />;
}
