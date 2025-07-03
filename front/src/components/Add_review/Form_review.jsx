import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../actions/authSelectors';
import { apiService } from '../../services/api'; // Добавлен импорт
import s from './Form_review.module.css';
import { 
  resetAddStatus, 
  resetReviewError,
  selectAddReviewStatus,
  selectReviewError,
  selectAllReviews
} from '../../reducers/review';
import { addReview, updateReview } from '../../actions/review';
import { AutoResizeTextarea } from '../AutoResazeTextarea/AutoresizeTextarea';
import paperClip from '../../assets/paperclip.svg';
import go from '../../assets/go.svg';

export const ReviewForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const addStatus = useSelector(selectAddReviewStatus);
  const error = useSelector(selectReviewError);
  const reviews = useSelector(selectAllReviews) || [];

  const [formData, setFormData] = useState({
    rating: 5,
    text: ''
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    return () => {
      dispatch(resetAddStatus());
      dispatch(resetReviewError());
    };
  }, [dispatch]);

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
  if (!user?.id) {
    console.error('User ID is missing');
    return;
  }

  try {
    const fd = new FormData();
    fd.append('rating', formData.rating.toString());
    fd.append('text', formData.text.trim());
    fd.append('userId', user.id.toString());

    console.log('FormData content:');
    for (let [key, value] of fd.entries()) {
      console.log(key, value);
    }

    // Валидация изображений
    if (images.length > 5) {
      throw new Error('Максимум 5 изображений');
    }

    images.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Файл ${file.name} слишком большой (макс. 10MB)`);
      }
      fd.append('images', file, file.name);
    });

    console.log('Submitting review...');
    const response = await apiService.reviews.create(fd);
    console.log('Server response:', response);
    
    if (response.error) {
      throw new Error(response.error);
    }

    dispatch(addReview(response));
    setFormData({ rating: 5, text: '' });
    setImages([]);

  } catch (error) {
    console.error('Ошибка при отправке отзыва:', error);
    dispatch(resetReviewError(error.message || 'Ошибка при отправке отзыва'));
  }
};

  return (
    <form onSubmit={handleSubmit} className={s.review_form}>
      {error && (
        <div className={s.error}>{error}</div>
      )}

      {addStatus === 'succeeded' && (
        <div className={s.success}>Отзыв успешно добавлен!</div>
      )}
      
      <AutoResizeTextarea
        name="text"
        value={formData.text}
        onChange={handleInputChange}
        required
        minLength={10}
        disabled={addStatus === 'pending'}
        className={s.textarea}
        placeholder="Оставьте ваш отзыв!"
      />
      
      <div className={s.else}>
        <select
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
          id="file-upload"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          disabled={addStatus === 'pending'}
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
          {addStatus === 'pending' ? 'Отправка...' : <img src={go} alt="Отправить" />}
        </button>
      </div>
    </form>
  );
};