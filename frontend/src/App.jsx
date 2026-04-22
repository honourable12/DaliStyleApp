import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';
import Wardrobe from './pages/Wardrobe';
import DailyLook from './pages/DailyLook';
import Favourites from './pages/Favourites';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/">Daily Look</Link>
          <Link to="/wardrobe">Wardrobe</Link>
          <Link to="/favourites">Favourites</Link>
          <Link to="/auth">Login/Register</Link>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<DailyLook />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
