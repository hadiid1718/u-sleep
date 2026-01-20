import React from 'react';
import { Bell, MessageSquare } from 'lucide-react';

// shared components (same ones you already use)
import {StatusButton} from '../ui/StatusButton';
import {ToggleSwitch} from '../ui/ToggleSwitch';
import {InputField} from '../ui/InputField';
import {InteractiveCard} from '../ui/InteractiveCard';

const NotificationsView = ({
  emailNotifications,
  setEmailNotifications,
  formData,
  handleInputChange,
  formStates,
  handleSave,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Notifications
        </h2>

        <StatusButton
          isComplete={formStates.telegramSaved}
          label={formStates.telegramSaved ? 'Setup Complete' : 'Setup Required'}
          onClick={() => handleSave('telegramSaved')}
          size="lg"
        />
      </div>

      <InteractiveCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-yellow-400" />
          <h3 className="text-white text-xl font-semibold">Notifications</h3>
        </div>

        <div className="space-y-6">
          <InteractiveCard hover={false} className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <ToggleSwitch
              checked={emailNotifications}
              onChange={setEmailNotifications}
              label="Email notifications about new jobs"
              description="Get notified when new jobs matching your criteria are found"
            />
          </InteractiveCard>

          <div className="border-t border-gray-600 pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <h4 className="text-white font-medium">Telegram Bot Notifications</h4>
            </div>

            <InteractiveCard hover={false} className="p-4">
              <div className="space-y-4">
                <ol className="text-gray-300 space-y-2 list-decimal list-inside text-sm bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg">
                  <li>Download Telegram</li>
                  <li>Open bot: t.me/upworkparserbot</li>
                  <li>Copy your Chat ID</li>
                </ol>

                <InputField
                  label="Telegram Chat ID"
                  value={formData.telegramChatId}
                  onChange={(v) => handleInputChange('telegramChatId', v)}
                />

                <div className="flex justify-end">
                  <StatusButton
                    isComplete={formStates.telegramSaved}
                    label={formStates.telegramSaved ? 'Connected' : 'Connect'}
                    onClick={() => handleSave('telegramSaved')}
                  />
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </InteractiveCard>
    </div>
  );
};

export default NotificationsView;
