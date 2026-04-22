import React from 'react';

const Favourites = () => {
  return (
    <div>
      <h1>My Favourites</h1>
      <div className="favourites-grid">
        {/* Favourite looks will be mapped here */}
        <p>You haven't saved any looks yet.</p>
      </div>
    </div>
  );
};

export default Favourites;
