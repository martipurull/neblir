"use client";

import Link from "next/link";
import React from "react";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type SuperAdminSectionShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

const SuperAdminSectionShell: React.FC<SuperAdminSectionShellProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      <Link
        href="/home/super-admin"
        className={`${superAdminNavLinkClassName} mb-4 sm:mb-5`}
      >
        ← Super admin hub
      </Link>
      <h1 className="text-2xl font-bold text-black sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-black/75">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
};

export default SuperAdminSectionShell;
