/**
 * Pagination Component
 *
 * Composant réutilisable de pagination aligné sur le design du dashboard
 */

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Pagination.css";

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
}) {
  // Calculer le range des items affichés
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Générer les numéros de pages à afficher avec ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7; // Nombre max de boutons de page à afficher

    if (totalPages <= maxPagesToShow) {
      // Si peu de pages, tout afficher
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique avec ellipsis
      if (currentPage <= 3) {
        // Début : 1 2 3 4 5 ... 45
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fin : 1 ... 41 42 43 44 45
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Milieu : 1 ... 5 6 [7] 8 9 ... 45
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (page) => {
    if (page !== "..." && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1 && !loading) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages && !loading) {
      onPageChange(totalPages);
    }
  };

  // Si pas d'items, ne pas afficher la pagination
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="pagination-container">
      {/* Info Section */}
      <div className="pagination-info">
        <span className="items-range">
          Showing {startItem}-{endItem} of {totalItems.toLocaleString()}{" "}
          {totalItems === 1 ? "communication" : "communications"}
        </span>

        {/* Items per page selector */}
        <div className="items-per-page">
          <label htmlFor="itemsPerPage">Show:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) =>
              !loading && onItemsPerPageChange(parseInt(e.target.value))
            }
            disabled={loading}
            className="items-select"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="pagination-controls">
        {/* First Page Button */}
        <button
          className="pagination-btn pagination-btn-edge"
          onClick={handleFirst}
          disabled={currentPage === 1 || loading}
          title="First page"
        >
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>

        {/* Previous Button */}
        <button
          className="pagination-btn pagination-btn-nav"
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          title="Previous page"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          <span className="btn-text">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="page-numbers">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              className={`pagination-btn page-number ${
                page === currentPage ? "active" : ""
              } ${page === "..." ? "ellipsis" : ""}`}
              onClick={() => handlePageClick(page)}
              disabled={page === "..." || loading}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          className="pagination-btn pagination-btn-nav"
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          title="Next page"
        >
          <span className="btn-text">Next</span>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>

        {/* Last Page Button */}
        <button
          className="pagination-btn pagination-btn-edge"
          onClick={handleLast}
          disabled={currentPage === totalPages || loading}
          title="Last page"
        >
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="pagination-loading">
          <div className="pagination-spinner"></div>
          <span>Loading page {currentPage}...</span>
        </div>
      )}
    </div>
  );
}

export default Pagination;
