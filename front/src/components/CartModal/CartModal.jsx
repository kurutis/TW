import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../../reducers/cartSlice';
import { selectIsAuthenticated } from '../../actions/authSelectors';
import { logout, showAuthModal } from '../../actions/forProfileAction';
import s from './CartModal.module.css';

const CartModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { 
    items, 
    status,
    error,
    authError
  } = useSelector(state => state.cart);

  console.log(items);
  
  

  // Загрузка данных при открытии модалки
  useEffect(() => {
  if (isOpen && isAuthenticated && items.length === 0 && status === 'idle') {
    dispatch(fetchCart());
  }
}, [isOpen, isAuthenticated, items.length, status, dispatch]);

  // Обработка ошибки авторизации
    useEffect(() => {
    let isMounted = true;
    
    const loadCart = async () => {
      if (isOpen && isAuthenticated) {
        try {
          await dispatch(fetchCart()).unwrap();
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      }
    };

    if (isMounted) loadCart();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated, dispatch]);


  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity > 0) {
      dispatch(updateCartItem({ itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalContent}>
          <div className={s.modalHeader}>
            <h2>Корзина</h2>
            <button className={s.close_button} onClick={onClose}>
              <svg>
                            <path d="M20 3.75C20.53 3.75 21.06 3.77 21.59 3.82C22.12 3.88 22.64 3.95 23.17 4.06C23.69 4.16 24.2 4.29 24.71 4.44C25.22 4.6 25.72 4.78 26.21 4.98C26.71 5.19 27.19 5.41 27.66 5.66C28.12 5.91 28.58 6.19 29.02 6.48C29.47 6.78 29.89 7.1 30.3 7.43C30.72 7.77 31.11 8.13 31.49 8.5C31.86 8.88 32.22 9.27 32.56 9.69C32.89 10.1 33.21 10.52 33.51 10.97C33.8 11.41 34.08 11.87 34.33 12.33C34.58 12.8 34.8 13.28 35.01 13.78C35.21 14.27 35.39 14.77 35.55 15.28C35.7 15.79 35.83 16.3 35.93 16.82C36.04 17.35 36.11 17.87 36.17 18.4C36.22 18.93 36.25 19.46 36.25 20C36.25 20.53 36.22 21.06 36.17 21.59C36.11 22.12 36.04 22.64 35.93 23.17C35.83 23.69 35.7 24.2 35.55 24.71C35.39 25.22 35.21 25.72 35.01 26.21C34.8 26.71 34.58 27.19 34.33 27.66C34.08 28.12 33.8 28.58 33.51 29.02C33.21 29.47 32.89 29.89 32.56 30.3C32.22 30.72 31.86 31.11 31.49 31.49C31.11 31.86 30.72 32.22 30.3 32.56C29.89 32.89 29.47 33.21 29.02 33.51C28.58 33.8 28.12 34.08 27.66 34.33C27.19 34.58 26.71 34.8 26.21 35.01C25.72 35.21 25.22 35.39 24.71 35.55C24.2 35.7 23.69 35.83 23.17 35.93C22.64 36.04 22.12 36.11 21.59 36.17C21.06 36.22 20.53 36.25 20 36.25C19.46 36.25 18.93 36.22 18.4 36.17C17.87 36.11 17.35 36.04 16.82 35.93C16.3 35.83 15.79 35.7 15.28 35.55C14.77 35.39 14.27 35.21 13.78 35.01C13.28 34.8 12.8 34.58 12.33 34.33C11.87 34.08 11.41 33.8 10.97 33.51C10.52 33.21 10.1 32.89 9.69 32.56C9.27 32.22 8.88 31.86 8.5 31.49C8.13 31.11 7.77 30.72 7.43 30.3C7.1 29.89 6.78 29.47 6.48 29.02C6.19 28.58 5.91 28.12 5.66 27.66C5.41 27.19 5.19 26.71 4.98 26.21C4.78 25.72 4.6 25.22 4.44 24.71C4.29 24.2 4.16 23.69 4.06 23.17C3.95 22.64 3.88 22.12 3.82 21.59C3.77 21.06 3.75 20.53 3.75 20C3.75 19.46 3.77 18.93 3.82 18.4C3.88 17.87 3.95 17.35 4.06 16.82C4.16 16.3 4.29 15.79 4.44 15.28C4.6 14.77 4.78 14.27 4.98 13.78C5.19 13.28 5.41 12.8 5.66 12.33C5.91 11.87 6.19 11.41 6.48 10.97C6.78 10.52 7.1 10.1 7.43 9.69C7.77 9.27 8.13 8.88 8.5 8.5C8.88 8.13 9.27 7.77 9.69 7.43C10.1 7.1 10.52 6.78 10.97 6.48C11.41 6.19 11.87 5.91 12.33 5.66C12.8 5.41 13.28 5.19 13.78 4.98C14.27 4.78 14.77 4.6 15.28 4.44C15.79 4.29 16.3 4.16 16.82 4.06C17.35 3.95 17.87 3.88 18.4 3.82C18.93 3.77 19.46 3.75 20 3.75ZM20 40C20.65 40 21.3 39.96 21.96 39.9C22.61 39.83 23.25 39.74 23.9 39.61C24.54 39.48 25.17 39.32 25.8 39.13C26.43 38.94 27.04 38.72 27.65 38.47C28.25 38.22 28.85 37.94 29.42 37.63C30 37.32 30.56 36.99 31.11 36.62C31.65 36.26 32.18 35.87 32.68 35.46C33.19 35.04 33.67 34.6 34.14 34.14C34.6 33.67 35.04 33.19 35.46 32.68C35.87 32.18 36.26 31.65 36.62 31.11C36.99 30.56 37.32 30 37.63 29.42C37.94 28.85 38.22 28.25 38.47 27.65C38.72 27.04 38.94 26.43 39.13 25.8C39.32 25.17 39.48 24.54 39.61 23.9C39.74 23.25 39.83 22.61 39.9 21.96C39.96 21.3 40 20.65 40 20C40 19.34 39.96 18.69 39.9 18.03C39.83 17.38 39.74 16.74 39.61 16.09C39.48 15.45 39.32 14.82 39.13 14.19C38.94 13.56 38.72 12.95 38.47 12.34C38.22 11.74 37.94 11.14 37.63 10.57C37.32 9.99 36.99 9.43 36.62 8.88C36.26 8.34 35.87 7.81 35.46 7.31C35.04 6.8 34.6 6.32 34.14 5.85C33.67 5.39 33.19 4.95 32.68 4.53C32.18 4.12 31.65 3.73 31.11 3.37C30.56 3 30 2.67 29.42 2.36C28.85 2.05 28.25 1.77 27.65 1.52C27.04 1.27 26.43 1.05 25.8 0.86C25.17 0.67 24.54 0.51 23.9 0.38C23.25 0.25 22.61 0.16 21.96 0.09C21.3 0.03 20.65 0 20 0C19.34 0 18.69 0.03 18.03 0.09C17.38 0.16 16.74 0.25 16.09 0.38C15.45 0.51 14.82 0.67 14.19 0.86C13.56 1.05 12.95 1.27 12.34 1.52C11.74 1.77 11.14 2.05 10.57 2.36C9.99 2.67 9.43 3 8.88 3.37C8.34 3.73 7.81 4.12 7.31 4.53C6.8 4.95 6.32 5.39 5.85 5.85C5.39 6.32 4.95 6.8 4.53 7.31C4.12 7.81 3.73 8.34 3.37 8.88C3 9.43 2.67 9.99 2.36 10.57C2.05 11.14 1.77 11.74 1.52 12.34C1.27 12.95 1.05 13.56 0.86 14.19C0.67 14.82 0.51 15.45 0.38 16.09C0.25 16.74 0.16 17.38 0.09 18.03C0.03 18.69 0 19.34 0 20C0 20.65 0.03 21.3 0.09 21.96C0.16 22.61 0.25 23.25 0.38 23.9C0.51 24.54 0.67 25.17 0.86 25.8C1.05 26.43 1.27 27.04 1.52 27.65C1.77 28.25 2.05 28.85 2.36 29.42C2.67 30 3 30.56 3.37 31.11C3.73 31.65 4.12 32.18 4.53 32.68C4.95 33.19 5.39 33.67 5.85 34.14C6.32 34.6 6.8 35.04 7.31 35.46C7.81 35.87 8.34 36.26 8.88 36.62C9.43 36.99 9.99 37.32 10.57 37.63C11.14 37.94 11.74 38.22 12.34 38.47C12.95 38.72 13.56 38.94 14.19 39.13C14.82 39.32 15.45 39.48 16.09 39.61C16.74 39.74 17.38 39.83 18.03 39.9C18.69 39.96 19.34 40 20 40ZM13.67 13.67C12.93 14.4 12.93 15.59 13.67 16.32L17.34 19.99L13.67 23.66C12.93 24.39 12.93 25.58 13.67 26.31C14.4 27.03 15.59 27.04 16.32 26.31L19.99 22.64L23.66 26.31C24.39 27.04 25.58 27.04 26.31 26.31C27.03 25.57 27.04 24.39 26.31 23.66L22.64 19.99L26.31 16.32C27.04 15.58 27.04 14.39 26.31 13.67C25.57 12.94 24.39 12.93 23.66 13.67L19.99 17.34L16.32 13.67C15.58 12.93 14.39 12.93 13.67 13.67Z" fill="#BC354F"/>
                        </svg>
            </button>
          </div>

          {status === 'loading' && (
            <div className={s.loading}>Загрузка...</div>
          )}

          {status === 'failed' && (
            <div className={s.error}>{error}</div>
          )}

          {status === 'succeeded' && (
            <>
              {items.length === 0 ? (
                <div className={s.emptyCart}>Корзина пуста</div>
              ) : (
                <>
                  <div className={s.itemsList}>
                    {items.map(item => (
                      <div key={item.id} className={s.cartItem}>
                          <h3>{item.name}</h3>
                          {item.selectedColor && (
                            <p>Цвет: <div style={{ backgroundColor: item.selectedColor }} className={s.color}></div></p>
                          )}
                          <div className={s.btns}>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className={s.minus}
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock} className={s.plus}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className={s.delete_btn}
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Удалить
                          </button>
                        </div>
                    ))}
                  </div>

                  <div className={s.footer}>
                    <div className={s.total}>
                      Итого: {calculateTotal()} ₽
                    </div>
                    <div className={s.btns}>
                      <button
                        onClick={handleClearCart}
                        disabled={items.length === 0}
                        className={s.clear}
                      >
                        Очистить корзину
                      </button>
                      <button
                        className={s.checkout}
                        disabled={items.length === 0}
                      >
                        Оформить заказ
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CartModal);