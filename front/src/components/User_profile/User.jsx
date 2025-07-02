import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../actions/forProfileAction';
import s from './User.module.css';
import emailSvg from '../../assets/email-form.svg'
import nameSvg from '../../assets/user-regular.svg'
import phoneSvg from '../../assets/phone-solid.svg'
import nickSvg from '../../assets/signature-solid.svg'

export const User = ({ user }) => {
  const dispatch = useDispatch();
  
  const handleLogout = useCallback(async () => {
    await dispatch(logout());
  }, [dispatch]);

  return (
    <div className={s.profileContainer}>
      <h2>Профиль пользователя</h2>
      
      {user ? (
        <div className={s.info_profile}>
          <div className={s.infoRow}>
            <img src={emailSvg} alt="" />
            <span className={s.label}>Email:</span>
            <span className={s.value}>{user.email || 'Не указан'}</span>
          </div>
          
          {user.full_name && (
            <div className={s.infoRow}>
              <img src={nameSvg} alt="" />
              <span className={s.label}>ФИО:</span>
              <span className={s.value}>{user.full_name}</span>
            </div>
          )}
          
          {user.phone && (
            <div className={s.infoRow}>
              <img src={phoneSvg} alt="" />
              <span className={s.label}>Телефон:</span>
              <span className={s.value}>{user.phone}</span>
            </div>
          )}
          
          {user.nickname && (
            <div className={s.infoRow}>
              <img src={nickSvg} alt="" />
              <span className={s.label}>Имя на сайте:</span>
              <span className={s.value}>{user.nickname}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={s.error}>Данные пользователя не загружены</div>
      )}

      <button 
        onClick={handleLogout}
        className={s.btn_profile}
      >
        Выйти
      </button>
    </div>
  );
};

export default React.memo(User);