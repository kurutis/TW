import { useState } from 'react';
import { useDispatch } from 'react-redux';
import s from './search.module.css'


export const SearchBar = () => {
    const filterProducts = (searchTerm) => ({
        type: 'FILTER_PRODUCTS',
        payload: { searchTerm },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        dispatch(filterProducts(e.target.value));
    };

    return (
        <>
            <input type="text" placeholder="Поиск" value={searchTerm} onChange={handleSearchChange} className={s.input} />
        </>
    );
};