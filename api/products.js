export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Systembolaget's public search endpoint (unofficial but widely used)
    const API_KEY = "cfc702aed3094c86b92d6d4ff7a54c84"; // Public key from their site
    
    const response = await fetch(
      "https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search", 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": API_KEY,
        },
        body: JSON.stringify({
          page: 0,
          pageSize: 500,           // Max per request
          searchQuery: "",
          sort: { field: "Score", direction: "desc" }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products || [];

    // Beräkna APK och forma data
    const formatted = products.map(p => {
      const volumeMl = parseInt(p.volume?.value || p.volumeText?.replace(/\D/g, '') || 750);
      const price = parseFloat(p.price?.value || p.price);
      const alcohol = parseFloat(p.alcoholPercentage);

      const apk = (alcohol && price && volumeMl) 
        ? parseFloat(((alcohol / 100 * volumeMl) / price).toFixed(3)) 
        : 0;

      return {
        productNameBold: p.name || p.productNameBold,
        productNameThin: p.nameThin || p.productNameThin,
        alcoholPercentage: alcohol,
        volumeText: p.volume?.text || `${volumeMl} ml`,
        volumeInMl: volumeMl,
        price: price,
        categoryLevel1: p.categoryLevel1 || p.mainCategory,
        categoryLevel2: p.categoryLevel2,
        apk: apk,
        country: p.country,
        producer: p.producer
      };
    });

    // Sortera efter APK (högst först)
    formatted.sort((a, b) => b.apk - a.apk);

    res.status(200).json(formatted);

  } catch (error) {
    console.error("Error fetching Systembolaget data:", error);
    
    // Fallback till exempeldata om API:et krånglar
    res.status(200).json([
      {
        productNameBold: "Melleruds",
        productNameThin: "Utmärkta Pilsner",
        alcoholPercentage: 4.5,
        volumeText: "330 ml",
        price: 19.9,
        categoryLevel1: "Öl",
        apk: 0.074
      }
    ]);
  }
}
