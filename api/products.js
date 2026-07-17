export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Försök hämta från en offentlig källa (AlexGustafsson's data repo)
    const dataRes = await fetch('https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/assortment.json');
    
    if (dataRes.ok) {
      const products = await dataRes.json();
      
      const formatted = products.map(p => {
        const volumeMl = parseInt(p.volumeInMl || p.volumeText?.replace(/\D/g,'') || 750);
        const price = parseFloat(p.price || p.priceInclVat || 0);
        const alcohol = parseFloat(p.alcoholPercentage || 0);
        
        const apk = (alcohol > 0 && price > 0) 
          ? parseFloat(((alcohol / 100 * volumeMl) / price).toFixed(3)) 
          : 0;

        return {
          productNameBold: p.productNameBold || p.name,
          productNameThin: p.productNameThin,
          alcoholPercentage: alcohol,
          volumeText: p.volumeText || `${volumeMl} ml`,
          price: price,
          categoryLevel1: p.categoryLevel1,
          apk: apk
        };
      }).filter(p => p.apk > 0)
       .sort((a, b) => b.apk - a.apk);

      return res.status(200).json(formatted.slice(0, 800));
    }
  } catch (e) {
    console.log("Kunde inte hämta från GitHub data");
  }

  // Fallback med exempeldata (så det alltid visar något)
  const fallback = [
    { productNameBold: "Melleruds Utmärkta Pilsner", alcoholPercentage: 4.5, volumeText: "330 ml", price: 19.9, categoryLevel1: "Öl", apk: 0.074 },
    { productNameBold: "Nils Oscar Kalasöl", alcoholPercentage: 5.2, volumeText: "500 ml", price: 22.9, categoryLevel1: "Öl", apk: 0.113 },
    { productNameBold: "Spendrups Premium", alcoholPercentage: 5.0, volumeText: "330 ml", price: 18.9, categoryLevel1: "Öl", apk: 0.087 },
  ];

  res.status(200).json(fallback);
}
