import React, { useEffect, useRef, useState } from 'react';
import s from './AutoResizeTextarea.module.css';

export const AutoResizeTextarea = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; 
            textarea.style.height = `${textarea.scrollHeight}px`; 
        }
    }, [value]); 

    const handleChange = (e) => {
        onChange(e);
    };

    return (
        <textarea className={s.textarea}
            ref={textareaRef}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            autoCorrect="false"
            spellCheck="false"
        />
    );
};