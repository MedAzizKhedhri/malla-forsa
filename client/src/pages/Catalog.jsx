import { useState, useEffect } from 'react';
import api from '../lib/api';
import { ShoppingBag, Loader2, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('malla_token');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
              Catalog Malla Forssa
            </h1>
          </div>
          {token ? (
            <Link
              to="/"
              className="text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Retour Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Espace Admin
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-black tracking-tight">Articles Disponibles</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Découvrez nos articles importés favoris. Contactez-nous pour passer commande directement.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm py-16 text-center text-slate-500 max-w-md mx-auto">
            Aucun article dans le catalogue public pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow group relative"
              >
                {product.images && product.images.length > 0 ? (
                  <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-150 dark:border-slate-800">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-b border-slate-150 dark:border-slate-800">
                    <ShoppingBag size={32} />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-lg mt-2 group-hover:text-indigo-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <div className="text-xl font-black text-slate-850 dark:text-slate-150">
                      {product.price} TND
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        product.availability_status === 'In Stock'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      }`}
                    >
                      {product.availability_status === 'In Stock' ? 'Disponible' : 'Rupture'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
