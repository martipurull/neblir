import React from "react";

interface LoadingStateProps {
  text?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ text = "Loading..." }) => {
  return <p className="text-sm text-black">{text}</p>;
};

export default LoadingState;
