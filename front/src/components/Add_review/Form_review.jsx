import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../actions/authSelectors';
import s from './Form_review.module.css';
import { 
  resetAddStatus, 
  resetReviewError,
  selectAddReviewStatus,
  selectReviewError 
} from '../../reducers/review';
import { addReview } from '../../actions/review';

export const ReviewForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const addStatus = useSelector(selectAddReviewStatus);
  const error = useSelector(selectReviewError);
  
  const [formData, setFormData] = useState({
    rating: 5,
    text: ''
  });
  const [images, setImages] = useState([]);

  // Сброс статуса при размонтировании
  useEffect(() => {
    return () => {
      dispatch(resetAddStatus());
      dispatch(resetReviewError());
    };
  }, [dispatch]);

  // Обработка успешного добавления
  useEffect(() => {
    if (addStatus === 'succeeded') {
      setFormData({ rating: 5, text: '' });
      setImages([]);
    }
  }, [addStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      // Проверяем, есть ли уже отзыв от пользователя
      const existingReview = reviews.find(r => r.user_id === user.id);
      
      const fd = new FormData();
      fd.append('rating', formData.rating.toString());
      fd.append('text', formData.text.trim());
      fd.append('userId', user.id.toString());

      images.forEach(file => fd.append('images', file));

      if (existingReview) {
        // Обновляем существующий отзыв
        await dispatch(updateReview({ 
          id: existingReview.id, 
          data: fd 
        }));
        alert('Ваш отзыв успешно обновлен!');
      } else {
        // Создаем новый отзыв
        await dispatch(addReview(fd));
        alert('Спасибо за ваш отзыв!');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={s.form}>
      {addStatus === 'failed' && error && (
        <div className={s.error}>{error}</div>
      )}

      {addStatus === 'succeeded' && (
        <div className={s.success}>Отзыв успешно добавлен!</div>
      )}

      <div className={s.formGroup}>
        <label htmlFor="rating">Оценка:</label>
        <select
          id="rating"
          name="rating"
          value={formData.rating}
          onChange={handleInputChange}
          disabled={addStatus === 'pending'}
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'звезда' : 'звёзды'}
            </option>
          ))}
        </select>
      </div>

      <div className={s.formGroup}>
        <label htmlFor="text">Ваш отзыв:</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleInputChange}
          required
          minLength={10}
          disabled={addStatus === 'pending'}
        />
      </div>

      <div className={s.formGroup}>
        <label htmlFor="images">Изображения (необязательно, максимум 5):</label>
        <input
          type="file"
          id="images"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          disabled={addStatus === 'pending'}
          max={5}
        />
        {images.length > 0 && (
          <div className={s.filesInfo}>
            Выбрано файлов: {images.length}
            <button 
              type="button" 
              onClick={() => setImages([])}
              className={s.clearFiles}
            >
              Очистить
            </button>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={addStatus === 'pending'}
        className={s.submitButton}
      >
        {addStatus === 'pending' ? 'Отправка...' : 'Отправить отзыв'}
      </button>
    </form>
  );
};