import React from "react";
import "./login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const navigate = useNavigate();
  const [response, setResponse] = React.useState('')

  function handleSubmit(e) {
    e.preventDefault();
    axios
      .post("/login", {
        email,
        password,
      })
      .then((response) => {
        console.log(response.data);
        setResponse(response.data)
      })
      .catch((error) => {
        console.log(error);
      });
  }

  if(response === "Credentials recieved successfully") {
    window.location.replace("/loginsuccess");
  }

  return (
    <>
      <div className="background">
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <form className="form" method=
      'post' onSubmit={handleSubmit}>
        <h3>Login Here</h3>

        <label for="username">Username</label>
        <input
          type="text" className = "input"
          placeholder="Email or Phone"
          id="username"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label for="password">Password</label>
        <input
          type="password" className = "input" 
          placeholder="Password"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="button" >Log In</button>
        {/* res.send("Credentials recieved successfully"); */}
        {/* <div className="social">
          <div className="go">
            <i className="fab fa-google"></i> Google
          </div>
          <div className="fb">
            <i className="fab fa-facebook"></i> Facebook
          </div>
        </div> */}
      </form>
    </>
  );
}
