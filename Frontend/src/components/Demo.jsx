
import React, { useState } from 'react';
const ScheduleDemo = () => {
  const [selectedDate, setSelectedDate] = useState(19);
  const [selectedTime, setSelectedTime] = useState('2:00 PM');
  const [email, setEmail] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const dates = [
    { day: 17, month: 'Sep' }, { day: 18, month: 'Sep' }, { day: 19, month: 'Sep' },
    { day: 20, month: 'Sep' }, { day: 21, month: 'Sep' }, { day: 22, month: 'Sep' },
    { day: 23, month: 'Sep' }, { day: 24, month: 'Sep' }, { day: 25, month: 'Sep' },
    { day: 26, month: 'Sep' }, { day: 27, month: 'Sep' }, { day: 28, month: 'Sep' }
  ];

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  const handleScheduleDemo = () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsScheduled(true);
    setShowConfirmation(true);
    
    // Hide confirmation after 5 seconds
    setTimeout(() => {
      setShowConfirmation(false);
    }, 5000);
  };

  const isFormValid = email.trim() && email.includes('@') && email.includes('.') && selectedDate && selectedTime;

  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Schedule a Demo
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Book a call to see our daily comparison in action
        </p>
        
        {showConfirmation && (
          <div className="mb-8 mx-auto max-w-2xl">
            <div className="bg-lime-400 text-black p-4 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">Demo Scheduled Successfully! 🎉</h3>
              <p className="text-sm">
                Your demo call is scheduled for September {selectedDate}, 2024 at {selectedTime}
                <br />
                Confirmation sent to: <strong>{email}</strong>
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-medium">September 2024</h3>
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-white">&lt;</button>
                  <button className="text-gray-400 hover:text-white">&gt;</button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-gray-400 text-center py-2 text-sm font-medium">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: 35}, (_, i) => {
                  const date = i - 5; // Start calendar from correct position
                  const isCurrentMonth = date > 0 && date <= 30;
                  const displayDate = isCurrentMonth ? date : '';
                  
                  return (
                    <button
                      key={i}
                      onClick={() => isCurrentMonth && setSelectedDate(date)}
                      disabled={!isCurrentMonth || isScheduled}
                      className={`h-10 text-center rounded text-sm transition-colors ${
                        selectedDate === date && isCurrentMonth
                          ? 'bg-lime-400 text-black font-medium' 
                          : isCurrentMonth && !isScheduled
                          ? 'text-white hover:bg-gray-800'
                          : 'text-gray-600'
                      } ${isScheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {displayDate}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Time Slots */}
            <div>
              <h3 className="text-white text-lg font-medium mb-6">Available Times</h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    disabled={isScheduled}
                    className={`p-3 rounded text-sm text-center transition-colors ${
                      selectedTime === time 
                        ? 'bg-lime-400 text-black font-medium' 
                        : !isScheduled
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-800 text-gray-500'
                    } ${isScheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    disabled={isScheduled}
                    className={`w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-lime-400 focus:outline-none transition-colors ${
                      isScheduled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  {email && (!email.includes('@') || !email.includes('.')) && (
                    <p className="text-red-400 text-sm mt-1">Please enter a valid email address</p>
                  )}
                </div>
                
                <button 
                  onClick={handleScheduleDemo}
                  disabled={!isFormValid || isScheduled}
                  className={`w-full py-4 rounded-lg font-medium transition-colors ${
                    isFormValid && !isScheduled
                      ? 'bg-lime-400 text-black hover:bg-lime-300'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isScheduled ? '✓ Demo Scheduled' : 'Schedule Demo Call'}
                </button>
                
                {!isScheduled && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Selected: September {selectedDate}, 2024 at {selectedTime}
                    </p>
                  </div>
                )}
                
                {isScheduled && (
                  <button 
                    onClick={() => {
                      setIsScheduled(false);
                      setEmail('');
                      setShowConfirmation(false);
                    }}
                    className="w-full py-2 text-lime-400 text-sm hover:text-lime-300 transition-colors"
                  >
                    Schedule Another Demo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ScheduleDemo;