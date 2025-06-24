import { createContext, use, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const apiUrl = "https://one-mb-backend.onrender.com"
    const [userLocation,setUserLocation] = useState({
        latitude: 0,
        longitude: 0
    })
  return (
    <AppContext.Provider value={{ user, setUser, userLocation, setUserLocation,apiUrl }}>
      {children}
    </AppContext.Provider>
  );
};
export default AppContext;