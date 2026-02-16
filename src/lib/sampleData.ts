import { SalesRecord } from '@/types/sales';

const PRODUCTS = [
  { name: 'Wireless Headphones', category: 'Electronics' },
  { name: 'Organic Coffee Beans', category: 'Grocery' },
  { name: 'Running Shoes', category: 'Sportswear' },
  { name: 'Vitamin D Supplement', category: 'Pharmacy' },
  { name: 'Bluetooth Speaker', category: 'Electronics' },
  { name: 'Protein Bar Pack', category: 'Grocery' },
  { name: 'Yoga Mat', category: 'Sportswear' },
  { name: 'Face Moisturizer', category: 'Beauty' },
  { name: 'LED Desk Lamp', category: 'Electronics' },
  { name: 'Green Tea Box', category: 'Grocery' },
  { name: 'Resistance Bands', category: 'Sportswear' },
  { name: 'Pain Relief Gel', category: 'Pharmacy' },
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSampleData(): SalesRecord[] {
  const records: SalesRecord[] = [];
  const now = new Date();

  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().slice(0, 10);

    const productsToday = PRODUCTS.filter(() => Math.random() > 0.3);
    productsToday.forEach((product, idx) => {
      const baseQty = product.category === 'Electronics' ? 5 : 15;
      // Add some trending: first few products grow over time
      const trendMultiplier = idx < 3 ? 1 + (90 - dayOffset) * 0.005 : idx > 9 ? 1 - (90 - dayOffset) * 0.003 : 1;
      // Weekend boost
      const dayOfWeek = date.getDay();
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 1;

      const quantity = Math.max(1, Math.round(randomBetween(baseQty - 3, baseQty + 8) * trendMultiplier * weekendBoost));
      const unitPrice = product.category === 'Electronics' ? randomBetween(30, 120) : randomBetween(5, 35);
      const revenue = quantity * unitPrice;

      records.push({
        id: `${dateStr}-${idx}`,
        productName: product.name,
        category: product.category,
        dateOfSale: dateStr,
        quantitySold: quantity,
        revenue,
      });
    });
  }

  return records;
}
