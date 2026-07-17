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

          // Bättre länk till Systembolaget
          const productNumber = p.productId || p.nr || p.articleNumber || p.productNumber;
          let sysUrl = '#';

          if (productNumber) {
            const nr = productNumber.toString().padStart(6, '0');
            sysUrl = `https://www.systembolaget.se/produkt/${nr.substring(0,3)}/${nr.substring(3)}`;
          } else if (p.productNameBold || p.name) {
            const searchName = encodeURIComponent((p.productNameBold || p.name).replace(/ /g, '+'));
            sysUrl = `https://www.systembolaget.se/sok/?text=${searchName}`;
          }

          return {
            productNameBold: p.productNameBold || p.name,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,
            price: price,
            categoryLevel1: p.categoryLevel1,
            apk: apk,
            url: sysUrl,
            country: p.country
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0)
        .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 1200));
    }
  } catch (e) {
    console.error("Fetch error:", e);
  }

  // Fallback
  res.status(200).json([]);
}
