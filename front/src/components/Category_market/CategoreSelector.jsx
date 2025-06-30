import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories, setSelectedCategory, fetchProducts } from '../../actions/product';
import s from './CategorySelector.module.css';
import menuImg from '../../assets/menu.svg';

// Функция для извлечения категорий из ответа API
const getCategoriesArray = (categories) => {
  if (Array.isArray(categories)) return categories;
  if (categories?.data && Array.isArray(categories.data)) return categories.data;
  return [];
};

export const CategorySelector = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { categories: rawCategories = [], selectedCategory, loading } = useSelector(state => state.products);
    const dispatch = useDispatch();

    // Получаем массив категорий независимо от формата ответа
    const categories = getCategoriesArray(rawCategories);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleCategoryClick = (categoryId) => {
        dispatch(setSelectedCategory(categoryId));
        dispatch(fetchProducts(categoryId));
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = (e) => {
        if (e.target.className === s.overlay) {
            setIsMenuOpen(false);
        }
    };

    const getCategoryName = (id) => {
        const category = categories.find(c => c?.id === id);
        return category?.name || 'Ассортимент';
    };

    return (
        <div className={s.category_selector}>
            <button className={s.assortiment} onClick={toggleMenu}>
                <img src={menuImg} alt="Меню категорий" />
                {getCategoryName(selectedCategory)}
            </button>
            {isMenuOpen && (
                <>
                    <div className={s.overlay} onClick={closeMenu}></div>
                    <div className={`${s.menu} ${isMenuOpen ? s.open : ''}`}>
                        <h2>Категории</h2>
                        {loading ? (
                            <div className={s.loading}>Загрузка...</div>
                        ) : (
                            <>
                                <div 
                                    className={s.menuItem}
                                    onClick={() => handleCategoryClick(null)}
                                >
                                    Все категории
                                </div>
                                {categories.map(category => (
                                    <div 
                                        key={category.id} 
                                        className={s.menuItem}
                                        onClick={() => handleCategoryClick(category.id)}
                                    >
                                        {category.name}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};