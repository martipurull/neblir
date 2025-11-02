"use client";
import React, { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/characters/67df01a6c6ce706aa8198854",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("User data:", data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-center">Dashboard</h2>
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-4">User Details</h3>
        {/* Add user details here */}
      </section>
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-4">Characters</h3>
        {/* Add user characters here */}
      </section>
      <section className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-4">Games</h3>
        {/* Add games here */}
      </section>
    </div>
  );
};

export default Dashboard;
