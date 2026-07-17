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

          // Använd artikelnummer för bättre länk
          const articleNo = p.articleNumber || p.nr || p.productId || p.productNumber;
          let sysUrl = "https://www.systembolaget.se/sortiment/";

          if (articleNo) {
            sysUrl = `https://www.systembolaget.se/produkt/${articleNo.toString().padStart(6, '0')}`;
          } else {
            const searchTerm = encodeURIComponent(p.productNameBold || p.name || '');
            sysUrl = `https://www.systembolaget.se/sortiment/?q=${searchTerm}`;
          }

          return {
            productNameBold: p.productNameBold || p.name,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,
            price: price.toFixed(2).replace('.', ','),
            categoryLevel1: p.categoryLevel1,
            apk: apk,
            url: sysUrl
            articleNumber: p.articleNumber || p.nr || p.productId,
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0)
        .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 1000));
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback
  res.status(200).json([]);
}
