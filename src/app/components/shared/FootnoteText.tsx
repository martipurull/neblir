import React from "react";

interface FootnoteTextProps {
  children: React.ReactNode;
  className?: string;
}

const FootnoteText: React.FC<FootnoteTextProps> = ({
  children,
  className = "",
}) => {
  return (
    <small className={`text-xs text-gray-600 ${className}`.trim()}>
      {children}
    </small>
  );
};

export default FootnoteText;
