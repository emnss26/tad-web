import { Outlet } from 'react-router-dom';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased">
      <Header />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};