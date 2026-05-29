import { env } from "./src/env.js";

async function run() {
  const query = `site:linkedin.com/in/arnav-chandra-051813325`;
  const apiKey = "df397695623015793992b73f4572689b1becf091";

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 3 })
    });

    if (!res.ok) {
        console.error("Serper API failed:", res.status, await res.text());
        return;
    }

    const data = await res.json() as any;
    console.log("Organic results:", data.organic?.length);
    console.log(JSON.stringify(data.organic, null, 2));

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
