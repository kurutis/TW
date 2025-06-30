import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SearchBar } from '../../components/search_menu/search';
import { Modal } from '../../components/Modal_profile/Modal';
import { User } from '../../components/User_profile/User';
import { AuthForm } from '../../components/AuthForm_profile/AuthForm';
import CartModal from '/src/components/CartModal/CartModal.jsx';
import { checkAuth, logout, clearAuthError } from '../../actions/forProfileAction';
import s from './Root.module.css';
import { setAuthError } from '../../actions/forProfileAction';

// Импорт изображений
import logo from '../../assets/logo.svg';
import basket from '../../assets/basketIcon.svg';
import profile from '../../assets/profileIcon.svg';
import Video from '../../assets/Video/video.mp4';
import down from '../../assets/down.svg';
import phone from '../../assets/phone.svg';
import email from '../../assets/email.svg';
import whatsapp from '../../assets/whatsapp.svg';


export const Root = () => {
    const dispatch = useDispatch();
    const targetRef = useRef(null);
    const videoRef = useRef(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isVideoError, setIsVideoError] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    const forceUpdate = useCallback(() => updateState({}), []);
    
    const { 
        user, 
        isAuthenticated, 
        authChecked, 
        isLoading, 
        error // Добавляем эту строку
    } = useSelector(state => state.forProfile);
    const cartItems = useSelector(state => state.cart?.items || []);

    useEffect(() => {
    if (!authChecked && !isLoading) {
        dispatch(checkAuth());
    }
    }, [dispatch, authChecked, isLoading]);

    const handleProfileClick = () => {
        setIsModalOpen(true);
        dispatch(setAuthError(null));
    };


    const handleAuthSuccess = useCallback(() => {
        setIsModalOpen(false);
        dispatch(clearAuthError());
    }, [dispatch]);


    const scrollToContent = () => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLogout = async () => {
        try {
            await dispatch(logout());
            setIsModalOpen(false); // Закрываем модальное окно после выхода
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedData = () => {
            setIsVideoReady(true);
            video.play().catch(err => {
                console.log('Autoplay prevented:', err);
                video.muted = true;
                video.play().catch(e => console.log('Muted playback failed:', e));
            });
        };

        const handleError = () => {
            console.log('Video load error');
            setIsVideoError(true);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
            video.pause();
        };
    }, []);

    const contacts = [
        { 
            title: 'Для оптовых клиентов:', 
            items: [
                { icon: phone, text: '+7 (495) 850 18 48' }
            ]
        },
        { 
            title: 'Фирменный магазин:', 
            items: [
                { icon: phone, text: '+7 (495) 851-50-66' },
                { text: 'Время работы с 9 до 21' }
            ]
        },
        { 
            title: 'Для розничных клиентов:', 
            items: [
                { icon: phone, text: '+7 (495) 546-97-54' },
                { text: 'График работы: ПН-ПТ с 8.30 до 17.30' }
            ]
        }
    ];

    if (!authChecked) {
        return <div className={s.loading}>Загрузка...</div>;
    }

    return (
        <>
            <header className={s.header}>
                <div className={s.container}>
                    <div className={s.header_items}>
                        <div className={s.name}>
                            <Link to="/" className={s.logo}>
                                <img src={logo} alt="Логотип" />
                            </Link>
                            <h2 className={s.header_h2}>
                                <span>Троицкая</span> камвольная фабрика
                            </h2>
                        </div>
                        
                        <ul className={s.menu}>
                            <li>
                                <SearchBar />
                            </li>
                            <li>
                                <ul className={s.icons}>
                                    <li className={s.li_cart}>
                                        <span className={s.cart_num}>({cartItems.length})</span>
                                        <button 
                                            onClick={() => setIsCartOpen(true)} 
                                            className={s.icon_button}
                                        >
                                            <img src={basket} alt="Корзина" />
                                            <p>Корзина</p>
                                        </button>
                                    </li>
                                    <CartModal 
                                        isOpen={isCartOpen} 
                                        onClose={() => setIsCartOpen(false)} 
                                    />
                                    
                                    <li>
                                        <button 
                                            onClick={handleProfileClick} 
                                            className={s.icon_button}
                                        >
                                            <img src={profile} alt="Профиль" />
                                            <p>{isAuthenticated ? 'Профиль' : 'Войти'}</p>
                                        </button>
                                        
                                        <Modal isOpen={isModalOpen} onClose={() => {
                                        setIsModalOpen(false);
                                        dispatch(clearAuthError());
                                        }}>
                                        {isAuthenticated ? (
                                            <div className={s.profile_modal}>
                                            <User user={user} onLogout={handleLogout} />
                                            </div>
                                        ) : (
                                            <AuthForm 
                                            onSuccess={handleAuthSuccess}
                                            initialFormType="login"
                                            />
                                        )}
                                        </Modal>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>
            <main>
                <div className={s.video_container}>
                    {!isVideoError ? (
                        <video
                            ref={videoRef}
                            muted
                            loop
                            playsInline
                            className={s.video}
                        >
                            <source src={Video} type="video/mp4" />
                        </video>
                    ) : (
                        <div className={s.video_fallback}>
                            {/* Fallback content */}
                        </div>
                    )}
                    
                    <button onClick={scrollToContent} className={s.btn}>
                        Вниз <img src={down} alt="" />
                    </button>
                </div>
                
                <div className={s.container}>
                    <nav>
                        <ul ref={targetRef} className={s.navigation}>
                            <NavLink 
                                className={({isActive}) => isActive ? s.active : s.btnNav} 
                                to={'About'}
                            >
                                <li>О магазине</li>
                            </NavLink>
                            <NavLink 
                                className={({isActive}) => isActive ? s.active : s.btnNav} 
                                to={'Market'}
                            >
                                <li>Товары</li>
                            </NavLink>
                            <NavLink 
                                className={({isActive}) => isActive ? s.active : s.btnNav} 
                                to={'Reviews'}
                            >
                                <li>Отзывы</li>
                            </NavLink>
                        </ul>
                    </nav>
                </div>

                <Outlet />
            </main>

            {/* Подвал сайта */}
            <footer className={s.footer}>
                <div className={s.container}>
                    <div className={s.footer_content}>
                        <div className={s.name}>
                            <Link to="/" className={s.logo}>
                                <img src={logo} alt="Логотип Троицкой камвольной фабрики" />
                            </Link>
                            <h2 className={s.header_h2}>
                                <span>Троицкая</span> камвольная фабрика
                            </h2>
                        </div>
                        
                        <div className={s.contact}>
                            {contacts.map((section, index) => (
                                <div key={index}>
                                    <p>{section.title}</p>
                                    {section.items.map((item, i) => (
                                        <p key={i}>
                                            {item.icon && <span><img src={item.icon} alt="Иконка" /></span>}
                                            {item.text}
                                        </p>
                                    ))}
                                </div>
                            ))}
                            
                            <div className={s.footer_links}>
                                <a href='mailto:shop@troitskwool.com' target='_blank' rel="noreferrer">
                                    <img src={email} alt="Написать на email" />
                                </a>
                                <a href='https://wa.me/79661101244' target='_blank' rel="noreferrer">
                                    <img src={whatsapp} alt="Написать в WhatsApp" />
                                </a>
                            </div>
                        </div>
                        
                        <div className={s.info}>
                            <p>108842, Россия, г.Москва, г.Троицк, Фабричная площадь, дом 1</p>
                            <p>ОГРН: 1125003003531</p>
                            <p>ИНН/КПП: 5046075590/775101001</p>
                        </div>
                    </div>
                    
                    <div className={s.copyright}>
                        <span>© 2009 – 2024 Troitskwool. Все права защищены.</span>
                    </div>
                </div>
            </footer>
        </>
    );
};