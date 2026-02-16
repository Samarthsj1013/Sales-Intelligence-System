import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SalesProvider } from "@/context/SalesContext";
import AppSidebar from "@/components/AppSidebar";
import Index from "./pages/Index";
import UploadPage from "./pages/UploadPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProductsPage from "./pages/ProductsPage";
import AISummaryPage from "./pages/AISummaryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SalesProvider>
        <BrowserRouter>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-64 p-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/ai-summary" element={<AISummaryPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SalesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
