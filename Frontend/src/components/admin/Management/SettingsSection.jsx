const SettingsSection = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Max Response Time (minutes)</label>
              <input type="number" defaultValue="5" className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400" />
            </div>
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Daily Rate Limit</label>
              <input type="number" defaultValue="1000" className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400" />
            </div>
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Auto-suspend threshold</label>
              <select className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400">
                <option>After 5 violations</option>
                <option>After 10 violations</option>
                <option>After 20 violations</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">System alerts</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">Daily reports</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">User violations</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">Revenue milestones</span>
              <input type="checkbox" className="text-lime-400 focus:ring-lime-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsSection