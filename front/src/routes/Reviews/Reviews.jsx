import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchReviews,
  selectAllReviews,
  selectReviewStatus,
  selectReviewError,
  resetReviewError
} from '../../reducers/review';
import { ReviewForm } from '../../components/Add_review/Form_review';
import { selectIsAuthenticated } from '../../actions/authSelectors';
import s from './Reviews.module.css';

export const Reviews = () => {
  const dispatch = useDispatch();
  const reviews = useSelector(selectAllReviews);
  const status = useSelector(selectReviewStatus);
  const error = useSelector(selectReviewError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
  console.log('Reviews in component:', reviews); // Лог текущих отзывов
  dispatch(fetchReviews());
  return () => dispatch(resetReviewError());
}, [dispatch]);

  if (status === 'pending') return <div className={s.loading}>Загрузка отзывов...</div>;
  if (status === 'failed') return <div className={s.error}>Ошибка загрузки отзывов: {error}</div>;

  return (
    <div className={s.container}>
      {isAuthenticated && (
        <div className={s.reviewFormContainer}>
          <h2>Оставьте свой отзыв</h2>
          <ReviewForm />
        </div>
      )}

      <div className={s.reviewsList}>
        <h2>Отзывы наших клиентов</h2>
        
        {reviews.length > 0 ? (
          <ul className={s.reviews}>
            {reviews.map((review) => (
              <li key={review.id} className={s.review}>
                <div className={s.reviewHeader}>
                  <h3>{review.user_name || 'Анонимный пользователь'}</h3>
                  <div className={s.rating}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className={s.date}>
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <p className={s.reviewText}>{review.text}</p>
                
                {review.images?.length > 0 && (
                  <div className={s.imagesGrid}>
                    {review.images.map((image, index) => (
                      <div key={index} className={s.imageContainer}>
                        <img 
                          src={image.url || image} 
                          alt={`Отзыв ${review.user_name}`}
                          className={s.reviewImage}
                          onError={(e) => {
                            e.target.src = '/default-review-image.jpg';
                            e.target.alt = 'Изображение не доступно';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.noReviews}>Пока нет отзывов. Будьте первым!</p>
        )}
      </div>
    </div>
  );
};