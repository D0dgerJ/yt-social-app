import React from "react";
import "./Logo.scss";

const Logo: React.FC = () => {
  return (
    <h1 className="logo">
      <span className="logo__full">DodgerJ Social</span>
      <span className="logo__short">DJS</span>
    </h1>
  );
};

export default Logo;