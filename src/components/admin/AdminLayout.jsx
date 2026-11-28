import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader.jsx";

import MusicPlayer from "../MusicPlayer";
import BottomNav from "../BottomNav";

import "../../assets/css/appLayout.css";
import "../../assets/css/admin/adminLayout.css";


function AppLayout() {

  return (

    <div className="app admin-layout">

      <AdminSidebar />

      <div className="app-body">

        <AdminHeader />

        <main className="main-content">

          <Outlet />

        </main>

      </div>

      <MusicPlayer />

      <BottomNav />

    </div>

  );

}


export default AppLayout;