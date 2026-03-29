import React from "react";

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
}

const PageSection: React.FC<PageSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <section
      className={`flex min-h-[70vh] flex-col rounded-lg bg-transparent p-4 sm:p-6 ${className}`.trim()}
    >
      {children}
    </section>
  );
};

export default PageSection;
