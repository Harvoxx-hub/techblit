'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Input, Button } from '@/components/ui';

interface SchedulingProps {
  scheduledAt?: Date | any; // Allow Firebase Timestamp
  onScheduleChange: (date: Date | null) => void;
}

export default function Scheduling({ scheduledAt, onScheduleChange }: SchedulingProps) {
  // Helper function to convert Firebase Timestamp to Date
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

  const scheduledDate = convertToDate(scheduledAt);
  
  const [isScheduled, setIsScheduled] = useState(!!scheduledDate);
  const [date, setDate] = useState(
    scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''
  );

  const handleToggleSchedule = () => {
    if (isScheduled) {
      setIsScheduled(false);
      onScheduleChange(null);
    } else {
      setIsScheduled(true);
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dateString = tomorrow.toISOString().slice(0, 16);
      setDate(dateString);
      onScheduleChange(tomorrow);
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    if (value) {
      onScheduleChange(new Date(value));
    }
  };

  const getQuickScheduleOptions = () => {
    const now = new Date();
    const options = [
      {
        label: 'Publish Now',
        value: null,
        description: 'Publish immediately'
      },
      {
        label: 'Tomorrow 9 AM',
        value: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
        description: 'Schedule for tomorrow morning'
      },
      {
        label: 'Next Monday 9 AM',
        value: (() => {
          const nextMonday = new Date(now);
          nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
          nextMonday.setHours(9, 0, 0, 0);
          return nextMonday;
        })(),
        description: 'Schedule for next Monday'
      },
      {
        label: 'Next Week',
        value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        description: 'Schedule for next week'
      }
    ];

    return options;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Publishing Schedule
        </h3>
        <Button
          variant={isScheduled ? "outline" : "primary"}
          size="sm"
          onClick={handleToggleSchedule}
          leftIcon={<ClockIcon />}
        >
          {isScheduled ? 'Cancel Schedule' : 'Schedule Post'}
        </Button>
      </div>

      {isScheduled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publish Date & Time
            </label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              leftIcon={<CalendarIcon />}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Options
            </label>
            <div className="grid grid-cols-1 gap-2">
              {getQuickScheduleOptions().map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (option.value) {
                      const dateString = option.value.toISOString().slice(0, 16);
                      setDate(dateString);
                      onScheduleChange(option.value);
                    } else {
                      setIsScheduled(false);
                      onScheduleChange(null);
                    }
                  }}
                  className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {scheduledDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Scheduled for {scheduledDate.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-blue-700">
                    {scheduledDate.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isScheduled && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Publish Immediately
              </div>
              <div className="text-sm text-gray-500">
                Post will be published as soon as you click "Publish"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
