import React from 'react';
import { useSelector } from 'react-redux';
import { CategorySelector } from '../../components/Category_market/CategoreSelector';
import { ProductList } from '../../components/ProductList/ProductList';
import s from './Market.module.css';

export const Market = () => {
    const { 
        loading, 
        error, 
        products 
    } = useSelector(state => state.products);
    
    // Состояния загрузки
    const renderContent = () => {
        if (error) {
            return (
                <div className={s.error}>
                    Произошла ошибка при загрузке товаров
                    <button 
                        onClick={() => window.location.reload()}
                        className={s.retryButton}
                    >
                        Попробовать снова
                    </button>
                </div>
            );
        }

        if (loading && !products?.length) {
            return (
                <div className={s.loadingContainer}>
                    <div className={s.loadingSpinner}></div>
                    <p>Загружаем каталог...</p>
                </div>
            );
        }

        if (!products?.length && !loading) {
            return (
                <div className={s.emptyState}>
                    <p>Товары не найдены</p>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            );
        }

        return <ProductList />;
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <CategorySelector />
            </div>
            
            <div className={s.content}>
                {renderContent()}
            </div>
            
            {loading && products?.length > 0 && (
                <div className={s.loadingMore}>
                    Загружаем еще товары...
                </div>
            )}
        </div>
    );
};