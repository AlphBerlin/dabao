"use client";

import { Button } from "@workspace/ui/components/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
}

export function Pagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  siblingsCount = 1,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  if (totalPages <= 1) return null;
  
  const generatePagination = () => {
    // Always show first page, last page, and currentPage
    // Show siblingsCount pages before and after currentPage
    // Use ellipsis (...) for breaks in sequence
    
    // Calculate range
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, i) => start + i);
    };
    
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);
    
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;
    
    if (!showLeftDots && showRightDots) {
      // Show pages 1 to 5, then dots, then last page
      const leftItemCount = 3 + 2 * siblingsCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }
    
    if (showLeftDots && !showRightDots) {
      // Show first page, then dots, then last 5 pages
      const rightItemCount = 3 + 2 * siblingsCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, "...", ...rightRange];
    }
    
    if (showLeftDots && showRightDots) {
      // Show first page, dots, siblings, dots, last page
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "...", ...middleRange, "...", totalPages];
    }
    
    // Show all pages
    return range(1, totalPages);
  };
  
  const pages = generatePagination();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
      >
        <span className="sr-only">Go to first page</span>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <span className="sr-only">Go to previous page</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pages.map((page, i) => {
        if (page === "...") {
          return (
            <div key={`ellipsis-${i}`} className="px-2 py-0.5 text-sm text-muted-foreground">
              ...
            </div>
          );
        }
        
        return (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={cn("h-8 w-8 p-0")}
            onClick={() => onPageChange(page as number)}
          >
            <span>{page}</span>
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span className="sr-only">Go to next page</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        <span className="sr-only">Go to last page</span>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}