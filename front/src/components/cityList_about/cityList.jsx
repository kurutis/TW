import React from "react";
import { useSelector } from "react-redux";
import s from './cityList.module.css'

export const CityList = ({ onCityClick }) => {
    const { filteredCities, cities, loading, error } = useSelector(state => state.cities); 

    if (loading) {
      return <div>Загрузка...</div>;
    }

    if (error) {
      return <div>Ошибка: {error.message}</div>;
    }

    const displayCities = filteredCities.length > 0 ? filteredCities : cities; 
    if (displayCities.length === 0) {
        return <div>Городов не найдено</div>;
    }

    return (
        <ul className={s.cities}>
            {displayCities.map(city => (
                <li key={city.id} onClick={() => onCityClick(city)}>
                    {city.city}, {city.address}
                </li>
            ))}
        </ul>
    );
};

