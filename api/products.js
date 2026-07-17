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

          // Bättre sökning: Produkt + Tillverkare
          let searchQuery = p.productNameBold || p.name || p.productName || '';
          if (p.producer || p.manufacturer) {
            searchQuery += ' ' + (p.producer || p.manufacturer);
          }

          const searchTerm = encodeURIComponent(searchQuery.trim());
          const sysUrl = `https://www.systembolaget.se/sortiment/?q=${searchTerm}`;

          // Fixa prisvisning (12.9 → 12,90)
          const displayPrice = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2).replace('.', ',');

          return {
            productNameBold: p.productNameBold || p.name || p.productName,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,
            price: displayPrice,
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
