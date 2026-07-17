export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Fallback-data så det alltid finns något
  const fallbackProducts = [
    {
      productNameBold: "Melleruds",
      productNameThin: "Utmärkta Pilsner",
      alcoholPercentage: 4.5,
      volumeText: "330 ml",
      price: "19,90",
      categoryLevel1: "Öl",
      apk: 0.074,
      url: "https://www.systembolaget.se/sortiment/?q=Melleruds"
    },
    {
      productNameBold: "Nils Oscar",
      productNameThin: "Brukslager",
      alcoholPercentage: 7.3,
      volumeText: "330 ml",
      price: "25,90",
      categoryLevel1: "Öl",
      apk: 0.093,
      url: "https://www.systembolaget.se/sortiment/?q=Brukslager"
    },
    {
      productNameBold: "Spendrups",
      productNameThin: "Premium",
      alcoholPercentage: 5.0,
      volumeText: "330 ml",
      price: "18,90",
      categoryLevel1: "Öl",
      apk: 0.087,
      url: "https://www.systembolaget.se/sortiment/?q=Spendrups"
    }
  ];

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

          const searchTerm = encodeURIComponent(p.productNameBold || p.name || '');
          const sysUrl = `https://www.systembolaget.se/sortiment/?q=${searchTerm}`;

          return {
            productNameBold: p.productNameBold || p.name,
            productNameThin: p.productNameThin,
            alcoholPercentage: alcohol,
            volumeText: `${volumeMl} ml`,
            price: price.toFixed(2).replace('.', ','),
            categoryLevel1: p.categoryLevel1,
            apk: apk,
            url: sysUrl
          };
        })
        .filter(p => p.price > 0 && p.alcoholPercentage > 0)
        .sort((a, b) => b.apk - a.apk);

      if (formatted.length > 10) {
        return res.status(200).json(formatted.slice(0, 1000));
      }
    }
  } catch (e) {
    console.error("Live fetch failed, using fallback");
  }

  // Return fallback if live data fails
  res.status(200).json(fallbackProducts);
}
