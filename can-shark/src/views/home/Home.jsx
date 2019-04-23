import React from "react";
import PropTypes from "prop-types";
import {
    withStyles, IconButton,
} from "@material-ui/core";
import homeStyle from "../../variables/styles/homeStyle.jsx";
import ReactDataSheet from 'react-datasheet';
import { PlayArrow } from '@material-ui/icons';

class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: 0,
            table: [],
            play: false,
        };
    }



    componentDidMount() {
        let self = this;
        var conn = new WebSocket('ws://localhost:8765/echo');

        conn.onmessage = function (e) {
          
                console.log(e.data);
                let data = JSON.parse(e.data.toString());
                //console.log(data);
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

                // udate PIDs 
                self.setState({
                    data: data,
                    table: [
                        [{ readOnly: true, value: "PID (hex)" },
                        { readOnly: true, value: "PID (decimal)" },
                        { readOnly: true, value: "Response" },],
                        [{ value: "0x" + String(pids[0]).padStart(2, '0') }, { value: data[0] }, { value: "" },],
                        [{ value: pids[1] }, { value: data[1] }, { value: "" },],
                        [{ value: pids[2] }, { value: data[2] }, { value: "" },],
                        [{ value: pids[3] }, { value: data[3] }, { value: "" },],
                    ] //excel-like table for visualization .csv upload
                });
            

        };

        conn.onopen = function () {
            conn.send("{\"engine_rpm\": \"1\"}");
        };


    }



    toggleValue = (name) => {
        this.setState({
          [name]: !this.state[name],
        });
      };


    render() {
        const { classes, } = this.props;

        return (
            <div>
                <IconButton onClick={()=> this.toggleValue("play")}>
                    <PlayArrow /> 
                </IconButton>
                <ReactDataSheet
                    data={this.state.table}
                    valueRenderer={(cell) => cell.value}
                    onCellsChanged={changes => {
                        const table = this.state.table.map(row => [...row]);
                        changes.forEach(({ cell, row, col, value }) => {
                            table[row][col] = { ...table[row][col], value };
                        });
                        console.log(changes);
                        this.setState({ table });
                    }}
                />
            </div>


        );
    }
}

Home.propTypes = {
    classes: PropTypes.object.isRequired,
    location: PropTypes.any,
};

export default withStyles(homeStyle)(Home);
