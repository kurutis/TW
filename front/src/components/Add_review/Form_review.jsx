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
import { AutoResizeTextarea } from '../AutoResazeTextarea/AutoresizeTextarea';
import paperClip from '../../assets/paperclip.svg';
import go from '../../assets/go.svg';

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
    <form onSubmit={handleSubmit} className={s.review_form}>
      {addStatus === 'failed' && error && (
        <div className={s.error}>{error}</div>
      )}

      {addStatus === 'succeeded' && (
        <div className={s.success}>Отзыв успешно добавлен!</div>
      )}
        <AutoResizeTextarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleInputChange}
          required
          minLength={10}
          disabled={addStatus === 'pending'}
          className = {s.textarea}
          placeholder="Оставьте ваш отзыв!"
        />
        <div className={s.else}>
          <select
          id="rating"
          name="rating"
          value={formData.rating}
          onChange={handleInputChange}
          disabled={addStatus === 'pending'}
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option className={s.star} key={num} value={num}>
              {num} ★
            </option>
          ))}
        </select>
        <label htmlFor="file-upload" className={s.custom_file_upload}>
              <img className={s.label_img} src={paperClip} alt="Прикрепить файл" />
          </label>
        <input
          type="file"
          id="images"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          disabled={addStatus === 'pending'}
          max={5}
          style={{ display: 'none' }}
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

      <button 
        type="submit" 
        disabled={addStatus === 'pending'}
        className={s.submitButton}
      >
        <img src={go} alt="Отправить" />
      </button>
        </div>
    </form>
  );
};