import dayjs from "dayjs";
import React, { useContext } from "react";
import logo from "../assets/logo.png";
import "./days.css";
import GlobalContext from "../context/GlobalContext";
import { useNavigate } from "react-router-dom";

export default function CalendarHeader() {
  const navigate = useNavigate();

  const { monthIndex, setMonthIndex } = useContext(GlobalContext);
  function handlePrevMonth() {
    setMonthIndex(monthIndex - 1);
  }
  function handleNextMonth() {
    setMonthIndex(monthIndex + 1);
  }
  function handleReset() {
    setMonthIndex(
      monthIndex === dayjs().month()
        ? monthIndex + Math.random()
        : dayjs().month()
    );
  }
  return (
    <header className="navhead px-4 py-2 flex items-center bg-black ">
      <img src={logo} alt="calendar" className="logo mr-2 w-12 h-12" />
      <h1 className="title heading mr-10 text-xl text-gray-500 fond-bold">
        Schedule VIT
      </h1>
      <button
        onClick={handleReset}
        className="today buttonhover border rounded py-2 px-4 mr-5 text-white"
      >
        Today
      </button>
      <button onClick={handlePrevMonth}>
        <span className="material-icons-outlined cursor-pointer text-gray-600 mx-2">
          chevron_left
        </span>
      </button>
      <button onClick={handleNextMonth}>
        <span className="material-icons-outlined cursor-pointer text-gray-600 mx-2">
          chevron_right
        </span>
      </button>
      <h2 className="titlemonth ml-4 text-xl text-white font-bold">
        {dayjs(new Date(dayjs().year(), monthIndex)).format("MMMM YYYY")}
      </h2>
      <div className="loginsign">
        <button
          className="buttonhover login border rounded py-2 px-4 mr-5 text-white"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
        <span className="or">or</span>
        <button
          className="buttonhover signup border rounded py-2 px-4 mr-5 text-white"
          onClick={() => navigate("/signup")}
        >
          SignUp
        </button>
      </div>
    </header>
  );
}
