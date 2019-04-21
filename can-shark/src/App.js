import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      intervalId: null,
      data: 0,
    }
  }

  componentDidMount() {
    let self = this;
    var conn = new WebSocket('ws://localhost:8765/echo');
    
    conn.onmessage = function (e) {
      console.log(e.data);
      let data = JSON.parse(e.data.toString());
      //console.log(data);
      self.setState({ data: e.data });
      let pids = [
        0x05, // engine coolant temp
        0x0C, // engine rpm
        0x0D, // vehicle speed
        0x10, // MAF sensor
        0x14, // O2 Voltage
        0x11, // throttle 
      ];
      let msg = { //message object 
        "pids": pids,
        "len": pids.length,
      };

      msg = JSON.stringify(msg); // convert json to string
      conn.send(msg);
    };

    conn.onopen = function () {
      conn.send("{\"engine_rpm\": \"1\"}");
    };
  }



  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            {this.state.data}
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
