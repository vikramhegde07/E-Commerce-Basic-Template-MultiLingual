import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css'
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LoadingAnimation from './components/Common/LoadingAnimation';
import AppSidebar from './components/Common/AppSidebar';
import TopNavbar from './components/Common/TopNavbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Categories from './pages/CategoriesList';
import ProductDetails from './pages/product/ProductDetails';
import ProductList from './pages/product/ProductList';
import Inquiry from './pages/Inquiry';
import ProductPreview from './pages/product/ProductPreview';
import Banners from './pages/Banners';
// import MaterialPreview from './pages/Material/MaterialPreview';
// import MaterialDetails from './pages/Material/MaterialDetails';
// import MaterialsList from './pages/Material/MaterialsList';

function App() {
  const { user, userToken, loading } = useAuth();
  const navigator = useNavigate();
  const excludedRoutes = ["/login"];

  useEffect(() => {
    if (loading) return;

    if (!user || !userToken) {
      navigator('/login');
    }

  }, [user, userToken, loading])

  const isLoggedIn = !loading && userToken && user;
  const location = useLocation();
  const showLayout = isLoggedIn && !excludedRoutes.includes(location.pathname);

  return (
    <>
      <div className="flex h-screen overflow-y-auto">
        {showLayout && <AppSidebar />}
        <main className="flex-1 bg-muted overflow-y-auto">
          {showLayout && <TopNavbar />}
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/' element={<Home />} />
            <Route path='/users' element={<Users />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/categories' element={<Categories />} />
            <Route path='/products' element={<ProductList />} />
            <Route path='/product/:slug' element={<ProductDetails />} />
            <Route path='/product/:slug/preview' element={<ProductPreview />} />
            <Route path='/inquiries' element={<Inquiry />} />
            <Route path='/banners' element={<Banners />} />
            {/* <Route path='/materials' element={<MaterialsList />} />
            <Route path='/materials/:slug' element={<MaterialDetails />} />
            <Route path='/materials/:slug/preview' element={<MaterialPreview />} /> */}
          </Routes>
        </main>
      </div>
      <LoadingAnimation />
      <Toaster reverseOrder={false} position='bottom-right' />
    </>
  )
}

export default App
