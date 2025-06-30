import React, { useEffect, useState } from 'react';
import styles from './slider.module.css';
import doc1 from '../../assets/Documents/doc1.jpg'
import doc2 from '../../assets/Documents/doc2.jpg'
import doc3 from '../../assets/Documents/doc3.jpg'
import doc4 from '../../assets/Documents/doc4.jpg'
import doc5 from '../../assets/Documents/doc5.jpg'
import doc6 from '../../assets/Documents/doc6.jpg'
import doc7 from '../../assets/Documents/doc7.jpg'
import prevImg from '../../assets/prev.svg'
import nextImg from '../../assets/next.svg'
import plus from '../../assets/plus.svg'

export const Slider = () => {
    const [items, setItems] = useState([
        { id: 1, image: doc1, pos: -3 },
        { id: 2, image: doc2, pos: -2 },
        { id: 3, image: doc3, pos: -1 },
        { id: 4, image: doc4, pos: 0 },
        { id: 5, image: doc5, pos: 1 },
        { id: 6, image: doc6, pos: 2 },
        { id: 7, image: doc7, pos: 3 },
    ]);
    const [activeIndex, setActiveIndex] = useState(3);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');

    useEffect(() => {
        const autoSlideInterval = setInterval(() => {
            next();
        }, 3000);
        
        return () => clearInterval(autoSlideInterval);
    }, []);

    const updatePositions = (index) => {
        setActiveIndex(index);
        setItems(items.map((item, i) => ({
            ...item,
            pos: (i - index + items.length) % items.length - 3
        })));
    };

    const next = () => {
        updatePositions((activeIndex + 1) % items.length);
    };

    const prev = () => {
        updatePositions((activeIndex - 1 + items.length) % items.length);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowRight') next();
        if (event.key === 'ArrowLeft') prev();
    };

    const openModal = (image) => {
        setModalImage(image);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalImage('');
    };

    return (
        <div className={styles.carousel} onKeyDown={handleKeyDown} tabIndex="0">
            <button className={styles.btnPrev} onClick={prev}><img src={prevImg} alt="" /></button>
            <ul className={styles.carouselList}>
                {items.map(item => (
                    <li
                        key={item.id}
                        className={`${styles.carouselItem} ${activeIndex === item.id - 1 ? styles.active : ''}`}
                        data-pos={item.pos}
                        style={{ backgroundImage: `url(${item.image})`, backgroundSize: 'cover' }}
                    >
                        <div
                            className={styles.imageOverlay}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                            onClick={() => openModal(item.image)}
                        >
                            <img src={plus} alt="Icon" className={styles.icon} />
                        </div>
                        {item.content}
                    </li>
                ))}
            </ul>
            <button className={styles.btnNext} onClick={next}><img src={nextImg} alt="" /></button>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent}>
                        <img src={modalImage} alt="Enlarged" className={styles.modalImage} />
                    </div>
                </div>
            )}
        </div>
    );
};