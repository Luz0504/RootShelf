import React from 'react';

export function BurgerMenuIcon({ className = "w-6 h-6" }) {
  return (
    <img
      src="/assets/Burger-menu.svg"
      alt="Menú"
      className={`object-contain select-none ${className}`}
    />
  );
}

export function SearchIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" strokeLinecap="square" strokeWidth="2.5" />
    </svg>
  );
}

export function FavoritesIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="miter"
      className={className}
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function NotificationBellIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
      className={className}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function UserIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function ArrowBackIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      {...props}
    >
      <line x1="21" y1="12" x2="4" y2="12" />
      <polyline points="11 5 4 12 11 19" />
    </svg>
  );
}

export function VectorPlusIcon({ className = "w-8 h-8", ...props }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
      {...props}
    >
      <circle cx="24" cy="24" r="21" />
      <line x1="24" y1="14" x2="24" y2="34" strokeLinecap="square" />
      <line x1="14" y1="24" x2="34" y2="24" strokeLinecap="square" />
    </svg>
  );
}

export function RootShelfLogo({ className = "h-8 w-auto", ...props }) {
  return (
    <img
      src="/assets/Logo.svg"
      alt="RootShelf"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
}
