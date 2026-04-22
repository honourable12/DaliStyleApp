import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      <h1>{isLogin ? 'Login' : 'Register'}</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>Email:</label>
          <input type="email" required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" required />
        </div>
        {!isLogin && (
          <div>
            <label>Confirm Password:</label>
            <input type="password" required />
          </div>
        )}
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'blue' }}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </p>
    </div>
  );
};

export default Auth;
