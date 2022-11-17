// import React, { useState, useContext, useEffect } from "react";
// import { getMonth } from "./util";
// import CalendarHeader from "./components/CalendarHeader";
// import Sidebar from "./components/Sidebar";
// import Month from "./components/Month";
// import "./App.css";
import Login from "./components/Login";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Custom from "./components/custom";
import Home2 from "./components/Home2";
// import GlobalContext from "./context/GlobalContext";
// import EventModal from "./components/EventModal";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  // const [currenMonth, setCurrentMonth] = useState(getMonth());
  // const { monthIndex, showEventModal } = useContext(GlobalContext);

  // useEffect(() => {
  //   setCurrentMonth(getMonth(monthIndex));
  // }, [monthIndex]);

  // return (
  //   <React.Fragment>
  //     {/* {showEventModal && <EventModal />} */}

  //     <div className="h-screen flex flex-col">
  //       <CalendarHeader />
  //       <div className="flex flex-1">
  //         <Sidebar />
  //         <Month month={currenMonth} />
  //       </div>
  //     </div>
  //   </React.Fragment>
  // );

  // return window.location.pathname === "/login" ? (
  //   <Login />
  // ) : (
  //   <React.Fragment>
  //     {showEventModal && <EventModal />}

  //     <div className="h-screen flex flex-col">
  //       <CalendarHeader />
  //       <div className="flex flex-1">
  //         <Sidebar />
  //         <Month month={currenMonth} />
  //       </div>
  //     </div>
  //   </React.Fragment>
  // );

  //These are individual routes for react

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/custom" element={<Custom />} />
        <Route path="/loginsuccess" element={<Home2 />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App;
