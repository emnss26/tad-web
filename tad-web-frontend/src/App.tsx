import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import HomePage from '@/pages/HomePage';
// import SolutionsPage from '@/pages/modules/SolutionsPage'; // Lo descomentaremos cuando creemos el archivo

function App() {
  return (
    <Routes>
      {/* Rutas Públicas:
        Están envueltas en 'PublicLayout', por lo que tendrán Header y Footer automáticamente.
      */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        
        {/* Placeholders temporales para probar la navegación */}
        <Route path="/solutions" element={<div className="p-20 text-center">Solutions Module (Coming Soon)</div>} />
        <Route path="/about" element={<div className="p-20 text-center">About Us Page (Coming Soon)</div>} />
        <Route path="/contact" element={<div className="p-20 text-center">Contact Page (Coming Soon)</div>} />
      </Route>

      {/* Rutas Independientes:
        El Login usualmente no lleva el Header/Footer principal.
      */}
      <Route path="/login" element={<div className="flex h-screen items-center justify-center">Login Page Placeholder</div>} />
      
      {/* Ruta 404 */}
      <Route path="*" element={<div className="p-20 text-center text-red-500">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;