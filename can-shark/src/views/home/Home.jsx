import React from "react";
import PropTypes from "prop-types";
import {
    withStyles, IconButton,
} from "@material-ui/core";
import homeStyle from "../../variables/styles/homeStyle.jsx";
import ReactDataSheet from 'react-datasheet';
import {
    PlayArrow,
    Pause,
} from '@material-ui/icons';

var connection; // websocket connection

class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: 0,
            table: [],
            play: true,
        };
        this.readSocket = this.readSocket.bind(this);
    }

    decimalToHexString(number) {
        if (number < 0) {
            number = 0xFFFFFFFF + number + 1;
        }

        return number.toString(16).toUpperCase();
    }

    readSocket = (e, conn) => {
        let data = JSON.parse(e.data.toString());
        if (data.length > 0) {
            //console.log(data);
            let pids = [
                0x05, // engine coolant temp
                0x0C, // engine rpm
                0x0D, // vehicle speed
                0x10, // MAF sensor
                0x14, // O2 Voltage
                0x11, // throttle 
            ];
            // for(var i = 1; i < this.state.table.length; i ++){
            //     let pid = parseInt(this.state.table[i][0], 16);
            //     console.log(pid);
            //     pids.push(pid);
            // }

            let msg = { //message object 
                "pids": pids,
                "len": pids.length,
                "stop": this.state.play
            };

            msg = JSON.stringify(msg); // convert json to string
            conn.send(msg);

            let table = this.generateTable(data, pids);
            this.setState({
                data: data,
                table: table
            });

        } else {

            let msg = { //message object 
                "stop": this.state.play
            };

            msg = JSON.stringify(msg); // convert json to string
            conn.send(msg);
        }

    }

    generateTable(data = [], pids = []) {
        // table with headers
        let table = [
            [{ readOnly: true, value: (<div>PID<sub> 16</sub></div>) },
            { readOnly: true, value: (<div>PID<sub> 10</sub></div>) },
            { readOnly: true, value: "Response" },]
        ];
        //generate the rest of the table using incoming data
        for (let i = 0; i < 10; i++) {
            if (pids[i] && data[i]) { // if there is data at this index, add it to table
                table.push([ // push row into table
                    { value: "0x" + this.decimalToHexString(pids[i]).padStart(2, '0') },
                    { value: pids[i] },
                    { value: data[i] },
                ]);
            } else { // otherwise just add blank rows
                table.push([ // push row into table
                    { value: "" },
                    { value: "" },
                    { value: "" },
                ]);
            }

        }
        return table;
    }



    componentDidMount() {
        let self = this;
        connection = new WebSocket('ws://localhost:8765/echo');

        connection.onmessage = e => this.readSocket(e, connection);

        // send initial data
        connection.onopen = function () {
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
                "stop": self.state.play
            };
            msg = JSON.stringify(msg); // convert json to string
            connection.send(msg); // send request
        };

        // set initial empty table
        let table = this.generateTable();
        this.setState({ table });

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

                {this.state.play ? (
                    <IconButton onClick={() => this.toggleValue("play")}>
                        <PlayArrow />
                    </IconButton>
                ) : (
                        <IconButton onClick={() => this.toggleValue("play")}>
                            <Pause />
                        </IconButton>
                    )}
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
