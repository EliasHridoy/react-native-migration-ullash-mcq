import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../api/question.api';

export function useQuestionSearch() {
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const setQuery = (q: string) => {
    setRawQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(q.trim());
    }, 500);
  };

  const clearSearch = () => {
    setRawQuery('');
    setDebouncedQuery('');
  };

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['question-search', debouncedQuery],
    queryFn: ({ signal }) => questionApi.searchQuestions(debouncedQuery, signal),
    enabled: debouncedQuery.length >= 2,
  });

  return {
    rawQuery,
    setQuery,
    clearSearch,
    results: results ?? [],
    isLoading: isLoading && debouncedQuery.length >= 2,
    isError,
  };
}
