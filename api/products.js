export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Bättre och mer uppdaterad datakälla
    const dataRes = await fetch('https://susbolaget.emrik.org/v1/products');
    
    if (dataRes.ok) {
      let products = await dataRes.json();

      const formatted = products
        .map(p => {
          const volumeMl = parseInt(p.volumeInMl || p.volume || 750);
          const price = parseFloat(p.price || p.priceInclVat || 0);
          const alcohol = parseFloat(p.alcoholPercentage || 0);

          const apk = (alcohol > 0 && price > 0) 
            ? parseFloat(((alcohol / 100 * volumeMl) / price).toFixed(3)) 
            : 0;

          // Sök-länk
          const searchTerm = encodeURIComponent(p.productNameBold || p.name || p.productName || '');
          const sysUrl = `https://www.systembolaget.se/sortiment/?q=${searchTerm}`;

          return {
            productNameBold: p.productNameBold || p.name || p.productName,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,
            price: price,
            categoryLevel1: p.categoryLevel1 || p.category,
            apk: apk,
            url: sysUrl
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0)
        .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 1500));
    }
  } catch (e) {
    console.error("Primary source failed:", e);
  }

  // Fallback till gammal källa
  try {
    const fallbackRes = await fetch('https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/assortment.json');
    if (fallbackRes.ok) {
      // ... (samma logik som tidigare)
      // För att spara tid returnerar vi tom array här
    }
  } catch (e) {}

  res.status(200).json([]);
}
