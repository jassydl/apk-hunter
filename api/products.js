export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const API_KEY = "cfc702aed3094c86b92d6d4ff7a54c84";
    let allProducts = [];
    const maxPages = 5; // Öka till 8-10 om du vill ha ännu fler

    for (let page = 0; page < maxPages; page++) {
      const response = await fetch(
        "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": API_KEY,
          },
          body: JSON.stringify({
            page: page,
            pageSize: 100,
            searchQuery: "",
            sort: { field: "Score", direction: "desc" }
          })
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data.products && data.products.length > 0) {
        allProducts = allProducts.concat(data.products);
      } else {
        break; // Ingen mer data
      }
    }

    // Formatera och beräkna APK
    const formatted = allProducts.map(p => {
      const volumeMl = parseInt(p.volume?.value || 
                           p.volumeText?.replace(/\D/g, '') || 750);
      const price = parseFloat(p.price?.value || p.price || 0);
      const alcohol = parseFloat(p.alcoholPercentage || 0);

      const apk = (alcohol > 0 && price > 0 && volumeMl > 0) 
        ? parseFloat(((alcohol / 100 * volumeMl) / price).toFixed(3)) 
        : 0;

      return {
        productNameBold: p.name || p.productNameBold,
        productNameThin: p.nameThin || p.productNameThin,
        alcoholPercentage: alcohol,
        volumeText: p.volume?.text || `${volumeMl} ml`,
        volumeInMl: volumeMl,
        price: price,
        categoryLevel1: p.categoryLevel1 || p.mainCategory?.name,
        categoryLevel2: p.categoryLevel2,
        apk: apk,
        country: p.country,
        producer: p.producer
      };
    }).filter(p => p.price > 0 && p.alcoholPercentage > 0);

    // Sortera efter APK
    formatted.sort((a, b) => b.apk - a.apk);

    res.status(200).json(formatted.slice(0, 1000)); // Begränsa för prestanda

  } catch (error) {
    console.error(error);
    res.status(200).json([{
      productNameBold: "Fel vid hämtning",
      apk: 0
    }]);
  }
}
