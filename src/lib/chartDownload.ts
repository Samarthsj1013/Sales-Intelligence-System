import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export async function downloadChartAsImage(chartRef: HTMLDivElement | null, filename: string = 'chart') {
  if (!chartRef) { toast.error('Chart not found'); return; }
  try {
    const canvas = await html2canvas(chartRef, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Chart downloaded');
  } catch {
    toast.error('Failed to download chart');
  }
}
