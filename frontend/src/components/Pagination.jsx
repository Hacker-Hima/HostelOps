import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers array with ellipses if needed
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
        Showing <strong style={{ color: '#0f172a' }}>{startItem}</strong> to{' '}
        <strong style={{ color: '#0f172a' }}>{endItem}</strong> of{' '}
        <strong style={{ color: '#0f172a' }}>{totalItems}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="form-control"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.8rem',
                height: 'auto',
                width: 'auto',
                borderRadius: '6px',
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          id="btn-pagination-prev"
        >
          <ChevronLeft size={15} />
          <span>Previous</span>
        </button>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.825rem',
                    color: '#94a3b8',
                  }}
                >
                  ...
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: '6px',
                  border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: isActive ? '#2563eb' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          id="btn-pagination-next"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
