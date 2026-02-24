"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  const tabs = [
    {
      label: "Settings",
      link: "/settings",
    },
    {
      label: "Characters",
      link: "/characters",
    },
    {
      label: "Games",
      link: "/games",
    },
    {
      label: "Game Mechanics",
      link: "/game-mechanics",
    },
  ];
  const [imageURL, setImageURL] = useState("");
  useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     const response = await fetch(
    //       "/api/characters/67e4911f62cb187d0adbd2d5",
    //       {
    //         method: "GET",
    //         headers: {
    //           "Content-Type": "application/json",
    //         },
    //       }
    //     );
    //     if (!response.ok) {
    //       throw new Error("Network response was not ok");
    //     }
    //     const data = await response.json();
    //     console.log("User data:", data);
    //   } catch (error) {
    //     console.error("Error fetching character data:", error);
    //   }
    // };

    // fetchData();

    async function fetchImageURL() {
      const response = await fetch(
        "/api/image-url?imageKey=characters-dahlia_ters.png"
      );
      const data = await response.json();
      setImageURL(data?.url);
    }
    fetchImageURL();
  }, []);
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 sm:px-8 sm:py-8">
      <h2 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl">
        Dashboard
      </h2>
      <div>
        {tabs.map((tab) => (
          <section
            className="mb-6 rounded-lg bg-white p-4 shadow-md sm:mb-8 sm:p-6"
            key={tab.label}
          >
            <Link href={tab.link} className="text-lg font-semibold sm:text-xl">
              {tab.label}
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
