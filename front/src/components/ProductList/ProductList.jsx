import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../../reducers/cartSlice';
import { fetchProducts } from '../../actions/product';
import s from './ProductList.module.css';
import basket from '../../assets/basketIcon.svg'


export const ProductList = () => {
  const dispatch = useDispatch();
  const products = useSelector(state => state.products.products || []);
  const loading = useSelector(state => state.products.loading);
  const error = useSelector(state => state.products.error);
  const selectedCategory = useSelector(state => state.products.selectedCategory);

  useEffect(() => {
    dispatch(fetchProducts(selectedCategory));
  }, [dispatch, selectedCategory]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    dispatch(addToCart({
      ...product,
      quantity: 1,
      selectedColor: product.colors?.[0] || ''
    }));
  };

  if (loading) return <div className={s.loading}>Загрузка товаров...</div>;
  if (error) return <div className={s.error}>Ошибка: {error}</div>;

  return (
    <div className={s.productGrid}>
      {products.length === 0 ? (
        <p className={s.noProducts}>Товары не найдены</p>
      ) : (
        products.map(product => (
          <Link 
            to={`/product/${product.id}`} 
            key={product.id} 
            className={s.productCard}
          >
            <div className={s.imageContainer}>
              <img 
                src={product.images?.[0] || '/placeholder.jpg'} 
                alt={product.name} 
                className={s.productImage}
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />
            </div>
            
            <div className={s.productInfo}>
              <h3 className={s.productName}>{product.name}</h3>
              <p className={s.productComposition}>{product.composition_percent}</p>
              
              <div className={s.productFooter}>
                <div className={s.stroke}>
                  <p className={s.productPrice}>
                    {product.price ? Number(product.price).toFixed(2) : '0.00'} ₽/шт
                  </p>

                    <button 
                    className={s.stroke}
                    onClick={(e) => handleAddToCart(e, product)}
                    aria-label="Добавить в корзину"
                  >
                    <img src={basket} alt="" />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};