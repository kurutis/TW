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
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

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
    <form className={s.auth_form} onSubmit={handleSubmit}>
      {error && <div className={s.error}>{error}</div>}
      
      <div className={s.form_group}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите ваш email"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className={s.form_group}>
        <label>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          required
          minLength={6}
          disabled={isLoading}
        />
      </div>
      
      {!isLoginForm && (
        <>
          <div className={s.form_group}>
            <label>Имя на сайте (никнейм)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Придумайте никнейм"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className={s.form_group}>
            <label>Полное имя</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ваше полное имя"
              disabled={isLoading}
            />
          </div>
          
          <div className={s.form_group}>
            <label>Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ваш телефон"
              disabled={isLoading}
            />
          </div>
        </>
      )}
      
      <button type="submit" disabled={isLoading} className={s.submit_button}>
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
  );
};