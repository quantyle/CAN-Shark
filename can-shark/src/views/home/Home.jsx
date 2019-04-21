import React from "react";
import PropTypes from "prop-types";
import {
    withStyles,
} from "@material-ui/core";
import homeStyle from "../../variables/styles/homeStyle.jsx";
import ReactDataSheet from 'react-datasheet';


class Home extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: 0,
            table: [],
        };
    }

    componentDidMount() {
        let self = this;
        var conn = new WebSocket('ws://localhost:8765/echo');

        conn.onmessage = function (e) {
            console.log(e.data);
            let data = JSON.parse(e.data.toString());
            //console.log(data);
            self.setState({ 
                data: data,
                table: [
                    [{ readOnly: true, value: "" },
                    { readOnly: true, value: "A" },
                    { readOnly: true, value: "B" },
                    { readOnly: true, value: "C" },
                    { readOnly: true, value: "D" },
                    { readOnly: true, value: "E" },
                    { readOnly: true, value: "F" },],
                    [{ readOnly: true, value: "1" }, { value: data[0] }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "2" }, { value: data[1] }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "3" }, { value: data[2] }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "4" }, { value: data[3] }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "5" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "6" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "7" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "8" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "9" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                    [{ readOnly: true, value: "10" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }],
                ] //excel-like table for visualization .csv upload
            });
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


    toggleDrawer = () => {
        this.setState({
            open: !this.state.open,
        });
    }


    render() {
        const { classes, } = this.props;

        return (
            <div>
                <div>
                    {function (e) {
                        let out = [<div>This is a contact</div>];

                        return out;
                    }}
                </div>
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
                {this.state.data}
            </div>


        );
    }
}

Home.propTypes = {
    classes: PropTypes.object.isRequired,
    location: PropTypes.any,
};

export default withStyles(homeStyle)(Home);
