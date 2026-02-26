import React from "react";

interface InfoCardProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  children,
  className = "",
  border = true,
}) => {
  return (
    <div
      className={`mt-5 rounded-md ${border ? "border border-gray-200" : ""} p-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default InfoCard;
