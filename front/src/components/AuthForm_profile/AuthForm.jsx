import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearAuthError } from '../../actions/forProfileAction';
import s from './AuthForm.module.css';

export const AuthForm = ({ onSuccess, initialFormType = 'login' }) => {
  const dispatch = useDispatch();
  const [isLoginForm, setIsLoginForm] = useState(initialFormType === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const { isLoading, error } = useSelector(state => state.forProfile);

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const userData = await apiService.auth.me();
      if (userData?.user) {
        dispatch({ type: 'AUTH_CHECK_SUCCESS', payload: { user: userData.user } });
      }
    } catch (error) {
      console.log('Пользователь не авторизован');
    }
  };

  checkAuth();
}, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Очищаем предыдущие ошибки
  dispatch(clearAuthError());
  
  // Валидация полей
  if (!email || !password) {
    dispatch(setAuthError('Заполните все обязательные поля'));
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    dispatch(setAuthError('Введите корректный email'));
    return;
  }
  
  if (password.length < 6) {
    dispatch(setAuthError('Пароль должен быть не менее 6 символов'));
    return;
  }

  try {
    const action = isLoginForm 
      ? login({ email: email.trim(), password })
      : register({ 
          email: email.trim(), 
          password,
          nickname: nickname.trim(),
          full_name: fullName.trim(),
          phone: phone.trim()
        });
    
    const result = await dispatch(action);
    
    if (result?.success) {
      onSuccess?.();
    }
  } catch (err) {
    console.error('Ошибка формы:', err);
    // Ошибка уже обработана в action
  }
};

  return (
   <div className={s.form_container}>
    <div>
      {isLoading ? (
          <div className={s.h2}></div>
        ) : (
          isLoginForm ? <div className={s.h2}>Войти</div> : <div className={s.h2}>Зарегистрироваться</div>
        )}
       <form className={s.auth_form} onSubmit={handleSubmit}>
      {error && <div className={s.error}>{error}</div>}
      
      <div className={s.form_group}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите ваш email"
          required
          disabled={isLoading}
          className={s.form_input}
        />
      </div>
      
      <div className={s.form_group}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          required
          minLength={6}
          disabled={isLoading}
          className={s.form_input}
        />
      </div>
      
      {!isLoginForm && (
        <>
          <div className={s.form_group}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Придумайте никнейм"
              required
              disabled={isLoading}
              className={s.form_input}
            />
          </div>
          
          <div className={s.form_group}>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ваше полное имя"
              disabled={isLoading}
              className={s.form_input}
            />
          </div>
          
          <div className={s.form_group}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ваш телефон"
              disabled={isLoading}
              className={s.form_input}
            />
          </div>
        </>
      )}
      
      <button type="submit" disabled={isLoading} className={s.form_btn}>
        {isLoading ? (
          <div className={s.spinner}></div>
        ) : (
          isLoginForm ? 'Войти' : 'Зарегистрироваться'
        )}
      </button>
      
      <div className={s.toggle_form}>
        <span>
          {isLoginForm ? 'Нет аккаунта?' : 'Есть аккаунт?'}{' '}
          <button 
            type="button"
            onClick={() => {
              setIsLoginForm(!isLoginForm);
              dispatch(clearAuthError());
            }}
            className={s.toggle_button}
            disabled={isLoading}
          >
            {isLoginForm ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </span>
      </div>
    </form>
    </div>
   </div>
  );
};