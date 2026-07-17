export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
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

          // Mer specifik sökning
          const fullName = (p.productNameBold || p.name || p.productName || '').trim();
          const searchTerm = encodeURIComponent(fullName);
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
    console.error(e);
  }

  res.status(200).json([]);
}
