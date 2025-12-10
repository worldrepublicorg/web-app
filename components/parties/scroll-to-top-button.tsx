"use client";

interface ScrollToTopButtonProps {
  show: boolean;
  onClick: () => void;
}

export function ScrollToTopButton({ show, onClick }: ScrollToTopButtonProps) {
  if (!show) return null;

  return (
    <div className="fixed right-4 z-50 h-12 w-12 scroll-to-top-bottom">
      <button
        onClick={onClick}
        onTouchStart={(e) => {
          // Prevent scroll interference and trigger action immediately
          e.preventDefault();
          onClick();
        }}
        className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 shadow-lg! touch-manipulation"
        aria-label="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500 pointer-events-none"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
