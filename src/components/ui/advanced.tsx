import React from 'react';
import { cn } from '@/lib/utils';

// Data Table Component
export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white shadow overflow-hidden sm:rounded-md', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';

// Data Table Row Component
export interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTableRow = React.forwardRef<HTMLDivElement, DataTableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-4 sm:px-6 border-b border-gray-200 last:border-b-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DataTableRow.displayName = 'DataTableRow';

// Empty State Component
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-center py-12', className)}
        {...props}
      >
        {icon && (
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            {icon}
          </div>
        )}
        <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {action && (
          <div className="mt-6">{action}</div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Stats Card Component
export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, icon, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white overflow-hidden shadow rounded-lg', className)}
        {...props}
      >
        <div className="p-5">
          <div className="flex items-center">
            {icon && (
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <div className="h-6 w-6 text-white">
                    {icon}
                  </div>
                </div>
              </div>
            )}
            <div className={cn('w-0 flex-1', icon && 'ml-5')}>
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {value}
                </dd>
                {trend && (
                  <dd className={cn(
                    'text-sm',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.value}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// Page Header Component
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('sm:flex sm:items-center sm:justify-between', className)}
        {...props}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action && (
          <div className="mt-4 sm:mt-0">{action}</div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

// Form Group Component
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

// Form Row Component (for side-by-side form fields)
export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormRow.displayName = 'FormRow';

// Search Input Component
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={ref}
          className={cn(
            'block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
            className
          )}
          {...props}
        />
        {onClear && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
              onClick={onClear}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Tabs Component
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, activeTab, onTabChange, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-4">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

// Breadcrumb Component
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn('flex', className)} {...props}>
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg className="h-5 w-5 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {item.href ? (
                <a href={item.href} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  {item.label}
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

// Export all advanced components
export {
  DataTable,
  DataTableRow,
  EmptyState,
  StatsCard,
  PageHeader,
  FormGroup,
  FormRow,
  SearchInput,
  Tabs,
  Breadcrumb,
};
