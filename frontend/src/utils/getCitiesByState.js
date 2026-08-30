export async function getCitiesByState(stateCode) {
  const url = `https://api.zippopotam.us/us/${stateCode.toLowerCase()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    if (!data.places) return [];

    const cities = [...new Set(data.places.map(p => p["place name"]))];

    return cities.sort();
  } catch (err) {
    console.error("City lookup error:", err);
    return [];
  }
}

