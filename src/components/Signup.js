import React, { Component } from "react";
import "./signup.css";
import axios from "axios";

export default class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fname: "",
      lname: "",
      email: "",
      password: "",
      response: "",
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(e) {
    e.preventDefault();
    const { fname, lname, email, password, response } = this.state;
    // console.log(fname, lname, email, password);
    // fetch("http://localhost:5000/register", {
    //   method: "POST",
    //   crossDomain: true,
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //     "Access-Control-Allow-Origin": "*",
    //   },
    //   body: JSON.stringify({
    //     fname,
    //     email,
    //     lname,
    //     password,
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     console.log(data, "userRegister");
    //   });

    axios.post("/signup", {
      fname, 
      lname,
      email,
      password
    }).then((response) => {
      console.log(response.data);
      this.setState({response: response.data})
    }).catch((error) => {console.log(error)});

    if(response === "Credentials recieved successfully") {
      window.location.replace("/");
    }

  }
  render() {
    return (
      <>
        <div className="background">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <form className="form" onSubmit={this.handleSubmit}>
          <h3>Sign Up</h3>

          <div className="mb-3">
            <label>First name</label>
            <input
              type="text"
              className="input form-control"
              placeholder="First name"
              name="fname"
              onChange={(e) => this.setState({ fname: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label>Last name</label>
            <input
              type="text"
              className="input form-control"
              placeholder="Last name"
              name="lname"
              onChange={(e) => this.setState({ lname: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="input form-control"
              placeholder="Enter email"
              name="email"
              onChange={(e) => this.setState({ email: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="input form-control"
              placeholder="Enter password"
              name="password"
              onChange={(e) => this.setState({ password: e.target.value })}
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="button btn btn-primary">
              Sign Up
            </button>
          </div>
          <p className="forgot-password text-right">
            Already registered <a href="/login">sign in?</a>
          </p>
        </form>
      </>
    );
  }
}
