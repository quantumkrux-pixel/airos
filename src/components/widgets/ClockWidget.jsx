// src/components/widgets/ClockWidget.jsx
import React from 'react';
import styled from 'styled-components';

const WidgetContainer = styled.div`
  min-width: 220px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(25, 25, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.5);
  cursor: default;
  user-select: none;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const Time = styled.div`
  font-size: 24px;
  font-weight: 600;
`;

const DateText = styled.div`
  font-size: 12px;
  color: #9ca3af;
`;

const CalendarMini = styled.div`
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  justify-content: space-between;
`;

const Month = styled.span`
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const DayName = styled.span`
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ClockWidget = ({ now }) => {
  const date = now ?? new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const displayHour = ((hours + 11) % 12) + 1;
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'long' });
  const year = date.getFullYear();

  return (
    <WidgetContainer>
      <Header>
        <Time>
          {displayHour}:{minutes} <span style={{ fontSize: 12 }}>{ampm}</span>
        </Time>
      </Header>
      <DateText>
        {weekday}, {month} {day}, {year}
      </DateText>

      <CalendarMini>
        <Month>{month.toUpperCase()}</Month>
        <DayName>{weekday.toUpperCase()}</DayName>
      </CalendarMini>
    </WidgetContainer>
  );
};

export default ClockWidget;