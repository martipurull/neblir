import React from "react";

interface LoadingStateProps {
  text?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ text = "Loading..." }) => {
  return <p className="text-sm text-gray-600">{text}</p>;
};

export default LoadingState;
