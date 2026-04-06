'use client';
import { useEffect, } from "react";
import { useState } from "react";


export default function Home() {
  const [name, setName] = useState(null);
  useEffect(() => {
    setTimeout(() => {
      setName("Mustafa");
      console.log("Hello from the client side!");
    }, 2000);
  }, []);

  return (
    <>
      <h1>
        {name? `Welcome to ${name}'s next app`: "Loading..."}
      </h1>
    </>
  );
}