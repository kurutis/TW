import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { addToCart } from '../../reducers/cartSlice';
import { selectIsAuthenticated } from '../../actions/authSelectors';
import { showAuthModal } from '../../actions/modalActions';
import { QuantityModal } from '../../components/QwalentyModal/QwalentyModal';
import s from './ProductDetail.module.css';
import { apiService } from '../../services/api';


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных товара
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await apiService.products.getById(id);
        setProduct({
          ...data,
          price: (parseFloat(data.price) || 0).toFixed(2),
          images: Array.isArray(data.images) ? data.images : ['/placeholder.jpg']
        });
      } catch (err) {
        setError(err.message || 'Не удалось загрузить товар');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCartClick = () => {
    if (!isAuthenticated) {
      dispatch(showAuthModal({
        message: 'Для добавления товара в корзину требуется авторизация'
      }));
      return;
    }
    setIsModalOpen(true);
  };

   const handleAddToCart = async (quantity, selectedColor) => {
  try {
    const result = await dispatch(addToCart({
      productId: product.id,
      quantity,
      color: selectedColor,
    })).unwrap();
    
    return result;
  } catch (error) {
    if (error?.status === 401) {
      throw {
        ...error,
        message: error.shouldLogout 
          ? 'Сессия истекла. Пожалуйста, войдите снова'
          : 'Требуется авторизация'
      };
    }
    throw error;
  }
};


  if (loading) return <div className={s.container}>Загрузка...</div>;
  if (error) return <div className={s.container}>{error}</div>;
  if (!product) return <div className={s.container}>Товар не найден</div>;

  return (
    <div className={s.container}>
      <button className={s.back} onClick={() => navigate(-1)}>
        ← Назад к каталогу
      </button>
      
      <div className={s.product}>
        <div className={s.productGallery}>
          <img 
            src={product.images[selectedColorIndex] || product.images[0]} 
            alt={product.name} 
            className={s.mainImage}
          />
          
          {product.colors?.length > 0 && (
            <div className={s.colors}>
              {product.colors.map((color, index) => (
                <button
                  key={index}
                  className={`${s.color_btn} ${selectedColorIndex === index ? s.active : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColorIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className={s.product_info}>
           <h1 className={s.product_name}>{product.name}</h1>
          <div className={s.productMeta}>
                    <h2 className={s.h3}>Характеристики:</h2>
                    <p>Бренд: {product.brand}</p>
                    <p>Сезон: {product.season}</p>
                    <p>Серия: {product.series}</p>
                    <p>Состав пряжи: {product.composition_proccent}</p>
                    <p>В одной упаковке: {product.packQuantity}</p>
                    <p>Длина нити(м): {product.threadLength}</p>
                    <p>Вес (г): {product.weight}</p>
                     {product.description && (
                    <div className={s.description}>
                      <h3 className={s.h3}>Описание</h3>
                      <p>{product.description}</p>
                    </div>
                  )}
              </div>
          <div className={s.info_line}>
            <p className={s.price}>{product.price} ₽</p>
          
            <button 
              className={s.basket_button}
              onClick={handleAddToCartClick}
            >
              В корзину
            </button>
          
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <QuantityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddToCart}
          colors={product.colors}
          selectedColorIndex={selectedColorIndex}
          onColorSelect={setSelectedColorIndex}
        />
      )}
    </div>
  );
};

export default ProductDetail;