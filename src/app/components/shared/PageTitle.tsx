import React from "react";

interface PageTitleProps {
  children: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ children }) => {
  return <h1 className="text-xl font-semibold sm:text-2xl">{children}</h1>;
};

export default PageTitle;
