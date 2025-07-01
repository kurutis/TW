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

    return (
        <div className={s.container}>
            <div className={s.header}>
                <CategorySelector />
            </div>
            
            <div className={s.content}>
                <ProductList />
            </div>
            
            {loading && products?.length > 0 && (
                <div className={s.loadingMore}>
                    Загружаем еще товары...
                </div>
            )}
        </div>
    );
};