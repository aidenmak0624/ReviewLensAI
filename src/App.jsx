import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewProduct from "./pages/NewProduct";
import Product from "./pages/Product";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewProduct />} />
        <Route path="product" element={<Product />} />
      </Route>
    </Routes>
  );
}

export default App;
