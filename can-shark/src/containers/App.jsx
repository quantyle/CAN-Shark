import React from "react";
import PropTypes from "prop-types";
import {
    Switch,
    Route,
    Redirect
} from "react-router-dom";
import {
    withStyles,
} from "@material-ui/core";
import appStyle from "../variables/styles/appStyle.jsx";
import routes from '../routes/routes';


class App extends React.Component {

    constructor(props) {
        super(props);
    }




    render() {
        const { classes, ...rest } = this.props;

        // a switch for all of our application views
        const switchRoutes = (
            <Switch>
                {routes.map((prop, key, ) => {
                    if (prop.redirect)
                        return <Redirect from={prop.path} to={{
                            pathname: prop.to,
                        }} key={key} />;
                    return <Route key={key} path={prop.path} render={(props) =>
                        <prop.component {...props} />}
                    />;
                })}
            </Switch>
        );


        return (
            <div>
                <Switch>
                    <div className={classes.wrapper}>{switchRoutes}</div>
                </Switch>
            </div>


        );
    }
}

App.propTypes = {
    classes: PropTypes.object.isRequired,
    location: PropTypes.any,
};

export default withStyles(appStyle)(App);
