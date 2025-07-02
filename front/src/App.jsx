import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Root } from "./routes/Root/Root";
import { About, loader as aboutloader } from './routes/About/About';
import { Reviews } from "./routes/Reviews/Reviews";
import { Market } from "./routes/Market/Market";
import { ProductDetail } from "./routes/ProductDetail/ProductDetail";
import { Navigate } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: 'about',
        element: <About />,
        loader: aboutloader
      },
      {
        path: 'reviews',
        element: <Reviews />,
      },
      {
        path: 'market',
        element: <Market />,
      },
      {
        path: 'product/:id',
        element: <ProductDetail />,
      }
    ]
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;