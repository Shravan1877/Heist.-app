import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ 
  children, 
  className,
  itemClassName 
}) => {
  return (
    <div className={cn("animated-list-container space-y-12", className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        return (
          <div className={cn("animated-list-item", itemClassName)}>
            {child}
          </div>
        );
      })}
    </div>
  );
};

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ 
  children, 
  className,
  selected
}) => {
  return (
    <div className={cn(
      "matte-charcoal-card border border-taupe p-8 flex flex-col items-center hover:border-neon/30 transition-all duration-700 shadow-[0_0_10px_rgba(211,211,211,0.1)] rounded-none gpu-accelerated",
      selected && "zinc-border-selected",
      className
    )}>
      {children}
    </div>
  );
};