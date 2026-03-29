import React from "react";

interface PageSubtitleProps {
  children: React.ReactNode;
}

const PageSubtitle: React.FC<PageSubtitleProps> = ({ children }) => {
  return <p className="mt-2 text-sm text-black sm:text-base">{children}</p>;
};

export default PageSubtitle;
