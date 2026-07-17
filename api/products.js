export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const dataRes = await fetch('https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/assortment.json');
    
    if (dataRes.ok) {
      let products = await dataRes.json();

      const formatted = products
        .map(p => {
          const volumeMl = parseInt(p.volumeInMl || 750);
          const price = parseFloat(p.price || p.priceInclVat || 0);
          const alcohol = parseFloat(p.alcoholPercentage || 0);

          const apk = (alcohol > 0 && price > 0) 
            ? parseFloat(((alcohol / 100 * volumeMl) / price).toFixed(3)) 
            : 0;

          // Skapa länk till Systembolaget
          const productId = p.productId || p.nr || p.articleNumber;
          const sysUrl = productId ? `https://www.systembolaget.se/produkt/${productId.toString().padStart(6, '0')}` : '#';

          return {
            productNameBold: p.productNameBold || p.name,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,           // Standardisera volym
            price: price,
            categoryLevel1: p.categoryLevel1,
            apk: apk,
            url: sysUrl,
            country: p.country
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0 && p.volumeText.includes("ml"))
        .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 1200));
    }
  } catch (e) {}

  // Fallback
  res.status(200).json([]);
}
