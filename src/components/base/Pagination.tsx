
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  startIndex,
  endIndex,
  totalItems,
}) => {
  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Nombre maximum de pages visibles

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages si le total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Afficher les pages autour de la page actuelle
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Toujours afficher la dernière page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4">
      {/* Informations sur les éléments affichés */}
      <div className="text-sm text-gray-600">
        Affichage de <span className="font-semibold text-gray-900">{startIndex + 1}</span> à{' '}
        <span className="font-semibold text-gray-900">{endIndex}</span> sur{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span> résultats
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">
        {/* Bouton Précédent */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
            flex items-center gap-2 transition-all duration-200
            ${
              canGoPrevious
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }
          `}
        >
          <i className="ri-arrow-left-s-line"></i>
          Précédent
        </button>

        {/* Numéros de page */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                  transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Affichage mobile de la page actuelle */}
        <div className="sm:hidden px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
          Page {currentPage} / {totalPages}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
            flex items-center gap-2 transition-all duration-200
            ${
              canGoNext
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }
          `}
        >
          Suivant
          <i className="ri-arrow-right-s-line"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
