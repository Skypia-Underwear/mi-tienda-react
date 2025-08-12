import { useState, useEffect, useCallback } from 'react';
// import Swal from 'sweetalert2';
// import Fancybox from '@fancyapps/ui/dist/fancybox/fancybox.umd';

// Se asume que Tailwind CSS está disponible globalmente a través del CDN.
// Se asume que Font Awesome está disponible a través de un CDN.

// Se usa la URL de la API de Apps Script para registrar ventas
const API_URL = "https://script.google.com/macros/s/AKfycbzhEAEYVA23jaWlN5XgjlsrbiA6yK1quYf9NAuKOevD52w-6NqyfiFGUTDL9pjOKljzkA/exec";
const DONWEB_JSON_URL = "https://castfer.com.ar/configuracion_json.php";

// Mock para SweetAlert2 si no está disponible
const Swal = {
  fire: (options) => {
    window.alert(options.title + (options.text ? '\n\n' + options.text : ''));
  },
  mixin: ({ toast, position, showConfirmButton, timer }) => {
    return Swal;
  }
};

// Fancybox Mock para el entorno de Canvas
const Fancybox = {
  bind: (selector, options) => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const imgSrc = el.href;
        window.open(imgSrc, '_blank');
      });
    });
  },
};

const formatMoneda = (valor, simbolo) => {
  const symbolMap = { "$": "ARS", "USD": "USD" };
  const currencyCode = symbolMap[simbolo] || "ARS";
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 }).format(parseFloat(valor));
};

const getContrastingTextColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return '#000000';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? '#000000' : '#FFFFFF';
};

const getTemporadaIcono = (valor) => {
  return valor === "INVIERNO" ? "❄️" : valor === "VERANO" ? "☀️" : "🚫";
};

const getGeneroIcono = (valor) => {
  return valor === "Hombre" ? "♂️" : valor === "Mujer" ? "♀️" : "⚧";
};

const Loader = () => (
  <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-[9999]">
    <div className="flex space-x-4 mb-8">
      <div className="relative w-12 h-12 rounded-full animate-bounce bg-blue-500"></div>
      <div className="relative w-12 h-12 rounded-full animate-bounce bg-green-500 animation-delay-200"></div>
      <div className="relative w-12 h-12 rounded-full animate-bounce bg-red-500 animation-delay-400"></div>
    </div>
    <p className="text-xl font-bold text-gray-700">Cargando...</p>
  </div>
);

