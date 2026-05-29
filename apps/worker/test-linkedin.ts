import { JSDOM } from "jsdom";

async function run() {
  const url = "https://www.linkedin.com/in/arnav-chandra-051813325/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BO8CMcM%2BZSDGwtSKUofiwxA%3D%3D";
  
  // The user's query format: site:linkedin.com/in "url"
  const dorkQuery = encodeURIComponent(`site:linkedin.com/in "${url}"`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${dorkQuery}`;
  
  console.log("Searching URL:", searchUrl);
  
  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    if (!res.ok) {
        console.error("Fetch failed:", res.status);
        return;
    }

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const resultElement = document.querySelector(".result__body");
    
    if (resultElement) {
        const title = resultElement.querySelector(".result__title")?.textContent?.trim();
        const snippet = resultElement.querySelector(".result__snippet")?.textContent?.trim();
        console.log("Found Title:", title);
        console.log("Found Snippet:", snippet);
    } else {
        console.log("No results found in DuckDuckGo HTML.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
