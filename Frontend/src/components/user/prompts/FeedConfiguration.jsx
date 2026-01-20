import React from 'react';
import { InteractiveCard } from '../ui/InteractiveCard';
import { InputField } from '../ui/InputField';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { StatusButton } from '../ui/StatusButton';

export const FeedConfiguration = ({ 
  formData, 
  feedActive,
  onFeedActiveChange,
  onInputChange, 
  onSave,
  formStates,
  allowNoBudget,
  onAllowNoBudgetChange
}) => {
  return (
    <InteractiveCard className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1.5 rounded-lg font-medium shadow-lg">
            {formData.feedName}
          </span>
          <ToggleSwitch
            checked={feedActive}
            onChange={onFeedActiveChange}
            label="Active"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusButton
            isComplete={formStates.feedSaved}
            label={formStates.feedSaved ? "Saved" : "Save Changes"}
            onClick={onSave}
          />
          <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:scale-105">
            + Add Feed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div className="space-y-6">
          <h3 className="text-white text-xl font-semibold">Basic Information</h3>
          
          <InputField
            label="Feed name"
            value={formData.feedName}
            onChange={(value) => onInputChange('feedName', value)}
          />
          
          <InputField
            label="Keywords"
            value={formData.keywords}
            onChange={(value) => onInputChange('keywords', value)}
          />
          
          <InputField
            label="Speciality"
            value={formData.speciality}
            onChange={(value) => onInputChange('speciality', value)}
            placeholder="Enter your speciality"
          />
          
          <InputField
            label="Freelancer"
            value={formData.freelancer}
            onChange={(value) => onInputChange('freelancer', value)}
            placeholder="Enter freelancer information"
          />

          <InteractiveCard className="p-4" hover={false}>
            <h4 className="text-white font-semibold mb-4">Validation prompt</h4>
            <div className="space-y-3 text-gray-300 text-sm">
              <p>You are doing "{formData.keywords}" on Upwork.</p>
              <p>You are reviewing potential leads on job posting service Upwork and need to find only leads from your segment for your agency, which fits.</p>
              <p>First, you need to answer on the question: does it fit to your segment according to instruction below. You have 2 options: yes/no</p>
              <p><strong>Explanation:</strong> 1) Yes - job which are fit to the right segment by the instructions. 2) No - not fit to our segment by the requirements by the instructions</p>
              <p>Also add comments about your decision. Why do you think so.</p>
              <p><strong>Instruction for NO, Not right segment:</strong><br />tutoring, urgent tasks, quick tasks</p>
              <p><strong>Instruction for YES, Right segment:</strong><br />All other jobs are fit</p>
            </div>
          </InteractiveCard>
        </div>

        {/* Right Column - Rates & Locations */}
        <div className="space-y-6">
          <h3 className="text-white text-xl font-semibold">Rates & Locations</h3>
          
          <div>
            <h4 className="text-gray-300 mb-4 font-medium">Rates</h4>
            <div className="space-y-4">
              <InputField
                label="Minimum hourly rate"
                type="number"
                value={formData.minHourlyRate}
                onChange={(value) => onInputChange('minHourlyRate', value)}
              />
              
              <InputField
                label="Minimum fixed price rate"
                type="number"
                value={formData.minFixedRate}
                onChange={(value) => onInputChange('minFixedRate', value)}
              />
              
              <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border border-gray-600">
                <ToggleSwitch
                  checked={allowNoBudget}
                  onChange={onAllowNoBudgetChange}
                  label="Allow no budget jobs"
                  description="Enable this to include jobs without specified budgets"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-300 mb-4 font-medium">Client info</h4>
            <div className="space-y-4">
              <InputField
                label="Client minimum spend"
                type="number"
                value={formData.clientMinSpend}
                onChange={(value) => onInputChange('clientMinSpend', value)}
              />
              
              <InputField
                label="Client minimum rating"
                type="number"
                value={formData.clientMinRating}
                onChange={(value) => onInputChange('clientMinRating', value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Excluded countries</label>
              <select
                value={formData.excludedCountries}
                onChange={(e) => onInputChange('excludedCountries', e.target.value)}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200"
              >
                <option value="">Select countries to exclude...</option>
                <option value="country1">Country 1</option>
                <option value="country2">Country 2</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Included countries</label>
              <select
                value={formData.includedCountries}
                onChange={(e) => onInputChange('includedCountries', e.target.value)}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200"
              >
                <option value="">Select countries to include...</option>
                <option value="country1">Country 1</option>
                <option value="country2">Country 2</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
};
