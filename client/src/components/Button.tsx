import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, icon = false, className = '', ...props }) => {
  return (
    <div className={`relative group inline-block ${className}`}>
      <button
        {...props}
        className={`relative inline-block w-full p-px font-semibold leading-6 text-white bg-gray-800 shadow-xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100`}
      >
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-disabled:hidden"></span>

        <span className="relative z-10 block px-6 py-2.5 rounded-xl bg-gray-950 w-full h-full">
          <div className="relative z-10 flex items-center justify-center space-x-2 w-full">
            <span className={`transition-all duration-500 ${icon ? 'group-hover:-translate-x-1' : ''} group-disabled:translate-x-0`}>
              {children}
            </span>
            {icon && (
              <svg
                className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1 group-disabled:translate-x-0"
                data-slot="icon"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  fillRule="evenodd"
                ></path>
              </svg>
            )}
          </div>
        </span>
      </button>
    </div>
  );
};

export default Button;
