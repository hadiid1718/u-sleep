import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import summaryApi from '../../common/index';

const ScheduleDemo = () => {
  const [dates, setDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(0);

  // const API_BASE_URL = 'http://localhost:8080/api/user/demo-scheduling';

  // Fetch available dates on component mount
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  // Fetch available times when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate]);

 const fetchAvailableDates = async () => {
  try {
    const response = await fetch(`${summaryApi.availableDate.url}/available-dates`);
    const data = await response.json();

    if (data.success) {
      setDates(data.data);
      // Auto-select first available date
      if (data.data.length > 0 && !selectedDate) {
        setSelectedDate(data.data[0].fullDate);
      }
    }
  } catch (err) {
    setError('Failed to load available dates');
    console.error('Error fetching dates:', err);
  }
};

const fetchAvailableTimes = async (date) => {
  try {
    setLoading(true);
    const response = await fetch(`${summaryApi.availableTime.url}/available-times/${date}`);
    const data = await response.json();

    if (data.success) {
      setTimeSlots(data.data);

      // Auto-select first available time if current selection is not available
      const currentTimeAvailable = data.data.find(
        (slot) => slot.time === selectedTime && slot.available
      );

      if (!currentTimeAvailable) {
        const firstAvailable = data.data.find((slot) => slot.available);
        setSelectedTime(firstAvailable ? firstAvailable.time : null);
      }
    }
  } catch (err) {
    setError('Failed to load available times');
    console.error('Error fetching times:', err);
  } finally {
    setLoading(false);
  }
};

const handleScheduleDemo = async () => {
  if (!email.trim() || !selectedDate || !selectedTime) {
    setError('Please fill in all required fields');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    setError('Please enter a valid email address');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${summaryApi.demoSchedule.url}/schedule-demo`, {
      method: summaryApi.demoSchedule.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        company,
        phone,
        date: selectedDate,
        time: selectedTime,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setIsScheduled(true);
      setShowConfirmation(true);

      // Refresh available times for this date
      fetchAvailableTimes(selectedDate);

      setTimeout(() => {
        setShowConfirmation(false);
      }, 5000);
    } else {
      setError(data.message || 'Failed to schedule demo');
    }
  } catch (err) {
    setError('Network error. Please try again.');
    console.error('Error scheduling demo:', err);
  } finally {
    setLoading(false);
  }
};


  const handleReset = () => {
    setIsScheduled(false);
    setEmail('');
    setName('');
    setCompany('');
    setPhone('');
    setShowConfirmation(false);
    setError(null);
    fetchAvailableDates();
  };

  const isFormValid = email.trim() && email.includes('@') && email.includes('.') && selectedDate && selectedTime;

  // Group dates by month for display
  const groupedDates = dates.reduce((acc, date) => {
    const key = `${date.month} ${date.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(date);
    return acc;
  }, {});

  const monthKeys = Object.keys(groupedDates);
  const currentMonthKey = monthKeys[currentMonth] || monthKeys[0];
  const currentMonthDates = groupedDates[currentMonthKey] || [];

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Schedule a Demo
          </h2>
          <p className="text-gray-400 text-lg">
            Book a personalized demo call with our team
          </p>
        </div>
        
        {showConfirmation && (
          <div className="mb-8 mx-auto max-w-2xl animate-fade-in">
            <div className="bg-gradient-to-r from-lime-400 to-green-400 text-black p-6 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-xl mb-2">Demo Scheduled Successfully! 🎉</h3>
                  <p className="text-sm">
                    Your demo is scheduled for <strong>{formatDateDisplay(selectedDate)}</strong> at <strong>{selectedTime}</strong>
                    <br />
                    Confirmation sent to: <strong>{email}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 mx-auto max-w-2xl">
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-lime-400" />
                  <h3 className="text-white text-lg font-medium">{currentMonthKey}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                    disabled={currentMonth === 0 || isScheduled}
                    className="px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(Math.min(monthKeys.length - 1, currentMonth + 1))}
                    disabled={currentMonth >= monthKeys.length - 1 || isScheduled}
                    className="px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-gray-500 text-center py-2 text-xs font-medium uppercase">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {currentMonthDates.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => !isScheduled && setSelectedDate(date.fullDate)}
                    disabled={isScheduled}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      selectedDate === date.fullDate
                        ? 'bg-lime-400 text-black scale-105 shadow-lg' 
                        : !isScheduled
                        ? 'text-white hover:bg-gray-800 hover:scale-105'
                        : 'text-gray-600'
                    } ${isScheduled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-lg">{date.day}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Slots & Form */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-lime-400" />
                <h3 className="text-white text-lg font-medium">Available Times</h3>
              </div>
              
              {loading && <p className="text-gray-400 mb-4">Loading available times...</p>}
              
              <div className="grid grid-cols-3 gap-2 mb-8 max-h-64 overflow-y-auto">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && !isScheduled && setSelectedTime(slot.time)}
                    disabled={!slot.available || isScheduled}
                    className={`p-3 rounded-lg text-sm text-center transition-all ${
                      selectedTime === slot.time && slot.available
                        ? 'bg-lime-400 text-black font-medium shadow-lg' 
                        : slot.available && !isScheduled
                        ? 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-105'
                        : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                    {!slot.available && <span className="block text-xs mt-1">Booked</span>}
                  </button>
                ))}
              </div>
              
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address *"
                  disabled={isScheduled}
                  className="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-lime-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name (optional)"
                  disabled={isScheduled}
                  className="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-lime-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  disabled={isScheduled}
                  className="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-lime-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                <button 
                  onClick={handleScheduleDemo}
                  disabled={!isFormValid || isScheduled || loading}
                  className={`w-full py-4 rounded-lg font-medium transition-all ${
                    isFormValid && !isScheduled && !loading
                      ? 'bg-lime-400 text-black hover:bg-lime-300 hover:scale-105 shadow-lg'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Scheduling...' : isScheduled ? '✓ Demo Scheduled' : 'Schedule Demo Call'}
                </button>
                
                {!isScheduled && selectedDate && selectedTime && (
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-300 text-sm">
                      <strong>{formatDateDisplay(selectedDate)}</strong> at <strong>{selectedTime}</strong>
                    </p>
                  </div>
                )}
                
                {isScheduled &&  (
                  <button 
                    onClick={handleReset}
                    className="w-full py-3 text-lime-400 text-sm hover:text-lime-300 hover:bg-gray-800/50 rounded-lg transition-colors"
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