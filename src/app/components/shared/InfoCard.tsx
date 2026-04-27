import React from "react";

interface InfoCardProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  id?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  children,
  className = "",
  border = true,
  id,
}) => {
  return (
    <div
      id={id}
      className={`mt-5 rounded-md ${border ? "border border-black" : ""} p-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default InfoCard;
