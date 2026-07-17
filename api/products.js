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

          // Bättre URL-skapande
          let sysUrl = '#';
          const productNumber = p.productId || p.nr || p.articleNumber || p.productNumber;

          if (productNumber) {
            const nr = productNumber.toString().padStart(6, '0');
            
            // Slug för namn (tar bort åäö och specialtecken)
            let nameSlug = (p.productNameBold || p.name || 'produkt')
              .toLowerCase()
              .replace(/å/g, 'a')
              .replace(/ä/g, 'a')
              .replace(/ö/g, 'o')
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            const category = (p.categoryLevel1 || 'dryck')
              .toLowerCase()
              .replace(/å/g, 'a')
              .replace(/ä/g, 'a')
              .replace(/ö/g, 'o')
              .replace(/ & /g, '-')
              .replace(/ /g, '-');

            sysUrl = `https://www.systembolaget.se/produkt/${category}/${nameSlug}-${nr}`;
          } else {
            const searchName = encodeURIComponent(p.productNameBold || p.name || '');
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
            url: sysUrl
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0)
        .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 1200));
    }
  } catch (e) {
    console.error("Error:", e);
  }

  res.status(200).json([]);
}
