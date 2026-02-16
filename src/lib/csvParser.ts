import Papa from 'papaparse';
import { SalesRecord } from '@/types/sales';

export function parseCSV(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const records: SalesRecord[] = results.data.map((row: any, i: number) => {
            const productName = row['Product Name'] || row['product_name'] || row['productName'] || row['Product'] || '';
            const category = row['Category'] || row['category'] || '';
            const dateOfSale = row['Date of Sale'] || row['date_of_sale'] || row['dateOfSale'] || row['Date'] || row['date'] || '';
            const quantitySold = parseInt(row['Quantity Sold'] || row['quantity_sold'] || row['quantitySold'] || row['Quantity'] || '0', 10);
            const revenue = parseFloat(row['Revenue'] || row['revenue'] || row['Total'] || row['total'] || '0');

            if (!productName) throw new Error(`Row ${i + 1}: Missing product name`);

            return {
              id: `csv-${i}`,
              productName: productName.trim(),
              category: category.trim() || 'Uncategorized',
              dateOfSale: dateOfSale.trim(),
              quantitySold: isNaN(quantitySold) ? 0 : quantitySold,
              revenue: isNaN(revenue) ? 0 : revenue,
            };
          });

          resolve(records);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
