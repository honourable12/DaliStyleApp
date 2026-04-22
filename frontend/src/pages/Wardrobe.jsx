import React from 'react';

const Wardrobe = () => {
  return (
    <div>
      <h1>My Wardrobe</h1>
      <button>Upload New Item</button>
      <div className="wardrobe-grid">
        {/* Items will be mapped here */}
        <p>Your wardrobe is empty. Start adding items!</p>
      </div>
    </div>
  );
};

export default Wardrobe;
