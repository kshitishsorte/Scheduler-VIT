import React from "react";
import Day from "./Day";
import "./days.css";
export default function Month({ month }) {
  return (
    <div className="month flex-1 grid grid-cols-7 grid-rows-5 bg-black">
      {month.map((row, i) => (
        <React.Fragment key={i}>
          {row.map((day, idx) => (
            <Day day={day} key={idx} rowIdx={i} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}