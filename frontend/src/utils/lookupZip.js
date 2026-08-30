export async function lookupZip(zip) {
  const url = `https://api.zippopotam.us/us/${zip}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    return {
      city: place["place name"],
      state: place["state abbreviation"]
    };
  } catch (err) {
    console.error("ZIP lookup error:", err);
    return null;
  }
}
