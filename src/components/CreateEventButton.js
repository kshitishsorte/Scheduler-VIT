import React, { useContext } from "react";
import pencil from "../assets/pencil.svg";
import GlobalContext from "../context/GlobalContext";
import './days.css';
export default function CreateEventButton() {
  const { setShowEventModal } = useContext(GlobalContext);
  return (
    <button
      onClick={() => setShowEventModal(true)}
      className="border text-white p-2 rounded-full flex items-center shadow-md hover:shadow-2xl"
    >
      <img src={pencil} alt="create_event" className="pencil w-7 h-7" />
      {/* <span className="material-symbols-outlined">edit_calendar</span> */}
      <span className="pl-3 pr-7"> Create Event</span>
    </button>
  );
}
