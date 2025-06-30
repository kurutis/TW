const initialState = {
  cities: [
    { id: 1, city: 'Троицк', address: 'Фабричная площадь, дом 1' },
    { id: 2, city: 'Москва', address: 'ул. 5-ая Кабельная, д.3, м. ст. метро Авиамоторная' },
    { id: 3, city: 'Москва', address: 'ул. Амундсена д.3, корп.2, м. ст. метро Свиблово' },
    { id: 4, city: 'Москва', address: 'ул. Адмирала Макарова, д.2, корп.77, м. ст. метро Водный стадион' },
  ],
  filteredCities: [],
  loading: false,
  error: null
};

const citiesReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FILTER_CITIES':
      const searchTermLower = action.payload.toLowerCase();
      return {
        ...state,
        filteredCities: state.cities.filter(city =>
          city.city.toLowerCase().includes(searchTermLower) ||
          city.address.toLowerCase().includes(searchTermLower)
        ),
      };
    case 'SET_CITIES':
      return { ...state, cities: action.payload, filteredCities: action.payload };
    default:
      return state;
  }
};

export default citiesReducer;