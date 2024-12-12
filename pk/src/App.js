import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import Contacts from "./components/Contacts";
import Login from "./components/Login";
import Register from "./components/Register";
import Welcome from "./components/Welcome"; 
import AdminPanel from "./components/AdminPanel"; 
import CreateUser from "./components/CreateUser";
import EditUser from "./components/EditUser";
import CreateColumn from "./components/CreateColumn";
import DeleteColumn from './components/DeleteColumn';

function App() {
    return (
        <Router>
            <div className="wrapper">
                <Header />
                <Routes>
                    <Route path="/" element={<AboutUs />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/admin-panel" element={<AdminPanel />} /> 
                    <Route path="/create-user" element={<CreateUser />} /> 
                    <Route path="/edit-user/:id" element={<EditUser />} /> 
                    <Route path="/create-column" element={<CreateColumn />} />
                    <Route path="/delete-column" element={<DeleteColumn />} /> {/* Добавьте маршрут здесь */}
                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;