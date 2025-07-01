import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLoaderData, useRouteError } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../reducers/cartSlice';
import { QuantityModal } from '../../components/QwalentyModal/QwalentyModal';
import { apiService } from '../../services/api';
import s from './ProductDetail.module.css';

// Улучшенная функция нормализации данных
const normalizeProduct = (product) => {
  if (!product) return null;
  
  let images = ['/placeholder.jpg'];
  if (Array.isArray(product.images)) {
    images = product.images
      .filter(img => typeof img === 'string' && img.trim() !== '')
      .map(img => img.startsWith('http') ? img : `/uploads/${img}`);
  }

  const price = parseFloat(product.price) || 0;
  
  return {
    ...product,
    price: price.toFixed(2),
    images,
    hasColors: product.colors?.length > 0
  };
};

export async function loader({ params }) {
  try {
    console.log('Fetching product with ID:', params.id);
    const product = await apiService.products.getById(params.id);
    
    if (!product) {
      throw new Response('Товар не найден', { status: 404 });
    }
    
    return normalizeProduct(product);
  } catch (error) {
    console.error('Loader error:', error);
    throw new Response(
      error.message || 'Ошибка сервера',
      { status: error.status || 500 }
    );
  }
}

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  
  const product = normalizeProduct(useLoaderData());

  const handleAddToCart = (quantity) => {
    dispatch(addToCart({
      ...product,
      quantity,
      selectedColor: product.colors[selectedColorIndex] || ''
    }));
    setIsModalOpen(false);
  };

  if (!product) {
    return (
      <div className={s.container}>
        <p className={s.error}>Товар не найден</p>
        <button className={s.backButton} onClick={() => navigate(-1)}>
          ← Назад к каталогу
        </button>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <button className={s.backButton} onClick={() => navigate(-1)}>
        ← Назад к каталогу
      </button>
      
      <div className={s.productContainer}>
        {/* Галерея изображений */}
        <div className={s.productGallery}>
          <img 
            src={product.images[selectedColorIndex]} 
            alt={product.name} 
            className={s.mainImage}
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
              e.target.classList.add(s.imageError);
            }}
          />
          
          {product.hasColors && (
            <div className={s.colorSelector}>
              <h3>Доступные цвета:</h3>
              <div className={s.colorSwatches}>
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`${s.colorSwatch} ${selectedColorIndex === index ? s.active : ''}`}
                    style={{ 
                      backgroundColor: color,
                      border: color ? 'none' : '1px solid #ccc'
                    }}
                    onClick={() => setSelectedColorIndex(index)}
                    aria-label={`Цвет ${index + 1}`}
                    title={color || `Цвет ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Детали товара */}
        <div className={s.productDetails}>
          <h1 className={s.productTitle}>{product.name}</h1>
          
          <div className={s.productMeta}>
            {product.brand && <p><strong>Бренд:</strong> {product.brand}</p>}
            {product.series && <p><strong>Серия:</strong> {product.series}</p>}
            {product.season && <p><strong>Сезон:</strong> {product.season}</p>}
            {product.composition_percent && <p><strong>Состав:</strong> {product.composition_percent}</p>}
            {product.packQuantity && <p><strong>Количество в упаковке:</strong> {product.packQuantity} шт.</p>}
            {product.threadLength && <p><strong>Длина нити:</strong> {product.threadLength} м</p>}
            {product.weight && <p><strong>Вес:</strong> {product.weight} г</p>}
            {product.category_name && <p><strong>Категория:</strong> {product.category_name}</p>}
          </div>
          
          {product.description && (
            <div className={s.productDescription}>
              <h3>Описание</h3>
              <p>{product.description}</p>
            </div>
          )}
          
          <div className={s.productActions}>
            <p className={s.productPrice}>{product.price} ₽</p>
            <button 
              className={s.addToCartButton}
              onClick={() => setIsModalOpen(true)}
              aria-label="Добавить в корзину"
            >
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
      
      <QuantityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddToCart}
        maxQuantity={10}
        colors={product.colors}
        selectedColorIndex={selectedColorIndex}
        onColorSelect={setSelectedColorIndex}
      />
    </div>
  );
};

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  return (
    <div className={s.container}>
      <h2 className={s.errorTitle}>Ошибка</h2>
      <p className={s.errorMessage}>
        {error.status === 404 
          ? 'Товар не найден' 
          : 'Произошла ошибка при загрузке товара'}
      </p>
      <button 
        className={s.backButton} 
        onClick={() => navigate(-1)}
      >
        ← Вернуться назад
      </button>
    </div>
  );
}