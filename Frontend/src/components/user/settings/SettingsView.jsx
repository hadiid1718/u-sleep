import React from 'react';
import { User, Building, Clock } from 'lucide-react';

import {StatusButton} from '../ui/StatusButton';
import {InputField} from '../ui/InputField';
import {InteractiveCard} from '../ui/InteractiveCard';

const SettingsView = ({
  formData,
  handleInputChange,
  formStates,
  handleSave,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>

      {/* Profile */}
      <InteractiveCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-lime-500" />
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">Profile Information</h3>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6">
          <div className="flex-1 space-y-4">
            <InputField label="Email" value={formData.email} readOnly />
            <InputField
              label="Full Name"
              value={formData.fullName}
              onChange={(v) => handleInputChange('fullName', v)}
            />
          </div>

          <StatusButton
            isComplete={formStates.profileSaved}
            label={formStates.profileSaved ? 'Saved' : 'Save Changes'}
            onClick={() => handleSave('profileSaved')}
          />
        </div>
      </InteractiveCard>

      {/* Company */}
      <InteractiveCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="w-6 h-6 text-lime-500" />
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">Company</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <InputField
            label="Company Name"
            value={formData.companyName}
            onChange={(v) => handleInputChange('companyName', v)}
          />

          <StatusButton
            isComplete={formStates.companySaved}
            label={formStates.companySaved ? 'Saved' : 'Save'}
            onClick={() => handleSave('companySaved')}
          />
        </div>
      </InteractiveCard>

      {/* Timezone */}
      <InteractiveCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-lime-500" />
          <h3 className="text-gray-900 dark:text-white text-xl font-semibold">Timezone</h3>
        </div>

        <div className="space-y-4">
          <select
            value={formData.timezone || 'UTC'}
            onChange={event => handleInputChange('timezone', event.target.value)}
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-lime-500 focus:ring-2 focus:ring-lime-400/20"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Karachi">Asia/Karachi</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
          </select>

          <div className="flex justify-end">
            <StatusButton
              isComplete={formStates.companySaved}
              label={formStates.companySaved ? 'Saved' : 'Save'}
              onClick={() => handleSave('companySaved')}
            />
          </div>
        </div>
      </InteractiveCard>
    </div>
  );
};

export default SettingsView;
