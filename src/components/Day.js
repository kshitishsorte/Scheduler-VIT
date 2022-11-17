import dayjs from "dayjs";
import React, { useContext, useState, useEffect } from "react";
import "./days.css";
import GlobalContext from "../context/GlobalContext";

export default function Day({ day, rowIdx }) {
  const [dayEvents, setDayEvents] = useState([]);
  const {
    setDaySelected,
    setShowEventModal,
    filteredEvents,
    setSelectedEvent,
  } = useContext(GlobalContext);

  useEffect(() => {
    const events = filteredEvents.filter(
      (evt) => dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
    setDayEvents(events);
  }, [filteredEvents, day]);

  function getCurrentDayClass() {
    return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
      ? "circle bg-blue-600 text-white rounded-full w-7 font-xl"
      : "";
  }

  function checkHoliday() {
    return day.format("ddd") === "Sun" ? "text-white" : "";
  }
  return (
    <div
      className={`days border border-gray-200 flex flex-col bg-black ${checkHoliday()}`}
    >
      <>
        <header className="flex flex-col items-center">
          {rowIdx === 0 && (
            <p className={`name text-sm mt-1 ${checkHoliday()}`}>
              {day.format("ddd").toUpperCase()}
            </p>
          )}
          <p
            className={`namemonth text-sm p-1 my-1 text-center font-xl ${getCurrentDayClass()} ${checkHoliday()}`}
          >
            {day.format("DD")}
          </p>
        </header>
        <div
          className="flex-1 cursor-pointer"
          onClick={() => {
            setDaySelected(day);
            setShowEventModal(true);
          }}
        >
          {dayEvents.map((evt, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedEvent(evt)}
              className={`bg-${evt.label}-200 p-1 mr-3 text-gray-600 text-sm rounded mb-1 truncate`}
            >
              {evt.title}
            </div>
          ))}
        </div>
      </>
    </div>
  );
}
