import axios from "axios";
import React from "react";

function Custom() {
  const [response, setResponse] = React.useState("");

  React.useEffect(() => {
    fetch("/custom")
      .then((res) => res.json())
      .then((data) => setResponse(data));
  });

  return (
    <>
      <p style={{ color: "white" }}>hello</p>
    </>
  );
}

export default Custom;
