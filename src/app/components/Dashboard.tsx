"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  const [imageURL, setImageURL] = useState('')
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
      const response = await fetch("/api/image-url?imageKey=characters-dahlia_ters.png")
      const data = await response.json()
      setImageURL(data?.url)
    }
    fetchImageURL()
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
        <div>
          <h4>Testing pre-signed URL functionality</h4>
          {imageURL && (
            <Image src={imageURL} width={200} height={200} alt={"Testing pre-signed image URL"} />
          )}
        </div>
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
