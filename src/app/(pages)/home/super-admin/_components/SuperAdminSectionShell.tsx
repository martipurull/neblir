"use client";

import Link from "next/link";
import React from "react";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type SuperAdminSectionShellProps = {
  title: string;
  description?: string;
  /** Shown beside the title (e.g. catalogue image preview on edit pages). */
  titleAside?: React.ReactNode;
  children: React.ReactNode;
};

const SuperAdminSectionShell: React.FC<SuperAdminSectionShellProps> = ({
  title,
  description,
  titleAside,
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
      <div
        className={
          titleAside
            ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            : undefined
        }
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-black sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm text-black/75">{description}</p>
          ) : null}
        </div>
        {titleAside ? (
          <div className="shrink-0 self-start">{titleAside}</div>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
};

export { SuperAdminSectionShell };
