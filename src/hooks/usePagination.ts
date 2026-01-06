import { useState, useMemo, useCallback } from 'react';

interface PaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

/**
 * Hook personnalisé pour la pagination
 * @param data - Tableau de données à paginer
 * @param options - Options de pagination
 * @returns Objet contenant les données paginées et les fonctions de navigation
 */
export function usePagination<T>(
  data: T[],
  options: PaginationOptions = {}
): PaginationResult<T> {
  const { initialPage = 1, itemsPerPage = 50 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  // Calculer les index de début et de fin
  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, data.length);
  }, [startIndex, itemsPerPage, data.length]);

  // Extraire les données de la page actuelle
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Vérifier si on peut aller à la page suivante/précédente
  const canGoNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const canGoPrevious = useMemo(() => currentPage > 1, [currentPage]);

  // Fonctions de navigation
  const goToPage = useCallback((page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (canGoNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [canGoNext]);

  const previousPage = useCallback(() => {
    if (canGoPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  }, [canGoPrevious]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems: data.length,
  };
}
