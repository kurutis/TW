import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectCartItems,
  selectCartTotal,
  selectCart,
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  resetCartError
} from '../../reducers/cartSlice';
import { 
  selectIsAuthenticated,
  selectAuthChecked 
} from '../../actions/authSelectors';
import s from './CartModal.module.css';

const CartModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authChecked = useSelector(selectAuthChecked);
  const { items, status, error } = useSelector(selectCart);
  const total = useSelector(selectCartTotal);
  const [notification, setNotification] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (isOpen && authChecked) {
      const token = localStorage.getItem('authToken');
      if (!isAuthenticated || !token) {
        setNotification({
          type: 'error',
          message: 'Для просмотра корзины требуется авторизация'
        });
        return;
      }
      dispatch(fetchCart());
    }
  }, [isOpen, isAuthenticated, authChecked, dispatch]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity > 0) {
      try {
        await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
        setNotification({ type: 'success', message: 'Корзина обновлена' });
      } catch (error) {
        setNotification({ type: 'error', message: error.message || 'Ошибка обновления' });
      }
    } else {
      await dispatch(removeFromCart(itemId));
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      setNotification({ type: 'success', message: 'Заказ оформлен!' });
      setTimeout(() => {
        onClose();
        dispatch(clearCart());
      }, 1500);
    } catch (error) {
      setNotification({ type: 'error', message: error.message || 'Ошибка оформления' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalContent}>
          <div className={s.modalHeader}>
            <h2>Ваша корзина</h2>
            <button className={s.closeButton} onClick={onClose}>&times;</button>
          </div>

          {notification && (
            <div className={`${s.notification} ${s[notification.type]}`}>
              {notification.message}
            </div>
          )}

          {status === 'loading' && (
            <div className={s.loading}>Загрузка корзины...</div>
          )}

          {status === 'failed' && (
            <div className={s.errorState}>
              <p>{error}</p>
              <button 
                onClick={() => dispatch(fetchCart())}
                className={s.retryButton}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Загрузка...' : 'Повторить попытку'}
              </button>
            </div>
          )}

          {status === 'succeeded' && items.length === 0 ? (
            <div className={s.emptyCart}>
              <p>Ваша корзина пуста</p>
              <button 
                onClick={onClose}
                className={s.continueButton}
              >
                Продолжить покупки
              </button>
            </div>
          ) : (
            <>
              <div className={s.itemsList}>
                {items.map(item => (
                  <div key={`${item.id}-${item.selectedColor}`} className={s.cartItem}>
                    <img 
                      src={item.images?.[0] || '/placeholder.jpg'} 
                      alt={item.name} 
                      className={s.itemImage}
                    />
                    <div className={s.itemDetails}>
                      <h3 className={s.itemName}>{item.name}</h3>
                      {item.selectedColor && (
                        <p className={s.itemColor}>Цвет: {item.selectedColor}</p>
                      )}
                      <p className={s.itemPrice}>
                        {item.price} ₽ × {item.quantity} = {item.price * item.quantity} ₽
                      </p>
                      
                      <div className={s.quantityControls}>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 99)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      className={s.removeButton}
                      onClick={() => dispatch(removeFromCart(item.id))}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>

              <div className={s.cartFooter}>
                <div className={s.cartTotal}>
                  <span>Итого:</span>
                  <span>{total} ₽</span>
                </div>
                
                <div className={s.cartActions}>
                  <button
                    className={s.clearButton}
                    onClick={() => dispatch(clearCart())}
                    disabled={isCheckingOut}
                  >
                    Очистить корзину
                  </button>
                  <button
                    className={s.checkoutButton}
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Оформление...' : 'Оформить заказ'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;