import React from "react";
import PropTypes from "prop-types";
import loadingGif from '../../assets/img/loading.gif';

function Loading({ ...props }) {
  const {
    classes,
    ...rest
  } = props;

  return (
    <div style={{backgroundImage: "url(" + loadingGif+")", backgroundPosition: 'center', backgroundRepeat: "no-repeat", width: "100%", height: "100vh"}}>
    </div>
  );
}

Loading.propTypes = {
  classes: PropTypes.object.isRequired,

};

export default Loading;
