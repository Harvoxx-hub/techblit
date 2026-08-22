'use client';

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Input, Button } from '@/components/ui';

interface BackdateProps {
  publishedAt?: Date | any; // Allow Firebase Timestamp
  onChange: (date: Date | null) => void;
}

export default function Backdate({ publishedAt, onChange }: BackdateProps) {
  const convertToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return null;
  };

  const initialDate = convertToDate(publishedAt);

  const [isBackdated, setIsBackdated] = useState(!!initialDate);
  const [date, setDate] = useState(
    initialDate ? initialDate.toISOString().slice(0, 16) : ''
  );

  const nowLocal = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleToggle = () => {
    if (isBackdated) {
      setIsBackdated(false);
      onChange(null);
    } else {
      setIsBackdated(true);
      setDate('');
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    if (value) {
      onChange(new Date(value));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Backdate
        </h3>
        <Button
          variant={isBackdated ? 'outline' : 'primary'}
          size="sm"
          onClick={handleToggle}
          leftIcon={<ClockIcon />}
        >
          {isBackdated ? 'Cancel Backdate' : 'Backdate Post'}
        </Button>
      </div>

      {isBackdated && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Published Date & Time
          </label>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            leftIcon={<ClockIcon />}
            max={nowLocal()}
          />
          <p className="text-sm text-gray-500">
            The post will show this date instead of the real publish time — affects sitemap, sorting, and author stats.
          </p>
        </div>
      )}
    </div>
  );
}
