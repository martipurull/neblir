"use client";

import Link from "next/link";
import React from "react";

const Dashboard: React.FC = () => {
  const tabs = [
    {
      label: "Settings",
      link: "/home/settings",
    },
    {
      label: "Characters",
      link: "/home/characters",
    },
    {
      label: "Games",
      link: "/home/games",
    },
    {
      label: "Mechanics",
      link: "/home/mechanics",
    },
    {
      label: "World",
      link: "/home/world",
    },
    {
      label: "Dice Roller",
      link: "/home/dice-roller",
    },
  ];

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-black sm:mb-8 sm:text-3xl">
        Dashboard
      </h2>
      <div>
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.link}
            className="text-lg font-semibold text-black sm:text-xl"
          >
            <section className="mb-6 rounded-lg border border-black bg-transparent p-4 sm:mb-8 sm:p-6">
              {tab.label}
            </section>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
