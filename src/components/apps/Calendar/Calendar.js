import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Save } from 'lucide-react';

const Calendar = ( saveFile, fileSystem ) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventText, setEventText] = useState('');
  const [eventColor, setEventColor] = useState('#3b82f6');

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' }
  ];

  // Load events from filesystem
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsPath = '/calendar_events.json';
        if (fileSystem[eventsPath]) {
          const savedEvents = JSON.parse(fileSystem[eventsPath].content);
          setEvents(savedEvents);
        }
      } catch (error) {
        console.error('Error loading calendar events:', error);
      }
    };
    loadEvents();
  }, [fileSystem]);

  // Save events to filesystem
  const saveEvents = async (newEvents) => {
    try {
      const eventsPath = '/calendar_events.json';
      await saveFile(eventsPath, JSON.stringify(newEvents), 'file');
      setEvents(newEvents);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateKey = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${month + 1}-${day}`;
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    const dateKey = getDateKey(day);
    if (events[dateKey]) {
      setEventText(events[dateKey].text);
      setEventColor(events[dateKey].color);
    } else {
      setEventText('');
      setEventColor('#3b82f6');
    }
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    const dateKey = getDateKey(selectedDate);
    const newEvents = { ...events };
    
    if (eventText.trim()) {
      newEvents[dateKey] = {
        text: eventText,
        color: eventColor
      };
    } else {
      delete newEvents[dateKey];
    }

    saveEvents(newEvents);
    setShowEventModal(false);
    setEventText('');
    setSelectedDate(null);
  };

  const handleDeleteEvent = () => {
    const dateKey = getDateKey(selectedDate);
    const newEvents = { ...events };
    delete newEvents[dateKey];
    saveEvents(newEvents);
    setShowEventModal(false);
    setEventText('');
    setSelectedDate(null);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Today
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={previousMonth}
            style={{
              padding: '8px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            style={{
              padding: '8px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {/* Day names */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '8px'
        }}>
          {dayNames.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                padding: '8px'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {/* Empty cells for days before month starts */}
          {[...Array(startingDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Actual days */}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateKey = getDateKey(day);
            const hasEvent = events[dateKey];
            const today = isToday(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                  aspectRatio: '1',
                  minHeight: '80px',
                  padding: '8px',
                  background: today ? '#dbeafe' : hasEvent ? hasEvent.color + '20' : '#f9fafb',
                  border: today ? '2px solid #3b82f6' : hasEvent ? `2px solid ${hasEvent.color}` : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{
                  fontSize: '16px',
                  fontWeight: today ? '700' : '600',
                  color: today ? '#3b82f6' : '#1f2937'
                }}>
                  {day}
                </span>
                {hasEvent && (
                  <div style={{
                    fontSize: '11px',
                    color: hasEvent.color,
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textAlign: 'left',
                    fontWeight: '500',
                    lineHeight: '1.3'
                  }}>
                    {hasEvent.text}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                margin: 0
              }}>
                {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Add note or appointment..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#6b7280'
              }}>
                Color
              </label>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEventColor(color.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color.value,
                      border: eventColor === color.value ? '3px solid #1f2937' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              {events[getDateKey(selectedDate)] && (
                <button
                  onClick={handleDeleteEvent}
                  style={{
                    padding: '10px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} />
                  Delete
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                style={{
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;