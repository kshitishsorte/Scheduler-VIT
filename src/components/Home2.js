import React, { useState, useContext, useEffect } from "react";
import { getMonth } from "../util";
import CalendarHeader2 from "./CalendarHeader2";
import Sidebar from "./Sidebar";
import Month from "./Month";
import "../App.css";
// import Login from "./Login";
// import Home from "./Home";
import GlobalContext from "../context/GlobalContext";
import EventModal from "./EventModal";

function Home2() {
  const [currenMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex, showEventModal } = useContext(GlobalContext);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return (
    <React.Fragment>
      {showEventModal && <EventModal />}

      <div className="h-screen flex flex-col">
        <CalendarHeader2 />
        <div className="flex flex-1">
          <Sidebar />
          <Month month={currenMonth} />
        </div>
      </div>
    </React.Fragment>
  );
}

export default Home2;
