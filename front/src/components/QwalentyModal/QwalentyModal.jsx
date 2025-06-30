import React, { useState, useEffect } from 'react';
import s from './QwalentyModal.module.css'; 
import basket from '../../assets/basketIcon.svg';

export const QuantityModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  maxQuantity = 10,
  colors = [],
  selectedColorIndex = 0,
  onColorSelect
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    
    // Инициализация выбранного цвета
    useEffect(() => {
        if (colors.length > 0) {
            const initialColor = colors[selectedColorIndex] || colors[0];
            setSelectedColor(initialColor);
        }
    }, [colors, selectedColorIndex]);

    const handleAdd = () => {
        if (colors.length > 0 && !selectedColor) return;
        
        onSubmit(quantity, selectedColor);
        onClose();
    };

    const handleIncrease = () => {
        setQuantity(prev => Math.min(maxQuantity, prev + 1));
    };

    const handleDecrease = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            const numValue = value === '' ? 1 : Math.max(1, Math.min(maxQuantity, Number(value)));
            setQuantity(numValue);
        }
    };

    const handleColorChange = (color) => {
        setSelectedColor(color);
        if (onColorSelect) {
            onColorSelect(color);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={s.modalOverlay} onClick={onClose}>
            <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                <button 
                    className={s.closeButton} 
                    onClick={onClose}
                    aria-label="Закрыть модальное окно"
                >
                    &times;
                </button>
                
                <h2 className={s.modalTitle}>Выберите количество</h2>
                
                <div className={s.quantityControls}>
                    <button 
                        className={s.quantityButton} 
                        onClick={handleDecrease}
                        disabled={quantity <= 1}
                        aria-label="Уменьшить количество"
                    >
                        -
                    </button>
                    
                    <input
                        className={s.quantityInput}
                        type="number"
                        value={quantity}
                        min="1"
                        max={maxQuantity}
                        onChange={handleChange}
                        aria-label="Количество товара"
                    />
                    
                    <button 
                        className={s.quantityButton} 
                        onClick={handleIncrease}
                        disabled={quantity >= maxQuantity}
                        aria-label="Увеличить количество"
                    >
                        +
                    </button>
                </div>
                
                {colors.length > 0 && (
                    <>
                        <h2 className={s.modalTitle}>Выберите цвет</h2>
                        <div className={s.colorOptions}>
                            {colors.map((color, index) => (
                                <button
                                    key={index}
                                    className={`${s.colorOption} ${
                                        selectedColor === color ? s.colorOptionActive : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorChange(color)}
                                    aria-label={`Выбрать цвет ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
                
                <button 
                    className={s.addButton} 
                    onClick={handleAdd}
                    disabled={colors.length > 0 && !selectedColor}
                    aria-label="Добавить в корзину"
                >
                    Добавить в корзину
                    <img src={basket} alt="" className={s.basketIcon} />
                </button>
            </div>
        </div>
    );
};