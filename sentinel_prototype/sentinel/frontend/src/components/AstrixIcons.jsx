import React from 'react';

export function AstrixLogo({ className = "size-7", ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="var(--primary, #F06543)" />
      <path
        d="M16 6L24 10.5V21.5L16 26L8 21.5V10.5L16 6Z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.5" fill="#FFFFFF" />
      <path
        d="M16 6V12.5M24 21.5L18.5 18M8 21.5L13.5 18"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HomeIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.97667 2.24C9.26924 2.01241 9.62933 1.88884 10 1.88884C10.3707 1.88884 10.7308 2.01241 11.0233 2.24L18.01 7.67333C18.6375 8.1625 18.2908 9.16667 17.4975 9.16667H16.6667V15.8333C16.6667 16.2754 16.4911 16.6993 16.1785 17.0118C15.8659 17.3244 15.442 17.5 15 17.5H5C4.55797 17.5 4.13405 17.3244 3.82149 17.0118C3.50893 16.6993 3.33333 16.2754 3.33333 15.8333V9.16667H2.5025C1.70833 9.16667 1.36333 8.16167 1.99 7.67417L8.97667 2.24Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ClassificationIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.83333 10.8333C6.25381 10.8332 6.65881 10.992 6.96712 11.2779C7.27544 11.5638 7.4643 11.9557 7.49583 12.375L7.5 12.5V15C7.50013 15.4205 7.34133 15.8255 7.05542 16.1338C6.76951 16.4421 6.37763 16.631 5.95833 16.6625L5.83333 16.6667H3.33333C2.91285 16.6668 2.50786 16.508 2.19954 16.2221C1.89123 15.9362 1.70237 15.5443 1.67083 15.125L1.66667 15V12.5C1.66653 12.0795 1.82534 11.6745 2.11125 11.3662C2.39716 11.0579 2.78904 10.869 3.20833 10.8375L3.33333 10.8333H5.83333ZM13.3333 14.1667H10V15.8333H13.3333V14.1667ZM5.83333 12.5H3.33333V15H5.83333V12.5ZM16.6667 10.8333H10V12.5H16.6667V10.8333ZM5.83333 2.5H3.33333V8.33333H5.83333V2.5ZM13.3333 5.83333H10V7.5H13.3333V5.83333ZM5.83333 4.16667H3.33333V6.66667H5.83333V4.16667ZM16.6667 2.5H10V4.16667H16.6667V2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MapPinIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C6.68629 2 4 4.68629 4 8C4 12.5 10 18 10 18C10 18 16 12.5 16 8C16 4.68629 13.3137 2 10 2ZM10 10.5C8.61929 10.5 7.5 9.38071 7.5 8C7.5 6.61929 8.61929 5.5 10 5.5C11.3807 5.5 12.5 6.61929 12.5 8C12.5 9.38071 11.3807 10.5 10 10.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ComplianceIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.4417 1.78333L16.4183 4.01667C17.07 4.26 17.5 4.88 17.5 5.5775V10.0467C17.5 13.9 14.76 16.64 10.56 18.2042C10.2 18.32 9.8 18.32 9.44 18.2042C5.24 16.64 2.5 13.9 2.5 10.0467V5.5775C2.5 4.88 2.93 4.26 3.58 4.01667L9.56 1.78333C9.84 1.68 10.16 1.68 10.4417 1.78333ZM10 3.39L4.16667 5.5775V10.0467C4.16667 13.1 6.3 15.3 10 16.57C13.7 15.3 15.8333 13.1 15.8333 10.0467V5.5775L10 3.39ZM9.59 6.26L12.74 7.14C13.2 7.31 13.5 7.74 13.5 8.23V10.02C13.5 11.8 12.3 13.1 10.45 13.75C10.15 13.85 9.85 13.85 9.55 13.75C7.7 13.1 6.5 11.8 6.5 10.02V8.23C6.5 7.74 6.8 7.31 7.26 7.14L9.59 6.26ZM10 7.89L8.17 8.58V10.02C8.17 11.0 9.0 11.7 10 12.07C11.0 11.7 11.83 11.0 11.83 10.02V8.58L10 7.89Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ReportsIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M11.3217 1.66667C11.7637 1.66676 12.1875 1.84242 12.5 2.155L16.1783 5.83333C16.4909 6.14582 16.6666 6.56967 16.6667 7.01167V16.6667C16.6667 17.1087 16.4911 17.5326 16.1785 17.8452C15.8659 18.1577 15.442 18.3333 15 18.3333H5C4.55797 18.3333 4.13405 18.1577 3.82149 17.8452C3.50893 17.5326 3.33333 17.1087 3.33333 16.6667V3.33333C3.33333 2.89131 3.50893 2.46738 3.82149 2.15482C4.13405 1.84226 4.55797 1.66667 5 1.66667H11.3217ZM10 3.33333H5V16.6667H15V8.33333H11.25C10.9185 8.33333 10.6005 8.20164 10.3661 7.96722C10.1317 7.7328 10 7.41485 10 7.08333V3.33333Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SidebarToggleIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M17.3999 4.36406C19.0567 4.36406 20.3999 5.70721 20.3999 7.36406V16.6365C20.3999 18.2934 19.0567 19.6365 17.3999 19.6365H6.60005C4.94319 19.6365 3.60005 18.2934 3.60005 16.6365V7.36406C3.60005 5.70721 4.94319 4.36406 6.60005 4.36406H17.3999ZM12.6254 5.89141C11.5211 5.89156 10.6255 6.78702 10.6254 7.89141V16.1102C10.6257 17.2144 11.5211 18.11 12.6254 18.1102H16.7202C17.8246 18.1102 18.72 17.2145 18.7202 16.1102V7.89141C18.7201 6.78693 17.8247 5.89141 16.7202 5.89141H12.6254Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon({ className = "size-4", ...props }) {
  return (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M10.5376 10.5376C11.0716 10.0036 11.4953 9.36959 11.7843 8.67184C12.0733 7.9741 12.222 7.22626 12.222 6.47102C12.222 5.71579 12.0733 4.96795 11.7843 4.2702C11.4953 3.57245 11.0716 2.93847 10.5376 2.40444C10.0036 1.8704 9.36959 1.44679 8.67184 1.15777C7.9741 0.868754 7.22626 0.72 6.47102 0.72C5.71579 0.72 4.96795 0.868754 4.2702 1.15777C3.57245 1.44679 2.93847 1.8704 2.40443 2.40444C1.32591 3.48296 0.72 4.94576 0.72 6.47102C0.72 7.99629 1.32591 9.45908 2.40443 10.5376C3.48296 11.6161 4.94576 12.222 6.47102 12.222C7.99629 12.222 9.45908 11.6161 10.5376 10.5376ZM10.5376 10.5376L14.1599 14.1599"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CmdIcon({ className = "size-3", ...props }) {
  return (
    <svg viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.27 0C1.02 0 0 1.02 0 2.27C0 3.52 1.02 4.54 2.27 4.54H3.18V5.91H2.27C1.02 5.91 0 6.93 0 8.18C0 9.43 1.02 10.45 2.27 10.45C3.52 10.45 4.54 9.43 4.54 8.18V7.27H5.91V8.18C5.91 9.43 6.93 10.45 8.18 10.45C9.43 10.45 10.45 9.43 10.45 8.18C10.45 6.93 9.43 5.91 8.18 5.91H7.27V4.54H8.18C9.43 4.54 10.45 3.52 10.45 2.27C10.45 1.02 9.43 0 8.18 0C6.93 0 5.91 1.02 5.91 2.27V3.18H4.54V2.27C4.54 1.02 3.52 0 2.27 0ZM4.54 4.54H5.91V5.91H4.54V4.54Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BellIcon({ className = "size-5", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M10 2C7.24 2 5 4.24 5 7V11.29L3.71 12.58C3.27 13.02 3.58 13.78 4.2 13.78H15.8C16.42 13.78 16.73 13.02 16.29 12.58L15 11.29V7C15 4.24 12.76 2 10 2ZM10 17.5C11.1 17.5 12 16.6 12 15.5H8C8 16.6 8.9 17.5 10 17.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MetricCubeIcon({ className = "size-4", ...props }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M10 2L17.5 6.33V13.67L10 18L2.5 13.67V6.33L10 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 2V18M17.5 6.33L10 10M2.5 6.33L10 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendingUpIcon({ className = "size-3", ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <path
        d="M14 4.5L8.5 10L5.5 7L1.5 11M14 4.5H9.5M14 4.5V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
