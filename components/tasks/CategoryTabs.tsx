import React from 'react';
import { TaskCategory } from '../../types';
import { CATEGORY_TABS } from '../../constants';

interface CategoryTabsProps {
  selectedCategory: TaskCategory;
  onSelectCategory: (category: TaskCategory) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="mb-8 flex flex-wrap justify-center sm:justify-start -m-1">
      {CATEGORY_TABS.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-4 py-2 m-1 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
            ${selectedCategory === category 
              ? 'bg-primary text-white shadow-lg scale-105' 
              : 'bg-surface text-textSecondary hover:bg-surface-lighter hover:text-textPrimary shadow-sm hover:shadow-md'
            }`}
          aria-pressed={selectedCategory === category}
        >
          {category}
        </button>
      ))}
    </div>
  );
};