const WhatsAppButton = ({ phoneNumber, message }) => (
  <a
    href={`https://wa.me/549${phoneNumber}?text=${encodeURIComponent(message)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-colors z-50"
    aria-label="Contactar por WhatsApp"
  >
    <i className="fa fa-whatsapp text-2xl"></i>
  </a>
);

// Componente para la página principal
const HomePage = ({ config, onCategoryClick }) => (
  <div className="container mx-auto p-4">
    <header className="text-center mb-8">
      <img src={config.pagina_tienda.logo_url} alt="Tienda Logo" className="mx-auto w-32 h-auto" />
      <h1 className="text-4xl font-bold mt-4 text-gray-800">{config.pagina_tienda.tienda_id}</h1>
      <p className="text-lg text-gray-600 mt-2">{config.pagina_tienda.descripcion}</p>
    </header>
    <div className="grid md:grid-cols-2 gap-4">
      {config.content.map(category => (
        <div
          key={category.codigo}
          className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => onCategoryClick(category)}
        >
          <div dangerouslySetInnerHTML={{ __html: category.icono }} className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center text-gray-800">{category.nombre}</h2>
        </div>
      ))}
    </div>
  </div>
);

// Componente para la página de categoría
const CategoryPage = ({ category, onProductClick, onGoHome }) => {
  if (!category) return null;
  return (
    <div className="container mx-auto p-4">
      <button onClick={onGoHome} className="mb-4 text-blue-500 hover:underline">
        &larr; Volver a Categorías
      </button>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{category.nombre}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.producto.map(product => (
          <div
            key={product.codigo}
            className="bg-white p-4 rounded-lg shadow-lg flex flex-col justify-between"
          >
            {product.imagen[0]?.url && (
              <img
                src={product.imagen[0].url}
                alt={product.nombre}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => e.target.src = "https://placehold.co/400x300"}
              />
            )}
            <h3 className="text-xl font-semibold text-gray-800">{product.nombre}</h3>
            <p className="text-sm text-gray-500 mt-1">{product.descripcion.modelo?.valor}</p>
            
            {/* Carrusel de variedades de precios */}
            <div className="flex flex-row overflow-x-auto mt-2 space-x-2">
                {product.variedad.map((variety, index) => (
                    <button 
                        key={index}
                        onClick={() => onProductClick(product, category)}
                        className="flex-shrink-0 bg-green-500 text-white text-sm py-2 px-4 rounded-md font-bold hover:bg-green-600 transition-colors"
                    >
                        {variety.variedad} ({formatMoneda(variety.precio, variety.moneda)})
                    </button>
                ))}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para la página de producto
const ProductPage = ({ product, category, onGoBackToCategory, onAddToCart }) => {
  if (!product) return null;

  const [selectedVariety, setSelectedVariety] = useState(product.variedad[0]);
  const [selectedSubVarietyName, setSelectedSubVarietyName] = useState(Object.keys(product.variedad[0].sub_variedad)[0]);
  const [selectedTalle, setSelectedTalle] = useState(product.variedad[0].sub_variedad[Object.keys(product.variedad[0].sub_variedad)[0]]?.talles[0] || null);
  const [quantity, setQuantity] = useState(selectedVariety.minima);
  const [mainImage, setMainImage] = useState(product.imagen.find(img => img.portada)?.url || product.imagen[0]?.url);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  useEffect(() => {
    // Si la imagen principal actual no está en la lista de imágenes, se selecciona la primera
    if (!product.imagen.some(img => (img.url || img.thumbnail) === mainImage)) {
        setMainImage(product.imagen.find(img => img.portada)?.url || product.imagen[0]?.url);
        setMainImageIndex(product.imagen.findIndex(img => img.portada) !== -1 ? product.imagen.findIndex(img => img.portada) : 0);
    }
  }, [product, mainImage]);

  const handleVarietyChange = (variety) => {
    setSelectedVariety(variety);
    const firstSubVarietyName = Object.keys(variety.sub_variedad)[0];
    setSelectedSubVarietyName(firstSubVarietyName);
    setSelectedTalle(variety.sub_variedad[firstSubVarietyName]?.talles[0] || null);
    setQuantity(variety.minima);
  };
  
  const handleSubVarietyChange = (subVarietyName) => {
    setSelectedSubVarietyName(subVarietyName);
    setSelectedTalle(selectedVariety.sub_variedad[subVarietyName]?.talles[0] || null);
  };

  const handleTalleChange = (talle) => {
    setSelectedTalle(talle);
  };

  const currentSubVariety = selectedVariety.sub_variedad[selectedSubVarietyName];
  const currentStock = selectedTalle?.stock ? parseInt(selectedTalle.stock) : (currentSubVariety?.talles?.[0]?.stock ? parseInt(currentSubVariety.talles[0].stock) : 99999);
  const isSurtido = currentSubVariety?.nombre?.toLowerCase()?.includes("surtido");
  
  const renderDescription = (description) => {
    if (!description || typeof description !== "object") return null;

    return (
      <ul className="mt-2 text-gray-700">
        <li className="flex items-center space-x-2"><span className="font-semibold">Modelo:</span> {description.modelo?.valor}</li>
        <li className="flex items-center space-x-2"><span className="font-semibold">Estilo:</span> {description.estilo?.valor}</li>
        <li className="flex items-center space-x-2"><span className="font-semibold">Material:</span> {description.material?.valor}</li>
        <li className="flex items-center space-x-2"><span className="font-semibold">Temporada:</span> {description.temporada?.valor} {getTemporadaIcono(description.temporada?.valor)}</li>
        <li className="flex items-center space-x-2"><span className="font-semibold">Género:</span> {description.genero?.valor} {getGeneroIcono(description.genero?.valor)}</li>
        <li className="flex items-center space-x-2"><span className="font-semibold">Actualizado:</span> {new Date(product.upd).toLocaleDateString()}</li>
      </ul>
    );
  };

  const handleConsultarWhatsApp = () => {
    const whatsappData = product.descripcion.whatsapp;
    if (whatsappData) {
      window.open(whatsappData.url, '_blank');
    }
  };

  const currentPrice = selectedVariety.precio * quantity;
  const isVideoPresent = product.descripcion?.video?.url;

  const handleThumbnailClick = (img, index) => {
    setMainImage(img.url || img.thumbnail);
    setMainImageIndex(index);
  };

  const handleNextImage = () => {
    const nextIndex = (mainImageIndex + 1) % product.imagen.length;
    setMainImageIndex(nextIndex);
    setMainImage(product.imagen[nextIndex].url || product.imagen[nextIndex].thumbnail);
  };
  
  const handlePrevImage = () => {
    const prevIndex = (mainImageIndex - 1 + product.imagen.length) % product.imagen.length;
    setMainImageIndex(prevIndex);
    setMainImage(product.imagen[prevIndex].url || product.imagen[prevIndex].thumbnail);
  };

  return (
    <div className="container mx-auto p-4">
      <button onClick={onGoBackToCategory} className="mb-4 text-blue-500 hover:underline">
        &larr; Volver a {category.nombre}
      </button>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2 relative">
            <div className="relative">
              <a href={mainImage} data-fancybox="gallery">
                <img
                  src={mainImage}
                  alt={product.nombre}
                  className="w-full h-auto object-cover rounded-md cursor-pointer"
                  onError={(e) => e.target.src = "https://placehold.co/600x450"}
                />
              </a>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors"
              >
                <i className="fa fa-chevron-left"></i>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors"
              >
                <i className="fa fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="flex flex-row overflow-x-auto mt-4 space-x-2">
              {product.imagen.map((img, index) => (
                <div key={index} className="relative flex-shrink-0 w-24">
                  {img.tipo_archivo === "imagen" ? (
                    <img
                      src={img.url}
                      alt={`${product.nombre} ${index}`}
                      className="w-full h-auto object-cover rounded-md cursor-pointer hover:border-2 hover:border-blue-500 transition-colors"
                      onClick={() => handleThumbnailClick(img, index)}
                    />
                  ) : (
                    <div className="relative">
                      <a href={img.url} data-fancybox="gallery">
                        <img
                          src={img.thumbnail}
                          alt={`Video thumbnail for ${product.nombre}`}
                          className="w-full h-auto object-cover rounded-md cursor-pointer hover:border-2 hover:border-blue-500 transition-colors"
                          onClick={() => handleThumbnailClick(img, index)}
                        />
                      </a>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-md cursor-pointer">
                        <i className="fa fa-play-circle text-3xl"></i>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.nombre}</h1>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatMoneda(currentPrice, selectedVariety.moneda)}
            </p>
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800">Descripción</h3>
              {renderDescription(product.descripcion)}
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Variedades</h3>
              <div className="mt-2 space-y-2">
                {product.variedad.map((variety, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${selectedVariety.variedad === variety.variedad ? 'bg-blue-100 border border-blue-500' : 'bg-gray-100'}`}
                    onClick={() => handleVarietyChange(variety)}
                  >
                    <div>
                      <p className="font-bold">{variety.variedad} (x{variety.minima})</p>
                      <p className="text-sm text-gray-600">
                        {formatMoneda(variety.precio * variety.minima, variety.moneda)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedVariety && Object.keys(selectedVariety.sub_variedad).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800">Colores y Talles</h3>
                  <div className="mt-2 space-y-4">
                      {Object.entries(selectedVariety.sub_variedad).map(([subVarietyName, subVarietyDetails]) => (
                          <div key={subVarietyName}>
                              <h4 className="font-medium text-gray-700">{subVarietyName}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {subVarietyDetails.talles.map((talle, talleIndex) => (
                                      <button
                                          key={talleIndex}
                                          className={`btn py-2 px-4 rounded-md ${selectedTalle?.talle === talle.talle && selectedSubVarietyName === subVarietyName ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                          onClick={() => {
                                              setSelectedSubVarietyName(subVarietyName);
                                              setSelectedTalle(talle);
                                          }}
                                          disabled={parseInt(talle.stock) <= 0}
                                      >
                                          {talle.talle} ({talle.stock})
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
            )}


            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Cantidad</h3>
              <div className="mt-2 flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(selectedVariety.minima, quantity - selectedVariety.minima))}
                  className="bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  -
                </button>
                <span className="text-xl font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + selectedVariety.minima))}
                  className="bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  disabled={quantity + selectedVariety.minima > currentStock}
                >
                  +
                </button>
              </div>
              {currentStock !== 99999 && (
                <p className="text-sm mt-2 text-gray-500">
                  Stock disponible: {currentStock} unidades
                </p>
              )}
            </div>
            <button
              onClick={() => onAddToCart(product, { ...selectedVariety, quantity })}
              className="mt-6 w-full bg-green-500 text-white py-3 px-4 rounded-md font-bold hover:bg-green-600 transition-colors"
            >
              Añadir {quantity} al Carrito
            </button>
            {product.descripcion.whatsapp?.telefono && (
              <button
                onClick={handleConsultarWhatsApp}
                className="mt-4 w-full bg-blue-500 text-white py-3 px-4 rounded-md font-bold hover:bg-blue-600 transition-colors"
              >
                Consultar por WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  
const App = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const calculateTotals = useCallback(() => {
    if (!config || cart.length === 0) return { subtotal: 0, total: 0 };
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += parseFloat(item.variety.precio) * item.quantity;
    });
    const total = subtotal;
    return { subtotal, total };
  }, [cart, config]);

  const { total } = calculateTotals();

  // Función para manejar llamadas a tu Apps Script
  const makeApiCall = useCallback(async (data) => {
    const url = `${API_URL}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }, []);

  const handleFinalizeOrder = async () => {
    if (cart.length === 0) {
      Swal.fire('Carrito vacío', 'Por favor, añade productos al carrito.', 'warning');
      return;
    }
    const orderData = {
      op: 'venta',
      detalle: cart.map(item => ({
        codigo: item.product.codigo,
        nombre: `${item.product.nombre} (${item.variety.variedad})`,
        variante: item.variety.variedad,
        cantidad: item.quantity,
        precio: item.variety.precio,
        moneda: item.variety.moneda,
        minima: item.variety.minima,
      })),
      total: total,
      url: window.location.href,
    };

    try {
      const response = await makeApiCall(orderData);
      if (response.status === '0') {
        Swal.fire('Pedido enviado', response.message, 'success');
        if (response.message_whatsapp) {
          window.open(`https://wa.me/549${config.contactabilidad}?text=${encodeURIComponent(response.message_whatsapp)}`, '_blank');
        }
        setCart([]);
        setShowCart(false);
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al procesar tu pedido.', 'error');
    }
  };

  // Lógica de carga de configuración con fallback
  useEffect(() => {
    const fetchAndSetConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch('/configuracion_sitio.json');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Error al cargar configuracion_sitio.json:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error de configuración',
          text: 'No se pudo cargar el archivo de configuración de la tienda. Por favor, asegúrese de que el archivo existe en la carpeta `public`.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetConfig();
  }, []);

  const handleProductClick = useCallback((product, category) => {
    setSelectedProduct(product);
    setSelectedCategory(category);
    setPage('product');
  }, []);

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
    setPage('category');
  }, []);

  const handleGoHome = useCallback(() => {
    setPage('home');
    setSelectedCategory(null);
    setSelectedProduct(null);
  }, []);

  const handleGoBackToCategory = useCallback(() => {
    setPage('category');
    setSelectedProduct(null);
  }, []);

  const onAddToCart = useCallback((product, variety) => {
    const existingItemIndex = cart.findIndex(
      (item) => item.product.codigo === product.codigo && item.variety.variedad === variety.variedad
    );
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += variety.quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, variety, quantity: variety.quantity }]);
    }
    Swal.fire({
      icon: 'success',
      title: 'Producto añadido',
      text: `${product.nombre} (${variety.variedad}) se ha añadido al carrito.`,
      toast: true,
      position: 'top-end',
      timer: 3000
    });
  }, [cart]);

  const updateCartQuantity = useCallback((index, quantity) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity = Math.max(1, quantity);
    setCart(updatedCart);
  }, [cart]);

  const removeFromCart = useCallback((index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  }, [cart]);

  const renderPage = () => {
    if (!config) return null;
    switch(page) {
      case 'home':
        return <HomePage config={config} onCategoryClick={handleCategoryClick} />;
      case 'category':
        return <CategoryPage category={selectedCategory} onProductClick={handleProductClick} onGoHome={handleGoHome} />;
      case 'product':
        return <ProductPage product={selectedProduct} category={selectedCategory} onGoBackToCategory={handleGoBackToCategory} onAddToCart={onAddToCart} />;
      default:
        return <HomePage config={config} onCategoryClick={handleCategoryClick} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 font-sans antialiased">
      {loading && <Loader />}
      
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-gray-900">
          <button onClick={handleGoHome}>CASTFER</button>
        </h1>
        <div className="flex space-x-4 items-center">
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            <i className="fa fa-shopping-cart text-lg"></i>
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 block h-4 w-4 rounded-full text-xs text-white bg-red-500 leading-tight">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>
      <main className="pt-20">
        {renderPage()}
      </main>
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-gray-800 text-white p-4 shadow-xl transform ${showCart ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Carrito ({cart.length})</h2>
          <button onClick={() => setShowCart(false)} className="text-white text-2xl">&times;</button>
        </div>
        <ul className="space-y-4 overflow-y-auto max-h-[80vh]">
          {cart.length === 0 ? (
            <p className="text-gray-400">El carrito está vacío.</p>
          ) : (
            cart.map((item, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                <div>
                  <p className="font-semibold">{item.product.nombre} ({item.variety.variedad})</p>
                  <p className="text-sm text-gray-400">Cantidad: {item.quantity}</p>
                  <p className="text-lg font-bold text-red-400">{formatMoneda(item.variety.precio * item.quantity, item.variety.moneda)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateCartQuantity(index, item.quantity + 1)}
                    className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600"
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateCartQuantity(index, item.quantity - 1)}
                    className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    -
                  </button>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-800"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
        {cart.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4">
              <span>Total:</span>
              <span>{formatMoneda(total, '$')}</span>
            </div>
            <button
              onClick={handleFinalizeOrder}
              className="w-full bg-green-500 text-white py-3 rounded-md font-bold hover:bg-green-600 transition-colors"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
      {config?.contactabilidad && <WhatsAppButton phoneNumber={config.contactabilidad} message="Hola, estoy interesado en un pedido." />}
    </div>
  );
};
export default App;
