import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', innerClassName = '' }) => {
  return (
    <div className={`w-full bg-gradient-to-br from-[#00ff75] to-[#3700ff] rounded-[20px] transition-all duration-300 hover:shadow-[0px_0px_30px_1px_rgba(0,255,117,0.30)] group ${className}`}>
      <div className={`bg-[#0a0a0a] rounded-[20px] transition-all duration-200 group-hover:scale-[0.98] w-full h-full flex flex-col ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
