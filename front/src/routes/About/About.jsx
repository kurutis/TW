import s from './About.module.css';
import historyImage from '../../assets/history.jpeg';
import classNames from 'classnames';
import plus from '../../assets/plus.svg';
import minus from '../../assets/minus.svg'; 
import { Link } from 'react-router-dom';
import { SearchCity } from '../../components/search_about/search';
import { Slider } from '../../components/slider_about/slider';

export let loader = async () => {
    let arr = JSON.parse(localStorage.getItem('About'));
    if (arr) {
        return arr;
    } 
    return [];
};

export const About = () => {
    return (
        <div className={classNames(s.container, s.about)}>
            <h1>История</h1>
            <div className={s.history}>
                <div className={s.text}>
                    <p>
                        Троицкая камвольная фабрика - одно из старейших текстильных предприятий России. Основал фабрику московский купец А.П. Прохоров в 1797 году. Фабрика была бумагопрядильной.
                    </p>
                    <p>
                        В 1865 году владельцем фабрики стал немец Куппер, который переоборудовал ее под выпуск армейского сукна. До 1976 года фабрика производила тонкосуконные ткани. Затем предприятие было переориентировано на выпуск гребенной чесальной ленты, а с 1990-х годов был налажен выпуск пряжи для ручного и машинного вязания, а также пряжи для производства камвольных тканей.    
                    </p>
                </div>
                <img src={historyImage} alt="История фабрики" /> 
            </div>
            
            <h2>Где купить</h2>
            <div className={s.mapContainer}>
                <div className={s.magnifier}>
                    <Link to="#"><img src={plus} alt="Увеличить" /></Link>
                    <Link to="#"><img src={minus} alt="Уменьшить" /></Link>
                </div>
                <div className={s.search_sity}>
                    <SearchCity />  
                </div>
            </div>
            
            <h2>Сертификаты</h2>
            <div className={s.slider_container}>
                <Slider />
            </div>
            
            <h2>Раскрытие информации</h2>
            <div className={s.links}>
                <h3>Раскрытие информации в сфере теплоснабжения и горячего водоснабжения</h3>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-1.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 1. ОБЩАЯ ИНФОРМАЦИЯ О РЕГУЛИРУЕМОЙ ОРГАНИЗАЦИИ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-2.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 2. ИНФОРМАЦИЯ О ТАРИФАХ НА ТЕПЛОВУЮ ЭНЕРГИЮ(МОЩНОСТЬ)</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-8.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 8. ИНФОРМАЦИЯ ОБ ОСНОВНЫХ ПОКАЗАТЕЛЯХ ФИНАНСОВО-ХОЗЯЙСТВЕННОЙ ДЕЯТЕЛЬНОСТИ РЕГУЛИРУЕМОЙ ОРГАНИЗАЦИИ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-9.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 9. ИНФОРМАЦИЯ ОБ ОСНОВНЫХ ПОТРЕБИТЕЛЬСКИХ ХАРАКТЕРИСТИКАХ РЕГУЛИРУЕМЫХ ТОВАРОВ И УСЛУГ РЕГУЛИРУЕМЫХ ОРГАНИЗАЦИЙ И ИХ СООТВЕТСТВИИ УСТАНОВЛЕННЫМ ТРЕБОВАНИЯМ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-11.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 11. ИНФОРМАЦИЯ О НАЛИЧИИ (ОТСУТСТВИИ) ТЕХНИЧЕСКОЙ ВОЗМОЖНОСТИ ПОДКЛЮЧЕНИЯ (ТЕХНОЛОГИЧЕСКОГО ПРИСОЕДИНЕНИЯ) К СИСТЕМЕ ТЕПЛОСНАБЖЕНИЯ, А ТАКЖЕ О РЕГИСТРАЦИИ И ХОДЕ РЕАЛИЗАЦИИ ЗАЯВОК НА ПОДКЛЮЧЕНИЕ (ТЕХНОЛОГИЧЕСКОЕ ПРИСОЕДИНЕНИЕ) К СИСТЕМЕ ТЕПЛОСНАБЖЕНИЯ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-12.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 12. ИНФОРМАЦИЯ ОБ УСЛОВИЯХ, НА КОТОРЫХ ОСУЩЕСТВЛЯЕТСЯ ПОСТАВКА РЕГУЛИРУЕМЫХ ТОВАРОВ И (ИЛИ) ОКАЗАНИЕ РЕГУЛИРУЕМЫХ УСЛУГ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-14.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 14. ИНФОРМАЦИЯ О СПОСОБАХ ПРИОБРЕТЕНИЯ, СТОИМОСТИ И ОБЪЕМАХ ТОВАРОВ, НЕОБХОДИМЫХ ДЛЯ ПРОИЗВОДСТВА РЕГУЛИРУЕМЫХ ТОВАРОВ И (ИЛИ) ОКАЗАНИЯ РЕГУЛИРУЕМЫХ УСЛУГ РЕГУЛИРУЕМОЙ ОРГАНИЗАЦИЕЙ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Forma-15.pdf' target='_blank' rel="noopener noreferrer">ФОРМА 15. ИНФОРМАЦИЯ О ПРЕДЛОЖЕНИИ РЕГУЛИРУЕМОЙ ОРГАНИЗАЦИИ ОБ УСТАНОВЛЕНИИ ЦЕН (ТАРИФОВ) В СФЕРЕ ТЕПЛОСНАБЖЕНИЯ НА ОЧЕРЕДНОЙ РАСЧЕТНЫЙ ПЕРИОД РЕГУЛИРОВАНИЯ</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Formy-predstavleniya-informatsii-podlezhaschei-raskrytiyu-organizatsiyami-osuschestvlyayuschimi-goryachee-vodosnabzhenie.pdf' target='_blank' rel="noopener noreferrer">Формы представления информации подлежащей раскрытию организациями осуществляющими горячее водоснабжение</Link></p>
                <p><Link to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Tipovoi-dogovor-teplosnabzheniya-i-goryachego-vodosnabzheniya.pdf' target='_blank' rel="noopener noreferrer">Форма типового договора теплоснабжения и горячего водоснабжения</Link></p>
                <h3>
                    <Link 
                        to='http://www.troitskwool.com/files/nodus_items/0067/33768/attaches/Formy-predstavleniya-informatsii-podlezhaschei-raskrytiyu-organizatsiyami-osuschestvlyayuschimi-vodootvedenie_1.pdf' 
                        target='_blank' 
                        rel="noopener noreferrer"
                    >
                        Раскрытие информации в сфере водоотведения →
                    </Link>
                </h3>
                <h3>
                    <Link to='/' className={s.arrow_link}>
                        Тарифы по регулируемым видам деятельности →
                    </Link>
                </h3>
            </div>
        </div>
    );
};